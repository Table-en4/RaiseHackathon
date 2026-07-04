"""
Endpoints
---------
GET  /health
    Liveness + row count + whether Exa is configured.

GET  /api/comparables?query=<text>&category=<watches|bags|ram>&limit=5
    Up to `limit` comparable sales for an item: live web (Exa) enriched with
    the seed dataset, deduped. This is what the advisory card lists.

GET  /api/median?query=<text>&category=&min_price=&max_price=
    Market summary for an item: median across the FULL multi-source pool
    (live web + stored DB rows + seed), plus band, suggestedMax, and the
    distinct sources backing the number.

GET  /api/estimate?query=<text>&category=
    One-call market view: pulls products from every source and returns the
    SOLD median (seed + DB + Exa) and the ASKING median (live eBay listings)
    side by side, plus a suggestedMax based on realized sales.

GET  /api/asking?query=<text>&limit=10
    Live ASKING prices from active eBay listings (official Browse API).
    Secondary signal only — these are current listings, not realized sales.

POST /api/material-signal
    Evaluates material authenticity based on lot attributes.
    Body: { "attributes": { "material": "amino resin", ... } }

POST /api/refresh
  { "query": "...", "category": "..." }
    Force a live web fetch and persist the results to the DB. Use this to
    warm the store for demo items.
"""

from __future__ import annotations

import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

import db
from ebay_client import search_active_listings
from exa_client import search_web_sales
from market import dedupe, percentile, summarize, check_material_authenticity
from seed import categories, seed_sales
from ebay import EbayCollector

collector = EbayCollector()

load_dotenv()

app = Flask(__name__)
CORS(app)

db.init_db()

def _pool(query: str, category: str | None) -> list[dict]:
    """Merge every source into one sale pool for a query."""
    web = search_web_sales(query)
    if web:
        db.save_sales(query, web)
    stored = db.get_saved_sales(query)
    seed = seed_sales(query, category)
    return dedupe([*web, *stored, *seed])

@app.get("/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "exaConfigured": bool(os.environ.get("EXA_API_KEY")),
            "ebayConfigured": bool(
                os.environ.get("EBAY_CLIENT_ID") and os.environ.get("EBAY_CLIENT_SECRET")
            ),
            "storedSales": db.count_rows(),
            "categories": categories(),
        }
    )

