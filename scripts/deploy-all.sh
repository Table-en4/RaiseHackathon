#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Applying namespaces..."
kubectl apply -f "$ROOT/k8s/namespace.yaml"

echo "Applying sample workload (nginx-demo)..."
kubectl apply -f "$ROOT/k8s/samples/nginx-demo.yaml"

echo "Applying ingress..."
kubectl apply -f "$ROOT/k8s/platform/ingress.yaml"

echo "Applying Ollama (optional dependency)..."
kubectl apply -f "$ROOT/k8s/ai/ollama.yaml"

if [ "${DEPLOY_TUNNEL:-false}" = "true" ]; then
  echo "Applying Cloudflare tunnel..."
  kubectl apply -f "$ROOT/k8s/platform/cloudflared.yaml"
fi

echo "Waiting for nginx-demo rollout..."
kubectl rollout status deployment/nginx-demo -n gavel --timeout=120s

echo "Deploy complete. Run scripts/verify-cluster.sh to verify."
