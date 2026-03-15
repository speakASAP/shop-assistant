#!/bin/bash
# Post-deploy check: run on the server (e.g. after ssh alfares).
# Usage: ./scripts/post-deploy-check.sh
# Or from repo root: cd shop-assistant && ./scripts/post-deploy-check.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Docker: shop-assistant containers ==="
docker ps --filter "name=shop-assistant" --format "table {{.Names}}\t{{.Status}}" 2>&1 || true

echo ""
echo "=== Docker: auth containers ==="
docker ps --filter "name=auth" --format "table {{.Names}}\t{{.Status}}" 2>&1 || true

echo ""
echo "=== Shop Assistant logs (last 60 lines) ==="
(docker logs --tail 60 shop-assistant-blue 2>&1 || docker logs --tail 60 shop-assistant-green 2>&1) || echo "No shop-assistant container found."

echo ""
echo "=== Auth-microservice logs (last 40 lines) ==="
(docker logs --tail 40 auth-microservice-blue 2>&1 || docker logs --tail 40 auth-microservice-green 2>&1) || echo "No auth container found."

echo ""
echo "=== Health checks ==="
curl -s -o /dev/null -w "shop-assistant.alfares.cz/health: %{http_code}\n" https://shop-assistant.alfares.cz/health 2>&1 || true
curl -s -o /dev/null -w "auth.alfares.cz/health: %{http_code}\n" https://auth.alfares.cz/health 2>&1 || true

echo ""
echo "=== Done ==="
