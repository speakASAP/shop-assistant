#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://shop-assistant.alfares.cz}"
BASE_URL="${BASE_URL%/}"

CUSTOMER_TOKEN="${CUSTOMER_TOKEN:-}"
CUSTOMER_TOKEN_FILE="${CUSTOMER_TOKEN_FILE:-}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
ADMIN_TOKEN_FILE="${ADMIN_TOKEN_FILE:-}"
NON_ADMIN_TOKEN="${NON_ADMIN_TOKEN:-}"
NON_ADMIN_TOKEN_FILE="${NON_ADMIN_TOKEN_FILE:-}"
AGENT_FLOW_SESSION_ID="${AGENT_FLOW_SESSION_ID:-}"
REQUIRE_TOKEN_SMOKE="${REQUIRE_TOKEN_SMOKE:-0}"
SMOKE_CACHE_BUST="${SMOKE_CACHE_BUST:-$(date +%s)}"
SMOKE_CURL_MAX_TIME="${SMOKE_CURL_MAX_TIME:-12}"

failures=0
skipped=0

log() { printf '%s\n' "$*"; }

pass() { log "PASS $*"; }

fail() {
  failures=$((failures + 1))
  log "FAIL $*"
}

skip() {
  skipped=$((skipped + 1))
  log "SKIP $*"
}

load_token_file() {
  local label="$1"
  local file="$2"
  if [ -z "$file" ]; then
    return 0
  fi
  if [ ! -r "$file" ]; then
    fail "${label}_FILE is not readable"
    return 0
  fi
  local value
  value="$(tr -d '\r\n' < "$file")"
  if [ -z "$value" ]; then
    fail "${label}_FILE is empty"
    return 0
  fi
  printf -v "$label" '%s' "$value"
}

if [ -z "$CUSTOMER_TOKEN" ] && [ -n "$CUSTOMER_TOKEN_FILE" ]; then
  load_token_file CUSTOMER_TOKEN "$CUSTOMER_TOKEN_FILE"
fi
if [ -z "$ADMIN_TOKEN" ] && [ -n "$ADMIN_TOKEN_FILE" ]; then
  load_token_file ADMIN_TOKEN "$ADMIN_TOKEN_FILE"
fi
if [ -z "$NON_ADMIN_TOKEN" ] && [ -n "$NON_ADMIN_TOKEN_FILE" ]; then
  load_token_file NON_ADMIN_TOKEN "$NON_ADMIN_TOKEN_FILE"
fi

http_status() {
  local method="$1"
  local path="$2"
  local token="${3:-}"
  local status
  if [ -n "$token" ]; then
    status="$(curl --max-time "$SMOKE_CURL_MAX_TIME" -sS -o /dev/null -w '%{http_code}' -X "$method" -H "Authorization: Bearer ${token}" "${BASE_URL}${path}" 2>/dev/null || true)"
  else
    status="$(curl --max-time "$SMOKE_CURL_MAX_TIME" -sS -o /dev/null -w '%{http_code}' -X "$method" "${BASE_URL}${path}" 2>/dev/null || true)"
  fi
  if [ -z "$status" ]; then
    printf '000'
  else
    printf '%s' "$status"
  fi
}

expect_status() {
  local label="$1"
  local method="$2"
  local path="$3"
  local expected="$4"
  local token="${5:-}"
  local status
  status="$(http_status "$method" "$path" "$token")"
  if [ "$status" = "$expected" ]; then
    pass "$label -> HTTP $status"
  else
    fail "$label -> expected HTTP $expected, got $status"
  fi
}

expect_status_one_of() {
  local label="$1"
  local method="$2"
  local path="$3"
  local expected_csv="$4"
  local token="${5:-}"
  local status
  status="$(http_status "$method" "$path" "$token")"
  case ",$expected_csv," in
    *",$status,"*) pass "$label -> HTTP $status" ;;
    *) fail "$label -> expected one of [$expected_csv], got $status" ;;
  esac
}

