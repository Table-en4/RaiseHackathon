# Gavel — SUSE / Rancher / Application Collection Setup

Commands only. Infra foundation — no application code in this repo.

## Prerequisites

```bash
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
# Start Rancher Desktop with Kubernetes enabled
kubectl get nodes   # Expected: Ready

# Registry auth (credentials from SUSE mentors)
docker login <hackathon-registry>
helm registry login <hackathon-registry>

# Namespaces
kubectl apply -f k8s/namespace.yaml

# Application Collection extension (Rancher UI or mentor docs)
# MCP config — see mcp.json.example

# Pull secret (replace with mentor credentials)
kubectl create secret docker-registry gavel-pull-secret \
  --namespace=gavel \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<password>
```

## Verify cluster foundation

```bash
./scripts/verify-cluster.sh
```

Or manually:

```bash
kubectl get nodes
kubectl get ns gavel gavel-ai
kubectl apply -f k8s/samples/hello-world-pod.yaml
kubectl wait --for=condition=Ready pod/hello-world -n gavel --timeout=60s
kubectl delete -f k8s/samples/hello-world-pod.yaml
```

## Application Collection — test chart pull

```bash
helm search repo application-collection
# Or via Rancher UI: Apps > Application Collection
```

## MCP configuration

```bash
cp mcp.json.example .cursor/mcp.json
# If auth fails: ./init.sh --mcp-proxy
```

## Namespaces

| Namespace  | Workloads |
| ---------- | --------- |
| `gavel`    | Sample nginx workload, ingress, secrets |
| `gavel-ai` | Ollama, optional Redis/PostgreSQL (via Application Collection) |

## Deploy infrastructure

```bash
./scripts/deploy-all.sh
```

Ordered apply:

1. `k8s/namespace.yaml`
2. `k8s/samples/nginx-demo.yaml` — public sample image (`nginxdemos/hello`)
3. `k8s/platform/ingress.yaml` — HTTPS routing
4. `k8s/ai/ollama.yaml` — optional in-cluster LLM
5. `k8s/platform/cloudflared.yaml` — optional tunnel (`DEPLOY_TUNNEL=true`)

Secrets (never commit real values):

```bash
# From templates:
kubectl apply -f k8s/secrets/pull-secret.yaml      # after filling in registry creds
kubectl create secret generic gavel-infra-secrets \
  --namespace=gavel \
  --from-literal=CLOUDFLARE_TUNNEL_TOKEN=<token>
```

## Local fallback (venue WiFi down)

```bash
DEPLOY_TUNNEL=true ./scripts/deploy-all.sh
# Or port-forward:
kubectl port-forward svc/nginx-demo 8080:80 -n gavel
```

See [deploy-runbook.md](deploy-runbook.md) for troubleshooting.
