#!/bin/bash
# Check if an admin JWT has roles required for Shop Assistant admin (global:superadmin or app:shop-assistant:admin).
# Usage: ./scripts/check-admin-token-roles.sh <JWT> [AUTH_BASE_URL]
# Example: ./scripts/check-admin-token-roles.sh "eyJhbGc..."
#          ./scripts/check-admin-token-roles.sh "$TOKEN" https://auth.alfares.cz
# Reads AUTH_SERVICE_URL from .env if AUTH_BASE_URL not provided.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

TOKEN="${1:-}"
if [ -z "$TOKEN" ]; then
  echo "Usage: $0 <JWT> [AUTH_BASE_URL]"
  echo "  JWT: your access token from auth-microservice"
  echo "  AUTH_BASE_URL: optional; default from .env AUTH_SERVICE_URL (e.g. https://auth.alfares.cz)"
  exit 1
fi

AUTH_BASE="${2:-}"
if [ -z "$AUTH_BASE" ] && [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$PROJECT_ROOT/.env" 2>/dev/null || true
  set +a
  AUTH_BASE="${AUTH_SERVICE_URL:-}"
fi
if [ -z "$AUTH_BASE" ]; then
  echo "Set AUTH_BASE_URL as second argument or AUTH_SERVICE_URL in .env"
  exit 1
fi
AUTH_BASE="${AUTH_BASE%/}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${AUTH_BASE}/auth/validate" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"${TOKEN}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "Validate failed (HTTP $HTTP_CODE). Token may be expired or invalid."
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi

if ! echo "$BODY" | jq -e '.valid == true and .user' > /dev/null 2>&1; then
  echo "Response missing valid: true or user."
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi

ROLES=$(echo "$BODY" | jq -r '.user.roles // [] | @json')
USER_EMAIL=$(echo "$BODY" | jq -r '.user.email // "n/a"')
USER_ID=$(echo "$BODY" | jq -r '.user.id // "n/a"')

echo "User: $USER_EMAIL (id: $USER_ID)"
echo "Roles: $ROLES"

REQUIRED="global:superadmin"
ALT="app:shop-assistant:admin"
HAS_SUPERADMIN=$(echo "$BODY" | jq -r --arg r "$REQUIRED" '(.user.roles // []) | index($r) != null' 2>/dev/null || echo "false")
HAS_APP_ADMIN=$(echo "$BODY" | jq -r --arg r "$ALT" '(.user.roles // []) | index($r) != null' 2>/dev/null || echo "false")

if [ "$HAS_SUPERADMIN" = "true" ] || [ "$HAS_APP_ADMIN" = "true" ]; then
  echo ""
  echo "OK: Token has a role required for Shop Assistant admin ($REQUIRED or $ALT)."
  exit 0
fi

echo ""
echo "Missing required role. Shop Assistant admin needs one of: $REQUIRED, $ALT"
echo "Assign the role in auth-microservice (admin panel or roles API), then get a new token."
exit 1
