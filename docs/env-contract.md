# Gavel — Environment & API Contract

Share this with frontend and backend teammates once infra is deployed.

## Public URLs

| Key | Example |
| --- | ------- |
| `APP_URL` / `PUBLIC_URL` | `https://gavel.example.com` |
| SSE feed | `GET {APP_URL}/api/feed` (`text/event-stream`, `LotEvent` JSON) |

## API routes

| Route | Method | Body | Response | Owner |
| ----- | ------ | ---- | -------- | ----- |
| `/api/health` | GET | — | `{ status: "ok", llm: "reachable" \| "unreachable" }` | Infra |
| `/api/feed` | GET (SSE) | — | `LotEvent` stream | Infra |
| `/api/admin/heat-up` | POST | `{ lotId }` + `X-Admin-Token` | `{ ok: true }` | Infra |
| `/api/advisory` | POST | `{ lot: LotEvent }` | `BidAdvisory` | Backend B |
| `/api/bid` | POST | `{ lotId, maxBid }` | `{ ok: true }` | Backend B |

## Kubernetes secret `gavel-secrets`

| Variable | Purpose |
| -------- | ------- |
| `LLM_URL` | Internal Ollama/vLLM URL |
| `LLM_MODEL` | e.g. `llama3.2` |
| `ADMIN_TOKEN` | Protects `/api/admin/heat-up` |
| `USE_EXTERNAL_LLM` | `true` / `false` |
| `OPENAI_API_KEY` | External LLM fallback |
| `DATABASE_URL` | Optional PostgreSQL |
| `REDIS_URL` | Optional Redis |
| `PUBLIC_URL` | Public demo URL |
| `NODE_ENV` | `production` in cluster |

## Local dev

```bash
git clone https://github.com/table-en4/raisehackathon.git && cd raisehackathon
pnpm install
cp .env.example .env.local
pnpm dev
```

## Rules

- Frontend consumes SSE only; no direct LLM calls
- All LLM calls are server-side only
- Frontend uses `lib/contracts.ts` types only — no backend implementation imports

## Backend integration surfaces

```ts
// lib/comparables/index.ts — Backend A implements
getComparables(lot: LotEvent): Promise<Comparable[]>
getSuggestedBand(lot: LotEvent): Promise<SuggestedBand>

// lib/agent/index.ts — Backend B implements
generateAdvisory(lot: LotEvent): Promise<BidAdvisory>
```
