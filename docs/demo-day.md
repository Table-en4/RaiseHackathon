# Gavel — Demo Day Runbook

One page. Primary → secondary → tertiary fallback.

## URLs

| Tier | URL | When |
| ---- | --- | ---- |
| Primary | `https://gavel.example.com` (cluster ingress) | Normal demo |
| Secondary | `pnpm dev` on laptop + Cloudflare Tunnel | Venue WiFi down |
| Tertiary | Pre-recorded 60s video | Total failure |

Update `PUBLIC_URL` in k8s ConfigMap and `.env.local` with the real URL before freeze.

## Pre-demo (5 min before pitch)

```bash
export APP_URL=https://gavel.example.com
export ADMIN_TOKEN=<from-secret>

# Health
curl -s "$APP_URL/api/health" | jq .

# Pre-warm advisory for demo lot
./scripts/pre-warm.sh

# Heat up lot 47 (~10s before recording)
curl -X POST "$APP_URL/api/admin/heat-up" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $ADMIN_TOKEN" \
  -d '{"lotId":"47"}'
```

## 60s demo choreography

| Time | Action |
| ---- | ------ |
| 0:00 | Quiet board — SSE feed running |
| 0:10 | Lot 47 heats up; advisory resolves |
| 0:20 | Comparables, material read, suggested max visible |
| 0:35 | Place Bid tap |
| 0:45 | Next lot; `learnsFrom` taste memory |
| 0:55 | Close tagline |

## If X breaks, do Y

| Symptom | Fix |
| ------- | --- |
| Site 502 | `kubectl get pods -n gavel` → restart: `kubectl rollout restart deployment/gavel -n gavel` |
| SSE disconnects | Check ingress timeouts in `k8s/ingress.yaml`; refresh browser |
| Advisory slow (>3s) | Set `USE_EXTERNAL_LLM=true` in secret; or use fallback (already built-in) |
| LLM pod down | `kubectl get pods -n gavel-ai` → `kubectl apply -f k8s/ollama.yaml` |
| No public URL | Apply `k8s/cloudflared.yaml` with tunnel token; or `pnpm dev` locally |
| Admin heat-up fails | Check `X-Admin-Token` matches `ADMIN_TOKEN` secret |

## Local fallback (no WiFi)

```bash
cp .env.example .env.local
# Set ADMIN_TOKEN, optional OPENAI_API_KEY
pnpm dev
# In another terminal:
curl -X POST http://localhost:3000/api/admin/heat-up \
  -H "X-Admin-Token: $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lotId":"47"}'
```

## kubectl quick reference

```bash
kubectl get pods -n gavel
kubectl get pods -n gavel-ai
kubectl logs deployment/gavel -n gavel --tail=50
kubectl rollout restart deployment/gavel -n gavel
```
