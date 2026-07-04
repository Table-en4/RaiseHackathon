# Gavel — SUSE / Rancher / Application Collection Setup

Commands only. Run on a machine with Rancher Desktop or a Rancher-managed cluster.

## Prerequisites

```bash
# macOS / Linux
docker --version
helm version
kubectl version --client
```

## Option A — Paris hackathon bootstrap (preferred at RAISE)

```bash
git clone git@gitlab.com:eschabell/rancher-hackathon-paris.git
cd rancher-hackathon-paris
./init.sh <hackathon-registration-email>
```

If MCP auth fails:

```bash
./init.sh --mcp-proxy
```

Deploy image pull secret to app namespace:

```bash
./init.sh --deploy-secret gavel
```

## Option B — Manual bootstrap (if Paris repo unavailable)

```bash
# Start Rancher Desktop with Kubernetes enabled (GUI or headless)
# Wait until kubectl works:
kubectl get nodes
# Expected: node Ready

# Log into hackathon registry (credentials from SUSE mentors)
docker login <hackathon-registry>
helm registry login <hackathon-registry>

# Create namespaces
kubectl apply -f k8s/namespace.yaml

# Install Application Collection extension (Rancher UI or CLI per mentor docs)
# Generate MCP config for Cursor — see mcp.json.example in repo root

# Deploy pull secret (replace with mentor-provided credentials)
kubectl create secret docker-registry gavel-pull-secret \
  --namespace=gavel \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<password>
```

## Verify cluster foundation

```bash
kubectl get nodes
kubectl get ns gavel gavel-ai
kubectl apply -f k8s/hello-world.yaml
kubectl get pods -n gavel
kubectl delete pod hello-world -n gavel
```

## Application Collection — test chart pull

```bash
helm search repo application-collection  # after adding AC helm repo per mentor docs
# Or via Rancher UI: Apps > Application Collection
```

## MCP configuration

Copy and customize:

```bash
cp mcp.json.example .cursor/mcp.json
# If auth fails, run init.sh --mcp-proxy and point MCP at the proxy URL
```

## Namespaces

| Namespace   | Workloads                          |
| ----------- | ---------------------------------- |
| `gavel`     | Next.js app, ingress, secrets      |
| `gavel-ai`  | Ollama, optional Redis/PostgreSQL  |

## Deploy Gavel app (after Phase 1 image build)

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
# Create secret from local env (never commit real values):
kubectl create secret generic gavel-secrets \
  --namespace=gavel \
  --from-env-file=.env.production
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Local fallback (venue WiFi down)

```bash
kubectl apply -f k8s/cloudflared.yaml   # Cloudflare Tunnel to local k3s
# Or: pnpm dev with .env.local mirroring k8s secrets
```
