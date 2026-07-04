#!/usr/bin/env bash
set -euo pipefail

echo "=== Cluster nodes ==="
kubectl get nodes

echo "=== Namespaces ==="
kubectl get ns gavel gavel-ai 2>/dev/null || {
  echo "Namespaces missing — applying namespace.yaml"
  kubectl apply -f k8s/namespace.yaml
}

echo "=== Hello-world smoke test ==="
kubectl apply -f k8s/samples/hello-world-pod.yaml
kubectl wait --for=condition=Ready pod/hello-world -n gavel --timeout=60s
kubectl delete -f k8s/samples/hello-world-pod.yaml

echo "=== nginx-demo status ==="
kubectl get deployment nginx-demo -n gavel 2>/dev/null || echo "nginx-demo not deployed yet — run scripts/deploy-all.sh"

echo "=== Ollama status (optional) ==="
kubectl get pods -n gavel-ai -l app=ollama 2>/dev/null || echo "Ollama not deployed yet"

if [ -n "${APP_URL:-}" ]; then
  echo "=== Public URL check ==="
  curl -sf "$APP_URL" | head -c 200
  echo ""
fi

echo "Cluster verification complete."