@app.get("/api/comparables")
def comparables():
    query = (request.args.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400

    category = request.args.get("category")
    try:
        limit = min(max(int(request.args.get("limit", 5)), 1), 20)
    except ValueError:
        limit = 5

    web = search_web_sales(query)
    if web:
        db.save_sales(query, web)

    seed = seed_sales(query, category)

    # Seed as reliable base, up to 2 live web picks layered in — always <= limit
    max_web = max(2, limit - len(seed))
    web_titles = {s["title"].lower() for s in seed}
    web_picks = [c for c in web if c["title"].lower() not in web_titles][:max_web]

    merged = [*seed[: limit - len(web_picks)], *web_picks]
    return jsonify({"query": query, "category": category, "comparables": merged})

@app.get("/api/median")
def median():
    query = (request.args.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400

    category = request.args.get("category")

    def _num(name):
        raw = request.args.get(name)
        if raw is None or raw == "":
            return None
        try:
            return float(raw)
        except ValueError:
            return None

    pool = _pool(query, category)
    result = summarize(pool, min_price=_num("min_price"), max_price=_num("max_price"))

    if result is None:
        return jsonify({"query": query, "category": category, "result": None}), 404

    # Trim the echoed sales list for a lighter payload
    result["sales"] = result["sales"][:10]
    return jsonify({"query": query, "category": category, **result})

@app.get("/api/estimate")
def estimate():
    query = (request.args.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400

    category = request.args.get("category")

    # Realized sales: seed + stored DB rows + Exa live pass.
    full = summarize(_pool(query, category))
    suggested_max = full["suggestedMax"] if full else None
    sold = None
    if full is not None:
        sold = {
            "median": full["median"],
            "low": full["low"],
            "high": full["high"],
            "sampleSize": full["sampleSize"],
            "sources": full["sources"],
            "sales": full["sales"][:5],
        }

    # Current market: live eBay listings (asking / current-bid prices).
    listings = search_active_listings(query, limit=100)
    asking = None
    if listings:
        prices = sorted(l["askingPrice"] for l in listings)
        asking = {
            "median": percentile(prices, 0.5),
            "low": prices[0],
            "high": prices[-1],
            "sampleSize": len(prices),
            "listings": listings[:5],
        }

    if sold is None and asking is None:
        return jsonify({"query": query, "category": category, "result": None}), 404

    return jsonify(
        {
            "query": query,
            "category": category,
            "sold": sold,          # realized sale prices — the trustworthy signal
            "asking": asking,      # live listings — context only, sellers are optimistic
            # suggestedMax only from realized sales; never from asking prices.
            "suggestedMax": suggested_max,
        }
    )

@app.get("/api/asking")
def asking():
    query = (request.args.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400

    try:
        limit = min(max(int(request.args.get("limit", 10)), 1), 50)
    except ValueError:
        limit = 10

    listings = search_active_listings(query, limit=limit)

    summary = None
    if listings:
        prices = sorted(l["askingPrice"] for l in listings)
        summary = {
            "medianAsking": percentile(prices, 0.5),
            "low": prices[0],
            "high": prices[-1],
            "sampleSize": len(prices),
        }

    return jsonify(
        {
            "query": query,
            "note": "Asking prices from live eBay listings — not realized sale prices.",
            "listings": listings,
            "summary": summary,
        }
    )

@app.post("/api/material-signal")
def material_signal():
    body = request.get_json(silent=True) or {}
    attributes = body.get("attributes")
    
    result = check_material_authenticity(attributes)
    
    return jsonify({
        "material_authenticity_signal": result["signal"],
        "explanation": result["explanation"]
    })

@app.post("/api/refresh")
def refresh():
    body = request.get_json(silent=True) or {}
    query = (body.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400

    # Pre-warm path: not latency-critical, so give Exa room to answer even
    # on bad venue wifi. The advisory-path calls keep the tight default.
    web = search_web_sales(query, timeout=12.0)
    inserted = db.save_sales(query, web)

    return jsonify(
        {
            "query": query,
            "fetched": len(web),
            "inserted": inserted,
            "exaConfigured": bool(os.environ.get("EXA_API_KEY")),
        }
    )


@app.get("/auctions")
def get_auctions():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({"error": "Le paramètre 'query' est requis."}), 400

    min_price_raw = request.args.get("min_price")
    max_price_raw = request.args.get("max_price")
    marketplace = request.args.get("marketplace", "EBAY_FR")
    currency = request.args.get("currency", "EUR")

    try:
        min_price = float(min_price_raw) if min_price_raw is not None else None
        max_price = float(max_price_raw) if max_price_raw is not None else None
    except ValueError:
        return jsonify({"error": "Les paramètres min_price et max_price doivent être numériques."}), 400

    results = collector.get_auctions(
        query=query,
        min_price=min_price,
        max_price=max_price,
    )

    if not isinstance(results, list):
        return jsonify({"error": "La collecte a échoué."}), 500

    return jsonify({
        "query": query,
        "filters": {
            "min_price": min_price,
            "max_price": max_price,
            "marketplace": marketplace,
            "currency": currency,
        },
        "count": len(results),
        "results": results,
    })


@app.get("/items/<item_id>")
def get_item_details(item_id):
    if not item_id:
        return jsonify({"error": "Le paramètre 'item_id' est requis."}), 400

    details = collector.get_product_details(item_id)
    if details is None:
        return jsonify({"error": "Produit introuvable."}), 404

    return jsonify({
        "item_id": item_id,
        "details": details,
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)

