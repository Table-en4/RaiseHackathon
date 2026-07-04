#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
LOT_FILE="${LOT_FILE:-demo-lot-47.json}"

echo "Pre-warming advisory at $APP_URL for $LOT_FILE"
curl -sS -X POST "$APP_URL/api/advisory" \
  -H "Content-Type: application/json" \
  -d "{\"lot\":$(cat "$LOT_FILE")}" | head -c 500
echo ""
echo "Done."
