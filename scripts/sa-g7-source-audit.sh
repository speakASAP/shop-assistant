#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

pass_count=0

ok() {
  pass_count=$((pass_count + 1))
  echo "OK $1"
}

require_file() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
  ok "file exists: $file"
}

require_text() {
  local file="$1"
  local text="$2"
  local label="$3"
  if ! rg -q --fixed-strings "$text" "$file"; then
    echo "Missing required text for ${label}: ${text} in ${file}" >&2
    exit 1
  fi
  ok "$label"
}

reject_text() {
  local file="$1"
  local text="$2"
  local label="$3"
  if rg -q --fixed-strings "$text" "$file"; then
    echo "Forbidden text found for ${label}: ${text} in ${file}" >&2
    exit 1
  fi
  ok "$label"
}

require_regex() {
  local file="$1"
  local regex="$2"
  local label="$3"
  if ! rg -q "$regex" "$file"; then
    echo "Missing required pattern for ${label}: ${regex} in ${file}" >&2
    exit 1
  fi
  ok "$label"
}

echo "=== SA-G7 source audit ==="

require_file public/index.html
require_file public/dashboard.html
require_file public/admin.html
require_file public/login.html
require_file public/register.html
require_file src/me/me.controller.ts
require_file src/me/me.service.ts
require_file src/admin/overview.controller.ts
require_file src/admin/settings.controller.ts
require_file src/admin/public-settings.controller.ts
require_file src/admin/operations.controller.ts
require_file src/admin/app-settings.service.ts
require_file src/auth/auth.module.ts
require_file src/auth/auth.controller.ts
require_file scripts/sa-g7-live-smoke.sh
require_file scripts/sa-g7-rollout-preflight.sh
require_file scripts/sa-g7-browser-verify.js
require_file scripts/sa-g7-chrome-browser-verify.js
require_file scripts/sa-g7-token-env-from-vault.sh
require_file scripts/sa-g7-strict-token-smoke.sh
require_file scripts/build-and-push-image.sh
require_file scripts/print-source-fingerprint.sh

echo ""
echo "=== Landing page ==="
require_text public/index.html "Shop Assistant finds products" "commercial landing meta copy"
require_text public/index.html "customer dashboards" "landing markets customer dashboard"
require_text public/index.html "role-protected admin controls" "landing markets admin controls"
require_text public/index.html "dashboard.html" "landing links to customer dashboard"
require_text public/index.html "admin.html" "landing links to admin panel"
require_text public/index.html "publicLanding" "landing applies editable public settings"
require_text public/index.html "landingFetchJson('/sessions'" "landing keeps public session creation flow"
require_text public/index.html "'/query'" "landing keeps public search query flow"
require_text public/index.html "/api/leads/submit" "landing keeps lead capture flow"

echo ""
echo "=== Auth handoff and token storage ==="
require_text public/login.html "AUTH_BASE = 'https://auth.alfares.cz'" "login uses Auth-hosted base"
require_text public/login.html "buildAuthUrl('/login')" "login uses Auth-hosted sign-in path"
require_text public/register.html "AUTH_BASE = 'https://auth.alfares.cz'" "register uses Auth-hosted base"
require_text public/register.html "buildAuthUrl('/register')" "register uses Auth-hosted registration path"
require_text public/login.html "client_id: CLIENT_ID" "login passes Auth client id"
require_text public/register.html "client_id: CLIENT_ID" "register passes Auth client id"
require_text public/dashboard.html "https://auth.alfares.cz" "dashboard uses Auth-hosted handoff"
require_text public/admin.html "https://auth.alfares.cz" "admin uses Auth-hosted handoff"
require_text public/dashboard.html "sessionStorage.setItem(ACCESS_TOKEN_KEY" "dashboard stores access token in session storage"
require_text public/admin.html "sessionStorage.setItem(ACCESS_TOKEN_KEY" "admin stores access token in session storage"
require_text public/dashboard.html "localStorage.removeItem('accessToken')" "dashboard clears legacy persistent access token"
require_text public/admin.html "localStorage.removeItem('accessToken')" "admin clears legacy persistent access token"
reject_text public/admin.html "Paste token" "admin has no manual token paste flow"
reject_text public/login.html "type=\"password\"" "login page does not collect password locally"
reject_text public/register.html "type=\"password\"" "register page does not collect password locally"
require_regex src/auth/auth.module.ts "controllers:\\s*\\[\\]" "local auth proxy controllers disabled"

