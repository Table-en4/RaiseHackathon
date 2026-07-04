from flask import Flask, jsonify, request

from ebay import EbayCollector

app = Flask(__name__)
collector = EbayCollector()


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "ebay-api"})


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
    app.run(debug=True, host="0.0.0.0", port=5000)