fetch_json() {
  local method="$1"
  local path="$2"
  local token="${3:-}"
  if [ -n "$token" ]; then
    curl --max-time "$SMOKE_CURL_MAX_TIME" -sS -X "$method" -H "Authorization: Bearer ${token}" "${BASE_URL}${path}" 2>/dev/null || true
  else
    curl --max-time "$SMOKE_CURL_MAX_TIME" -sS -X "$method" "${BASE_URL}${path}" 2>/dev/null || true
  fi
}

expect_admin_settings_metadata() {
  local label="$1"
  local token="$2"
  local body
  body="$(fetch_json GET /api/admin/settings "$token")"
  if printf '%s' "$body" | node -e '
const fs = require("fs");
const data = fs.readFileSync(0, "utf8");
let json;
try {
  json = JSON.parse(data);
} catch {
  process.exit(1);
}
const required = ["agentExecutionMode", "maxSearchResults", "publicLanding"];
if (!json || typeof json !== "object" || !json.meta || typeof json.meta !== "object") process.exit(1);
for (const key of required) {
  const item = json.meta[key];
  if (!item || item.key !== key || item.editable !== true) process.exit(1);
  if (item.source !== "persisted" && item.source !== "default") process.exit(1);
  if (typeof item.description !== "string" || !item.description.trim()) process.exit(1);
  if (typeof item.appliesTo !== "string" || !item.appliesTo.trim()) process.exit(1);
  if (!(item.updatedBy === null || typeof item.updatedBy === "string")) process.exit(1);
  if (!(item.updatedAt === null || typeof item.updatedAt === "string")) process.exit(1);
}
'; then
    pass "$label includes safe settings metadata"
  else
    fail "$label missing or invalid safe settings metadata"
  fi
}

expect_customer_dashboard_contract() {
  local label="$1"
  local token="$2"
  local me_body dashboard_body sessions_body choices_body profiles_body saved_body
  me_body="$(fetch_json GET /api/me "$token")"
  dashboard_body="$(fetch_json GET /api/me/dashboard "$token")"
  sessions_body="$(fetch_json GET '/api/me/sessions?page=1&limit=5' "$token")"
  choices_body="$(fetch_json GET '/api/me/choices?page=1&limit=5' "$token")"
  profiles_body="$(fetch_json GET /api/profiles "$token")"
  saved_body="$(fetch_json GET '/api/saved-criteria?page=1&limit=5' "$token")"

  if ME_BODY="$me_body" \
    DASHBOARD_BODY="$dashboard_body" \
    SESSIONS_BODY="$sessions_body" \
    CHOICES_BODY="$choices_body" \
    PROFILES_BODY="$profiles_body" \
    SAVED_BODY="$saved_body" \
    node -e '
function readJson(name) {
  const value = process.env[name] || "";
  try {
    return JSON.parse(value);
  } catch {
    process.exit(1);
  }
}
function assert(condition) {
  if (!condition) process.exit(1);
}
function assertArray(value) {
  assert(Array.isArray(value));
}
function assertPagination(value) {
  assert(value && typeof value === "object");
  assert(Number.isInteger(value.page));
  assert(Number.isInteger(value.limit));
  assert(Number.isInteger(value.total));
}
const me = readJson("ME_BODY");
const dashboard = readJson("DASHBOARD_BODY");
const sessions = readJson("SESSIONS_BODY");
const choices = readJson("CHOICES_BODY");
const profiles = readJson("PROFILES_BODY");
const saved = readJson("SAVED_BODY");

assert(me && typeof me === "object" && me.user && typeof me.user === "object");
assert(typeof me.user.id === "string" && me.user.id.length > 0);

assert(dashboard && typeof dashboard === "object");
assert(dashboard.summary && typeof dashboard.summary === "object");
for (const key of ["sessions", "searchRuns", "choices", "profiles", "savedCriteria"]) {
  assert(Number.isInteger(dashboard.summary[key]));
}
assertArray(dashboard.recentSessions);
assertArray(dashboard.recentChoices);

assert(sessions && typeof sessions === "object");
assertArray(sessions.items);
assertPagination(sessions.pagination);

assert(choices && typeof choices === "object");
assertArray(choices.items);
assertPagination(choices.pagination);

assert(profiles && typeof profiles === "object");
assertArray(profiles.items);

assert(saved && typeof saved === "object");
assertArray(saved.items);
assertPagination(saved.pagination);
'; then
    pass "$label returns customer dashboard/account contract"
  else
    fail "$label missing or invalid customer dashboard/account contract"
  fi
}