echo ""
echo "=== Customer dashboard ==="
require_text public/dashboard.html "/me/dashboard" "dashboard loads account summary"
require_text public/dashboard.html "/me/sessions" "dashboard loads account request history"
require_text public/dashboard.html "/me/choices" "dashboard loads selected products"
require_text public/dashboard.html "/profiles" "dashboard manages account profiles"
require_text public/dashboard.html "/saved-criteria" "dashboard manages saved searches"
require_text public/dashboard.html "Load more history" "dashboard paginates history"
require_text public/dashboard.html "Load more selected" "dashboard paginates selected products"
require_text public/dashboard.html "Load more saved" "dashboard paginates saved searches"
require_text src/me/me.controller.ts "@UseGuards(JwtAuthGuard)" "current-user APIs require JWT"
require_text src/me/me.controller.ts "@Get('dashboard')" "current-user dashboard endpoint exists"
require_text src/me/me.controller.ts "@Get('sessions')" "current-user sessions endpoint exists"
require_text src/me/me.controller.ts "@Get('choices')" "current-user choices endpoint exists"
require_text src/me/me.service.ts "userId" "current-user service scopes data by user id"

echo ""
echo "=== Admin panel and RBAC ==="
require_text public/admin.html "global:superadmin" "admin page documents superadmin role"
require_text public/admin.html "app:shop-assistant:admin" "admin page documents app admin role"
require_text public/admin.html "Admin Overview" "admin overview tab exists"
require_text public/admin.html "Operations" "admin operations tab exists"
require_text public/admin.html "Prompts (CRUD)" "admin prompt editing tab exists"
require_text public/admin.html "AI Models" "admin model tab exists"
require_text public/admin.html "Safe service settings" "admin settings tab exists"
require_text public/admin.html "agent-to-agent communications" "admin agent communication access exists"
require_text src/admin/overview.controller.ts "@UseGuards(JwtAuthGuard, RolesGuard)" "admin overview guarded"
require_text src/admin/settings.controller.ts "@UseGuards(JwtAuthGuard, RolesGuard)" "admin settings guarded"
require_text src/admin/operations.controller.ts "@UseGuards(JwtAuthGuard, RolesGuard)" "admin operations guarded"
require_text src/admin/overview.controller.ts "@Roles('global:superadmin', 'app:shop-assistant:admin')" "admin overview roles enforced"
require_text src/admin/settings.controller.ts "@Roles('global:superadmin', 'app:shop-assistant:admin')" "admin settings roles enforced"
require_text src/admin/operations.controller.ts "@Roles('global:superadmin', 'app:shop-assistant:admin')" "admin operations roles enforced"
require_text src/sessions/sessions.controller.ts "@Roles('global:superadmin', 'app:shop-assistant:admin')" "agent communications guarded by admin roles"

echo ""
echo "=== Editable settings and applied runtime behavior ==="
require_text src/admin/app-settings.service.ts "agentExecutionMode" "agent execution mode setting defined"
require_text src/admin/app-settings.service.ts "maxSearchResults" "max search results setting defined"
require_text src/admin/app-settings.service.ts "publicLanding" "public landing setting defined"
require_text src/admin/app-settings.service.ts "updatedBy" "settings audit metadata records updater"
require_text src/admin/settings.controller.ts "@Put()" "admin settings save endpoint exists"
require_text src/admin/public-settings.controller.ts "@Controller('public/settings')" "public settings controller exists"
require_text src/admin/public-settings.controller.ts "@Get('landing')" "public landing settings endpoint exists"
require_text src/sessions/sessions.service.ts "getMaxSearchResults" "maxSearchResults applied to search behavior"
require_text public/admin.html "settingsMetaBody" "admin renders settings audit metadata"

