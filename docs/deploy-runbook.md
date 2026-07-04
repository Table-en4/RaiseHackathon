# Gavel — Infrastructure Deploy Runbook

One page. Infra only — no application code in this repo.

## URLs

| Tier | Target | When |
| ---- | ------ | ---- |
| Primary | `https://gavel.example.com` → nginx sample page | Normal demo / verify |
| Secondary | Cloudflare Tunnel to local k3s | Venue WiFi down |
| Tertiary | `kubectl port-forward svc/nginx-demo 8080:80 -n gavel` | Last resort |

Update `gavel.example.com` in [`k8s/platform/ingress.yaml`](../k8s/platform/ingress.yaml) before deploy.

## Deploy

```bash
# Full stack
./scripts/deploy-all.sh

# Verify
./scripts/verify-cluster.sh

# Optional: with tunnel
DEPLOY_TUNNEL=true ./scripts/deploy-all.sh
```

## Verify public HTTPS

```bash
export APP_URL=https://gavel.example.com
curl -s "$APP_URL"
# Expected: nginx "hello" plain-text response
```

## If X breaks, do Y

| Symptom | Fix |
| ------- | --- |
| Site 502 | `kubectl get pods -n gavel` → `kubectl rollout restart deployment/nginx-demo -n gavel` |
| TLS cert pending | `kubectl get certificate -n gavel` → check cert-manager ClusterIssuer |
| Image pull error | Apply pull secret: `kubectl apply -f k8s/secrets/pull-secret.yaml` (from mentor creds) |
| Ingress not routing | `kubectl describe ingress gavel -n gavel` — confirm backend is `nginx-demo:80` |
| Ollama not Ready | `kubectl get pods -n gavel-ai` → `kubectl logs deployment/ollama -n gavel-ai` |
| No public URL | `kubectl apply -f k8s/platform/cloudflared.yaml` with tunnel token in secret |
| Namespace missing | `kubectl apply -f k8s/namespace.yaml` |

## Port-forward fallback

```bash
kubectl port-forward svc/nginx-demo 8080:80 -n gavel
curl http://localhost:8080
```

## kubectl quick reference

```bash
kubectl get nodes
kubectl get pods -n gavel
kubectl get pods -n gavel-ai
kubectl get ingress -n gavel
kubectl rollout status deployment/nginx-demo -n gavel
```

## What teammates add later

Application code (Next.js, SSE, agent) deploys into namespace `gavel` separately. This repo provides namespaces, ingress, sample workload, and optional Ollama in `gavel-ai`.