expect_admin_list_contract() {
  local label="$1"
  local path="$2"
  local token="$3"
  local body
  body="$(fetch_json GET "$path" "$token")"
  if BODY="$body" node -e '
const value = process.env.BODY || "";
let json;
try {
  json = JSON.parse(value);
} catch {
  process.exit(1);
}
if (!json || typeof json !== "object" || !Array.isArray(json.items)) process.exit(1);
if (!json.pagination || typeof json.pagination !== "object") process.exit(1);
for (const key of ["page", "limit", "total"]) {
  if (!Number.isInteger(json.pagination[key])) process.exit(1);
}
'; then
    pass "$label returns admin list contract"
  else
    fail "$label missing or invalid admin list contract"
  fi
}

expect_admin_models_contract() {
  local label="$1"
  local token="$2"
  local body
  body="$(fetch_json GET '/api/admin/ai-models?limit=5' "$token")"
  if BODY="$body" node -e '
const value = process.env.BODY || "";
let json;
try {
  json = JSON.parse(value);
} catch {
  process.exit(1);
}
if (!json || typeof json !== "object") process.exit(1);
if (!json.models || typeof json.models !== "object" || Array.isArray(json.models)) process.exit(1);
if (!json.providers || typeof json.providers !== "object" || Array.isArray(json.providers)) process.exit(1);
if (!Array.isArray(json.modelList)) process.exit(1);
'; then
    pass "$label returns admin models contract"
  else
    fail "$label missing or invalid admin models contract"
  fi
}

expect_public_landing_settings_contract() {
  local body
  body="$(fetch_json GET /api/public/settings/landing)"
  if BODY="$body" node -e '
const value = process.env.BODY || "";
let json;
try {
  json = JSON.parse(value);
} catch {
  process.exit(1);
}
const required = [
  "headline",
  "subheadline",
  "primaryCtaLabel",
  "secondaryCtaLabel",
  "contactHeadline",
  "contactSubheadline",
  "leadSubmitLabel",
  "footerTagline",
];
if (!json || typeof json !== "object" || !json.publicLanding || typeof json.publicLanding !== "object") process.exit(1);
for (const key of required) {
  if (typeof json.publicLanding[key] !== "string" || !json.publicLanding[key].trim()) process.exit(1);
}
'; then
    pass "GET /api/public/settings/landing returns public landing settings contract"
  else
    fail "GET /api/public/settings/landing missing or invalid public landing settings contract"
  fi
}

fetch_body() {
  local path="$1"
  local separator="?"
  if [[ "$path" == *\?* ]]; then
    separator="&"
  fi
  curl --max-time "$SMOKE_CURL_MAX_TIME" -sS \
    -H 'Cache-Control: no-cache' \
    -H 'Pragma: no-cache' \
    "${BASE_URL}${path}${separator}sa_g7_smoke=${SMOKE_CACHE_BUST}" || true
}

expect_body_contains() {
  local label="$1"
  local path="$2"
  local needle="$3"
  local body
  body="$(fetch_body "$path")"
  if grep -Fq "$needle" <<< "$body"; then
    pass "$label contains expected copy"
  else
    fail "$label missing expected copy: $needle"
  fi
}