echo ""
echo "=== Rollout and live-verification tooling ==="
require_text scripts/sa-g7-live-smoke.sh "CUSTOMER_TOKEN" "live smoke supports customer token checks"
require_text scripts/sa-g7-live-smoke.sh "ADMIN_TOKEN" "live smoke supports admin token checks"
require_text scripts/sa-g7-live-smoke.sh "NON_ADMIN_TOKEN" "live smoke supports non-admin denial checks"
require_text scripts/sa-g7-live-smoke.sh "REQUIRE_TOKEN_SMOKE" "live smoke supports strict token-required mode"
require_text scripts/sa-g7-live-smoke.sh "CUSTOMER_TOKEN_FILE" "live smoke supports customer token file"
require_text scripts/sa-g7-live-smoke.sh "ADMIN_TOKEN_FILE" "live smoke supports admin token file"
require_text scripts/sa-g7-live-smoke.sh "NON_ADMIN_TOKEN_FILE" "live smoke supports non-admin token file"
require_text scripts/sa-g7-browser-verify.js "REQUIRE_BROWSER_AUTH" "browser verifier supports strict auth-required mode"
require_text scripts/sa-g7-browser-verify.js "CUSTOMER_TOKEN_FILE" "browser verifier supports customer token file"
require_text scripts/sa-g7-browser-verify.js "ADMIN_TOKEN_FILE" "browser verifier supports admin token file"
require_text scripts/sa-g7-browser-verify.js "NON_ADMIN_TOKEN_FILE" "browser verifier supports non-admin token file"
require_text scripts/sa-g7-browser-verify.js "sessionStorage.setItem('shop_assistant_access_token'" "browser verifier injects session-scoped token only"
require_text scripts/sa-g7-browser-verify.js "auth\\.alfares\\.cz" "browser verifier validates Auth-hosted handoff"
require_text scripts/sa-g7-chrome-browser-verify.js "google-chrome" "Chrome browser verifier uses system Chrome"
require_text scripts/sa-g7-chrome-browser-verify.js "CUSTOMER_TOKEN_FILE" "Chrome browser verifier supports customer token file"
require_text scripts/sa-g7-chrome-browser-verify.js "ADMIN_TOKEN_FILE" "Chrome browser verifier supports admin token file"
require_text scripts/sa-g7-chrome-browser-verify.js "NON_ADMIN_TOKEN_FILE" "Chrome browser verifier supports non-admin token file"
require_text scripts/sa-g7-chrome-browser-verify.js "Page.addScriptToEvaluateOnNewDocument" "Chrome browser verifier injects token before page scripts"
require_text scripts/sa-g7-chrome-browser-verify.js "REQUIRE_BROWSER_AUTH" "Chrome browser verifier supports strict auth mode"
require_text scripts/sa-g7-token-env-from-vault.sh "CUSTOMER_TOKEN_FILE" "Vault helper writes customer token file reference"
require_text scripts/sa-g7-token-env-from-vault.sh "ADMIN_TOKEN_FILE" "Vault helper writes admin token file reference"
require_text scripts/sa-g7-token-env-from-vault.sh "NON_ADMIN_TOKEN_FILE" "Vault helper writes non-admin token file reference"
require_text scripts/sa-g7-token-env-from-vault.sh "TOKEN_DIR" "Vault helper supports configurable token directory"
require_text scripts/sa-g7-token-env-from-vault.sh "SA_G7_TOKEN_HELPER_DRY_RUN" "Vault helper supports dry-run token-file validation"
require_text scripts/sa-g7-strict-token-smoke.sh "sa-g7-token-env-from-vault.sh" "strict token smoke wrapper loads Vault tokens"
require_text scripts/build-and-push-image.sh "cz.alfares.shop-assistant.source-fingerprint" "image build labels source fingerprint"
require_text scripts/sa-g7-rollout-preflight.sh "No Docker image was built or pushed." "rollout preflight is read-only"

echo ""
echo "SA-G7 source audit passed (${pass_count} checks)."
echo "SA-G7 live evidence recorded: strict token smoke, authenticated browser verification, and optional agent-flow RBAC smoke."
