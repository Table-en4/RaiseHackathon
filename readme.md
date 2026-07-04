# Gavel — Your Live-Auction Bidding Copilot

> Serious collectors track dozens of lots across eBay, Drouot, Catawiki and auction houses. During a live sale, lots close in seconds, comparables are scattered across ten browser tabs, the material is ambiguous, and you have to commit a max bid *right now* under a falling hammer. Gavel is the copilot for that moment: as a lot heats up it surfaces everything you need to decide — comparables from past sales + live web research, a suggested max, a material read, current price vs. your ceiling — as one calm advisory. The agents prepare and advise; **you decide and bid, in one tap.**

**RAISE Summit Hackathon 2026 · Cursor track** · *(name is a working title — rename freely)*

---

## The problem (real — and one the builder has firsthand)

Bidding in live auctions is high-pressure, information-poor decision-making. You're watching many lots at once; one suddenly accelerates; you have ~60 seconds to know what it's worth, whether the material claim holds up, and how far you'll go — with the price climbing the whole time. Today that's done across a dozen tabs, a spreadsheet of past sales, and gut feel. The decision is the hard part, and nothing is designed for it.

Gavel puts a calm, crafted decision surface in that gap. Not a bot that bids for you. Not a wall of dashboards. A single focused advisory at the moment it matters, and a confident tap.

## Why Cursor (this is our definition of done)

Cursor's track rewards a real problem solved through **design, art, interaction, and a thoughtful journey**. Gavel's substance *is* the interaction: designing confident decisions under a closing-auction countdown.

- [ ] A real daily problem, with a real user — the builder is a collector who does this by hand
- [ ] The hero is the **decision moment** — a crafted, focused advisory, never a dashboard
- [ ] A complete **journey**: watching → a lot heats up → the advisory materializes → decide & bid → it learns your taste for the next lot
- [ ] **Motion and craft carry it**: the closing-clock tension, the way the advisory resolves into focus, the tactile one-tap
- [ ] **Beautiful by design** — the demo vertical (montre,RAM,Hardware) is texture, color, and character, not gray B2B chrome

## Two hard guardrails (this is what gets you disqualified)

### 1. Human-in-the-loop bidding — never autonomous

No unattended bot bidding and no scraping against eBay / Drouot / Catawiki — that violates their terms of service, and "violate legal, ethical, or platform policies" is an **instant disqualification**. The agents do all the analysis; **the human places every bid.** In the real product, bids go through official platform APIs where they exist. For the demo we **replay a simulated live auction** so we control the moment and touch no real platform.

### 2. Not a dashboard-as-main-feature

The advisory + the human's confident tap is the product. Metrics appear *only* to justify the one decision on screen. If a judge's takeaway is "nice dashboard," we've lost the track. One lot in focus at a time, minimal chrome.

## Tech stack (design-weighted)

- **App:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4
- **Motion & craft:** Framer Motion (`motion/react`) — this is the scored axis on this track, treat it as first-class
- **Realtime:** SSE (simulated live-auction feed) or simple polling
- **Agent:** any LLM provider via a thin client (you have **$300 Cursor credits**)
- **Comparables:** a seed past-sales dataset you have rights to + a live web-research pass (cite sources)
- **Price bands / sparklines:** lightweight custom SVG or Recharts
- **State:** in-memory for the demo · optional Neon + Drizzle for the persisted taste profile

## Architecture (light on purpose — the agent supports the craft)

```
[Auction-feed simulator] --lot events (ticking clock)--> [Copilot agent] --advisory JSON--> [Advisory hero UI]
        ^                                                     ^                                    |
        |                                          [Comparables + research]                 (you: adjust max,
        |                                           (past sales + web)                        tap Place Bid)
        |                                                                                          |
        +--------------------- your decision feeds the next advisory (taste memory) <--------------+
```

The agent stays simple and reliable. On a design track the intelligence exists to make the decision surface trustworthy, not to show off.

## Proposed repo structure

```
/app            Next.js routes (feed SSE, advisory stream, place-bid action)
/components     UI — the advisory hero (the app), lot feed, price band
/lib
  contracts.ts  <- shared lot + advisory schemas (lock this first)
  simulator/    replayed live-auction feed with a closing clock
  comparables/  past-sales seed data + web-research pass
  agent/        LLM client, prompt, advisory JSON schema, parser
  taste/        override memory -> re-injected so advisories learn your taste
```

