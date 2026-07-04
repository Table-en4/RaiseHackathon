# MCP commands used during hackathon

Requires `.cursor/mcp.json` from `mcp.json.example` or Paris `init.sh`.

## 1. Deploy Redis (optional cache)

```
Deploy Valkey/Redis from Application Collection into namespace gavel-ai.
Expose ClusterIP on port 6379.
```

## 2. Check Ollama pods

```
List pods in namespace gavel-ai with label app=ollama.
Show logs if not Ready.
```

## 3. Check ingress routing

```
Describe Ingress gavel in namespace gavel.
Confirm backend service is nginx-demo on port 80.
```

## Manual equivalents

```bash
kubectl apply -f k8s/ai/ollama.yaml
kubectl get pods -n gavel-ai
kubectl describe ingress gavel -n gavel
kubectl apply -f k8s/platform/ingress.yaml
```