expect_body_not_contains() {
  local label="$1"
  local path="$2"
  local needle="$3"
  local body
  body="$(fetch_body "$path")"
  if grep -Fq "$needle" <<< "$body"; then
    fail "$label contains forbidden copy: $needle"
  else
    pass "$label excludes forbidden copy"
  fi
}

log "=== SA-G7 live frontend/auth smoke ==="
log "Target: ${BASE_URL}"
log "HTML cache-bust key: ${SMOKE_CACHE_BUST}"
log "Per-request timeout: ${SMOKE_CURL_MAX_TIME}s"
log "Token values are never printed by this script."
log "Tokens may be supplied through CUSTOMER_TOKEN_FILE, ADMIN_TOKEN_FILE, and NON_ADMIN_TOKEN_FILE to avoid shell history exposure."
if [ "$REQUIRE_TOKEN_SMOKE" = "1" ]; then
  log "Strict token smoke mode: CUSTOMER_TOKEN, ADMIN_TOKEN, and NON_ADMIN_TOKEN are required."
fi
log ""

log "== Public route availability =="
for path in \
  / \
  /health \
  /dashboard.html \
  /admin.html \
  /login.html \
  /register.html \
  /test.html \
  /debug.html \
  /getting-admin-token.html \
  /privacy.html \
  /cookies.html \
  /terms.html
do
  expect_status "HEAD ${path}" HEAD "$path" 200
done

log ""
log "== Public copy/auth-surface checks =="
expect_status "GET /api/public/settings/landing public" GET /api/public/settings/landing 200
expect_public_landing_settings_contract
expect_body_contains "admin page" /admin.html "Sign in with Auth"
expect_body_not_contains "admin page" /admin.html "paste an admin JWT manually"
expect_body_not_contains "admin page" /admin.html "Admin JWT token"
expect_body_not_contains "admin page" /admin.html "Save a valid JWT token"
expect_body_contains "legacy admin access guide" /getting-admin-token.html "Shop Assistant Admin Access"
expect_body_contains "legacy admin access guide" /getting-admin-token.html "Do not copy access tokens"
expect_body_not_contains "legacy admin access guide" /getting-admin-token.html "refreshToken"
expect_body_not_contains "legacy admin access guide" /getting-admin-token.html "Copy Token"
expect_body_contains "login page" /login.html "Continue with Auth"
expect_body_contains "login page Auth base" /login.html "https://auth.alfares.cz"
expect_body_contains "login page client id" /login.html "shop-assistant"
expect_body_contains "login page return_url" /login.html "return_url"
expect_body_contains "login page state" /login.html "sessionStorage.setItem(STATE_KEY, state)"
expect_body_not_contains "login page" /login.html "type=\"password\""
expect_body_not_contains "login page persistent token write" /login.html "localStorage.setItem('accessToken'"
expect_body_contains "register page" /register.html "Create account with Auth"
expect_body_contains "register page Auth base" /register.html "https://auth.alfares.cz"
expect_body_contains "register page client id" /register.html "shop-assistant"
expect_body_contains "register page return_url" /register.html "return_url"
expect_body_contains "register page state" /register.html "sessionStorage.setItem(STATE_KEY, state)"
expect_body_not_contains "register page" /register.html "type=\"password\""
expect_body_not_contains "register page persistent token write" /register.html "localStorage.setItem('accessToken'"
expect_body_contains "dashboard page Auth base" /dashboard.html "https://auth.alfares.cz"
expect_body_contains "dashboard page client id" /dashboard.html "shop-assistant"
expect_body_contains "dashboard page state validation" /dashboard.html "Authentication state did not match"
expect_body_contains "dashboard page session token storage" /dashboard.html "sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)"
expect_body_not_contains "dashboard page persistent token write" /dashboard.html "localStorage.setItem('accessToken'"
expect_body_contains "admin page Auth base" /admin.html "https://auth.alfares.cz"
expect_body_contains "admin page client id" /admin.html "shop-assistant"
expect_body_contains "admin page admin state key" /admin.html "shop_assistant_admin_auth_state"
expect_body_contains "admin page state validation" /admin.html "Authentication state did not match"
expect_body_contains "admin page session token storage" /admin.html "sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)"
expect_body_not_contains "admin page persistent token write" /admin.html "localStorage.setItem('accessToken'"
expect_body_contains "debug page" /debug.html "Admin debug moved"
expect_body_not_contains "debug page" /debug.html "agent-communications"
expect_body_contains "advanced test page" /test.html "Agent diagnostics are available only in Admin Flow"
expect_body_contains "advanced test page" /test.html "Open Admin Flow (admin only)"