## Getting started

```bash
git clone <repo> && cd gavel
pnpm install
cp .env.example .env.local   # add your LLM key
pnpm dev
```

---

## Team plan — by role (1 infra · 2 backend · 1 front · 1 floater)

Honest read: this is a backend-heavy team on a **design** track — the scored axis is craft and interaction, and only one of five is a front specialist. Two consequences, baked into this plan: **backend scope stays deliberately small** (contract-complete by Saturday dinner, then swing to polish/QA), and the **floater spends most of the event on the design side**. The front owner is the bottleneck of the whole project — everyone protects their time.

**Shared contract — lot event** (the simulator emits these):
```ts
type LotEvent = {
  id: string; ts: number;
  lotId: string; title: string;
  platform: "ebay" | "drouot" | "catawiki" | "house";
  imageUrl?: string;
  currentBid: number; currency: string;
  bidCount: number; closesInSec: number;         // the closing clock
  category: string;                              // e.g. "phenolic-resin"
  attributes?: Record<string, string>;           // material claims, provenance
};
```

**Shared contract — bid advisory** (what the hero renders):
```ts
type BidAdvisory = {
  lotId: string;
  suggestedMax: number; currency: string;
  confidence: number;                            // 0..1
  materialRead?: string;                         // "reads as catalin, not amino resin"
  comparables: { title: string; soldPrice: number; source: string; date: string }[];
  advisory: string;                              // plain-language decision prompt
  rationale: string;
  learnsFrom?: string;                           // callback to your past calls — learning made visible
};
```

### Hour 0 — together (~30–45 min)

- [ ] **Infra** creates the public repo, protects `main`, agrees PR flow, scaffolds Next.js 15 + React 19 + Tailwind v4 + Framer Motion, and gets a deploy (e.g. Vercel) green from the first commit
- [ ] **Floater** runs the 20-min design-direction session — moodboard, type, color, motion feel. This is a design track: decide the aesthetic *before* any UI is written
- [ ] Everyone submits the Cursor Google Form ($300 credits per dev)
- [ ] Paste the two contracts above into `/lib/contracts.ts` and **freeze them**
- [ ] Lock the 60s demo storyline + the demo vertical (vintage phenolic-resin lots)

### ⚙️ Infra — foundation, pipes & the simulator

