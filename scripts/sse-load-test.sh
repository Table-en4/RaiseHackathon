#!/usr/bin/env bash
# Quick SSE load test — 10 minutes, 5 parallel lots
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
DURATION_SEC="${DURATION_SEC:-60}"

echo "SSE load test: $APP_URL/api/feed for ${DURATION_SEC}s"
timeout "$DURATION_SEC" curl -sN "$APP_URL/api/feed" | head -c 100000 || true
echo "Load test complete."