log ""
log "== Unauthenticated protection =="
expect_status "GET /api/me unauthenticated" GET /api/me 401
expect_status "GET /api/me/dashboard unauthenticated" GET /api/me/dashboard 401
expect_status "GET /api/admin/overview unauthenticated" GET /api/admin/overview 401
expect_status "GET /api/admin/settings unauthenticated" GET /api/admin/settings 401
expect_status "GET /api/sessions/smoke/agent-communications unauthenticated" GET /api/sessions/smoke/agent-communications 401
expect_status "POST /api/auth/login disabled" POST /api/auth/login 404
expect_status "POST /api/auth/register disabled" POST /api/auth/register 404

log ""
log "== Optional customer-token checks =="
if [ -n "$CUSTOMER_TOKEN" ]; then
  expect_status "GET /api/me customer" GET /api/me 200 "$CUSTOMER_TOKEN"
  expect_status "GET /api/me/dashboard customer" GET /api/me/dashboard 200 "$CUSTOMER_TOKEN"
  expect_status "GET /api/me/sessions customer" GET '/api/me/sessions?page=1&limit=5' 200 "$CUSTOMER_TOKEN"
  expect_status "GET /api/me/choices customer" GET '/api/me/choices?page=1&limit=5' 200 "$CUSTOMER_TOKEN"
  expect_status "GET /api/profiles customer" GET /api/profiles 200 "$CUSTOMER_TOKEN"
  expect_status "GET /api/saved-criteria customer" GET '/api/saved-criteria?page=1&limit=5' 200 "$CUSTOMER_TOKEN"
  expect_customer_dashboard_contract "Customer dashboard/account APIs" "$CUSTOMER_TOKEN"
else
  if [ "$REQUIRE_TOKEN_SMOKE" = "1" ]; then
    fail "CUSTOMER_TOKEN not set; strict customer dashboard/account API checks not run"
  else
    skip "CUSTOMER_TOKEN not set; customer dashboard/account API checks not run"
  fi
fi