- [ ] Repo hygiene, env/secrets (`.env.example`, LLM key distribution), CI green, deploy from commit #1 — the demo must run on a real URL, never localhost roulette
- [ ] SSE endpoint + client wiring — the realtime pipe everyone else builds on
- [ ] **The auction-feed simulator**: `LotEvent` generator with ticking clocks, heat-up curves, several lots in parallel
- [ ] Admin trigger ("make lot 47 heat up now") so the demo hits the money moment on cue
- [ ] Assume venue wifi is bad (it's literally [TBD] in the event doc): everything must also run fully local, plus keep a screen-recorded backup of the happy path
- [ ] Own integration plumbing end-to-end; unblock anyone whose piece won't connect

### 🔧 Backend A — comparables & research

- [ ] Past-sales seed dataset (rights-safe), realistic for phenolic-resin lots — pair with the floater on content
- [ ] Live web-research pass for recent comparable sales (**cite sources**)
- [ ] Price band + suggested max derived from the comparables
- [ ] Simple material/authenticity signal from lot attributes
- [ ] Expose `getComparables(lot)` and `getSuggestedBand(lot)` for the agent
- [ ] **Contract-complete by Saturday dinner** — then swing to QA and polish support

### 🔧 Backend B — copilot agent & taste memory

- [ ] LLM round-trip via a thin client; verify early that it works from the venue network
- [ ] Prompt: lot + comparables → structured `BidAdvisory`; parse, validate, retry on malformed output
- [ ] **Latency budget: advisory on screen in ≤2–3s** or the closing-clock moment dies — pre-warm/cache for the demo lots
- [ ] Taste memory: store `(lot → decision)`, re-inject as few-shot so `learnsFrom` references past calls in the advisory text
- [ ] Keep it simple and reliable — the agent serves the craft, it isn't the show
- [ ] **Contract-complete by Saturday dinner** — then swing to QA and polish support

### 🎨 Front — the advisory hero (the scored axis)

- [ ] Design system: type scale, color, spacing, and the calm-vs-closing visual states
- [ ] **The advisory hero card** — the single focused surface that *is* the app
- [ ] Closing-clock treatment: tension without panic
- [ ] Tactile **Place Bid** — it must feel decisive and physical
- [ ] Motion (Framer Motion): how the advisory materializes as a lot accelerates
- [ ] Touches zero backend. If blocked, the floater or a contract-complete backend takes the blocker — never the other way around

### 🔀 Floater — force multiplier, weighted ~70% to the design side

- [ ] Hour 0: run the design-direction session (above)
- [ ] Assets: lot images & textures — rights-safe (the collector's own photos of faturan/bakelite pieces are perfect: authentic *and* no rights issues)
- [ ] Microcopy: the advisory voice — plain-language, calm, confident (on this track, words are UX)
- [ ] From mid-afternoon: pair with Front on micro-interactions, transitions, polish; QA the full journey end-to-end
- [ ] Own the demo: choreograph the 60s, rehearse against the clock, **record the 1-min video** (required by the submission form — YouTube/Loom), run the compliance checklist
- [ ] Roving unblocker — whoever is stuck gets the floater first

### Sync points (doors close Sat 10PM · submissions Sun 12PM)

| When | Everyone must be able to see |
|---|---|
| Sat 2:00PM | Contracts frozen; first simulated `LotEvent` rendered on screen via SSE |
| Sat 6:00PM (dinner) | End-to-end happy path: lot heats up → advisory renders → Place Bid works |
| Sat 9:30PM | Feature-freeze target — leave the venue with a working demo |
| Sun 9:00AM | Polish, motion, copy only — no new features |
| Sun 10:30AM | Record the 1-min video; run the compliance checklist |
| Sun 11:30AM | Submitted, with 30 min of buffer |

---

## Demo checklist (60s — 50% of the score)

- [ ] **0:00** A quiet board of lots you're watching (vintage phenolic-resin), calm and composed
- [ ] **0:10** Lot 47 — a faturan sphere — heats up: bids climbing, ~90s to close. The advisory hero resolves into focus
- [ ] **0:20** Advisory: *"Comparable spheres sold €200–280 (3 sources). You're at €120, 90s left. Reads as catalin. Suggested max €250. Bid?"*
- [ ] **0:35** You nudge max to €230 and tap **Place Bid** — decisive, tactile
- [ ] **0:45** Next lot heats up; the advisory references your last call — *"you held firm under €240 last time — suggesting €220 here."* It learns your taste
- [ ] **0:55** Close: *"Ten tabs and a gut feeling, replaced by one calm decision under the hammer."*

## Deployed on SUSE

Gavel runs on **SUSE Rancher** and **Application Collection** — the same curated stack used at RAISE Paris — with our copilot agent on in-cluster LLM inference (Ollama), a simulated live-auction feed over SSE, and a public HTTPS demo URL that still works if venue WiFi dies.

- Rancher Desktop / k3s local cluster (or remote Rancher-managed cluster)
- SUSE Application Collection for curated workloads (PostgreSQL, Redis, Ollama, ingress)
- MCP-driven deployment from Cursor
- Human-in-the-loop compliance: simulated auction feed, no autonomous bidding

### Infra quick start

```bash
# Cluster setup — see docs/infra-setup.md
kubectl apply -f k8s/namespace.yaml

# Local dev
pnpm install
cp .env.example .env.local
pnpm dev
```

### API contract

See [docs/env-contract.md](docs/env-contract.md) for routes, env vars, and teammate integration surfaces.

### Demo day

See [docs/demo-day.md](docs/demo-day.md) for pre-demo commands, fallback tiers, and troubleshooting.

### PR flow

1. Branch from `main` / `master`: `cursor/<descriptive-name>-5364`
2. Open PR; CI must pass lint + build + Docker
3. Merge to `main` triggers deploy to `gavel` namespace

---


- [ ] Repo is **public**
- [ ] **Everything** built during the event — no reused code (in particular, no reusing any existing monitoring/auction bots)
- [ ] **Human-in-the-loop bidding only** — no autonomous bot or scraping against real platforms
- [ ] **Not** a dashboard-as-main-feature — the advisory + the human's tap is the product
- [ ] The demo clearly shows what *we* built at the event
