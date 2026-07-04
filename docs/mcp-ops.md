# MCP commands used during hackathon

Requires `.cursor/mcp.json` from `mcp.json.example` or Paris `init.sh`.

## 1. Deploy Redis (taste cache)

```
Deploy Valkey/Redis from Application Collection into namespace gavel-ai.
Expose ClusterIP on port 6379 and set REDIS_URL in gavel-secrets.
```

## 2. Check Ollama pods

```
List pods in namespace gavel-ai with label app=ollama.
Show logs if not Ready.
```

## 3. Upgrade ingress timeouts for SSE

```
Ensure nginx ingress in namespace gavel has proxy-read-timeout and
proxy-send-timeout of 3600s for the gavel Ingress.
```

## Manual equivalents

```bash
kubectl apply -f k8s/ollama.yaml
kubectl get pods -n gavel-ai
kubectl apply -f k8s/ingress.yaml
```