log ""
log "== Optional admin-token checks =="
if [ -n "$ADMIN_TOKEN" ]; then
  expect_status "GET /api/admin/overview admin" GET /api/admin/overview 200 "$ADMIN_TOKEN"
  expect_status "GET /api/admin/settings admin" GET /api/admin/settings 200 "$ADMIN_TOKEN"
  expect_status "GET /api/admin/prompts admin" GET /api/admin/prompts 200 "$ADMIN_TOKEN"
  expect_status "GET /api/admin/ai-models admin" GET '/api/admin/ai-models?limit=5' 200 "$ADMIN_TOKEN"
  expect_status "GET /api/admin/operations/sessions admin" GET '/api/admin/operations/sessions?page=1&limit=5' 200 "$ADMIN_TOKEN"
  expect_status "GET /api/admin/operations/leads admin" GET '/api/admin/operations/leads?page=1&limit=5' 200 "$ADMIN_TOKEN"
  expect_status "GET /api/admin/operations/profiles admin" GET '/api/admin/operations/profiles?page=1&limit=5' 200 "$ADMIN_TOKEN"
  expect_status "GET /api/admin/operations/saved-criteria admin" GET '/api/admin/operations/saved-criteria?page=1&limit=5' 200 "$ADMIN_TOKEN"
  expect_admin_settings_metadata "GET /api/admin/settings admin" "$ADMIN_TOKEN"
  expect_admin_models_contract "GET /api/admin/ai-models admin" "$ADMIN_TOKEN"
  expect_admin_list_contract "GET /api/admin/operations/sessions admin" '/api/admin/operations/sessions?page=1&limit=5' "$ADMIN_TOKEN"
  expect_admin_list_contract "GET /api/admin/operations/leads admin" '/api/admin/operations/leads?page=1&limit=5' "$ADMIN_TOKEN"
  expect_admin_list_contract "GET /api/admin/operations/profiles admin" '/api/admin/operations/profiles?page=1&limit=5' "$ADMIN_TOKEN"
  expect_admin_list_contract "GET /api/admin/operations/saved-criteria admin" '/api/admin/operations/saved-criteria?page=1&limit=5' "$ADMIN_TOKEN"
  if [ -n "$AGENT_FLOW_SESSION_ID" ]; then
    expect_status_one_of "GET /api/sessions/:id/agent-communications admin" GET "/api/sessions/${AGENT_FLOW_SESSION_ID}/agent-communications" "200,404" "$ADMIN_TOKEN"
  else
    skip "AGENT_FLOW_SESSION_ID not set; admin Agent Flow API check not run"
  fi
else
  if [ "$REQUIRE_TOKEN_SMOKE" = "1" ]; then
    fail "ADMIN_TOKEN not set; strict admin API checks not run"
  else
    skip "ADMIN_TOKEN not set; admin API checks not run"
  fi
fi

log ""
log "== Optional non-admin forbidden checks =="
if [ -n "$NON_ADMIN_TOKEN" ]; then
  expect_status "GET /api/admin/overview non-admin" GET /api/admin/overview 403 "$NON_ADMIN_TOKEN"
  expect_status "GET /api/admin/settings non-admin" GET /api/admin/settings 403 "$NON_ADMIN_TOKEN"
  expect_status "GET /api/admin/prompts non-admin" GET /api/admin/prompts 403 "$NON_ADMIN_TOKEN"
  expect_status "GET /api/admin/ai-models non-admin" GET '/api/admin/ai-models?limit=5' 403 "$NON_ADMIN_TOKEN"
  expect_status "GET /api/admin/operations/sessions non-admin" GET '/api/admin/operations/sessions?page=1&limit=5' 403 "$NON_ADMIN_TOKEN"
  expect_status "GET /api/admin/operations/leads non-admin" GET '/api/admin/operations/leads?page=1&limit=5' 403 "$NON_ADMIN_TOKEN"
  expect_status "GET /api/admin/operations/profiles non-admin" GET '/api/admin/operations/profiles?page=1&limit=5' 403 "$NON_ADMIN_TOKEN"
  expect_status "GET /api/admin/operations/saved-criteria non-admin" GET '/api/admin/operations/saved-criteria?page=1&limit=5' 403 "$NON_ADMIN_TOKEN"
  if [ -n "$AGENT_FLOW_SESSION_ID" ]; then
    expect_status "GET /api/sessions/:id/agent-communications non-admin" GET "/api/sessions/${AGENT_FLOW_SESSION_ID}/agent-communications" 403 "$NON_ADMIN_TOKEN"
  else
    skip "AGENT_FLOW_SESSION_ID not set; non-admin Agent Flow API check not run"
  fi
else
  if [ "$REQUIRE_TOKEN_SMOKE" = "1" ]; then
    fail "NON_ADMIN_TOKEN not set; strict non-admin forbidden checks not run"
  else
    skip "NON_ADMIN_TOKEN not set; non-admin forbidden checks not run"
  fi
fi

log ""
log "=== Result ==="
log "Failures: ${failures}"
log "Skipped optional checks: ${skipped}"

if [ "$failures" -ne 0 ]; then
  exit 1
fi

exit 0
