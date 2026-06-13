#!/bin/bash
# Post-deploy check: run on the server (e.g. after ssh alfares).
# Usage: ./scripts/post-deploy-check.sh
# Or from repo root: cd shop-assistant && ./scripts/post-deploy-check.sh
#
# Optional SA-G7 token checks:
#   CUSTOMER_TOKEN=... ADMIN_TOKEN=... NON_ADMIN_TOKEN=... AGENT_FLOW_SESSION_ID=... ./scripts/post-deploy-check.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

SERVICE_NAME="${SERVICE_NAME:-shop-assistant}"
NAMESPACE="${NAMESPACE:-statex-apps}"

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
echo "=== Kubernetes: shop-assistant pods ==="
if command -v kubectl >/dev/null 2>&1 && kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
  kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" -o wide || true

  echo ""
  echo "=== Kubernetes: shop-assistant deployment ==="
  kubectl get deployment "$SERVICE_NAME" -n "$NAMESPACE" -o wide || true

  echo ""
  echo "=== Kubernetes: shop-assistant recent logs ==="
  kubectl logs -n "$NAMESPACE" deployment/"$SERVICE_NAME" --tail=80 --all-containers=true 2>&1 || true
else
  echo "kubectl unavailable or namespace not reachable; skipping Kubernetes diagnostics."
fi

echo ""
echo "=== Health checks ==="
curl -s -o /dev/null -w "shop-assistant.alfares.cz/health: %{http_code}\n" https://shop-assistant.alfares.cz/health 2>&1 || true
curl -s -o /dev/null -w "auth.alfares.cz/health: %{http_code}\n" https://auth.alfares.cz/health 2>&1 || true

echo ""
echo "=== SA-G7 frontend/auth smoke ==="
if [ -x "$PROJECT_ROOT/scripts/sa-g7-live-smoke.sh" ]; then
  "$PROJECT_ROOT/scripts/sa-g7-live-smoke.sh"
else
  echo "Missing executable smoke script: $PROJECT_ROOT/scripts/sa-g7-live-smoke.sh"
  exit 1
fi

echo ""
echo "=== Done ==="
