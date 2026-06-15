#!/usr/bin/env bash
set -euo pipefail

VAULT_ADDR="${VAULT_ADDR:-http://127.0.0.1:8200}"
VAULT_PATH="${VAULT_PATH:-secret/prod/shop-assistant-smoke}"
AUTH_REPO="${AUTH_REPO:-/home/ssf/Documents/Github/auth-microservice}"
AUTH_BASE_URL="${AUTH_BASE_URL:-https://auth.alfares.cz}"
AUTH_DB_HOST="${AUTH_DB_HOST:-10.43.28.42}"
ROTATE_SMOKE_CREDENTIALS="${ROTATE_SMOKE_CREDENTIALS:-0}"

export VAULT_ADDR

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

need vault
need node

has_existing_credentials() {
  vault kv get -format=json "$VAULT_PATH" 2>/dev/null | node -e '
const fs = require("fs");
let raw = "";
process.stdin.on("data", d => raw += d);
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(raw).data.data || {};
    const keys = ["CUSTOMER_EMAIL", "CUSTOMER_PASSWORD", "ADMIN_EMAIL", "ADMIN_PASSWORD", "NON_ADMIN_EMAIL", "NON_ADMIN_PASSWORD", "AUTH_BASE_URL"];
    process.exit(keys.every(k => typeof data[k] === "string" && data[k].length > 0) ? 0 : 1);
  } catch { process.exit(1); }
});
'
}

if [ "$ROTATE_SMOKE_CREDENTIALS" != "1" ] && has_existing_credentials; then
  echo "SA-G7 smoke credentials already exist at ${VAULT_PATH}; set ROTATE_SMOKE_CREDENTIALS=1 to replace them."
  exit 0
fi

if [ ! -d "$AUTH_REPO" ]; then
  echo "Auth repo not found: ${AUTH_REPO}" >&2
  exit 1
fi

payload="$(AUTH_BASE_URL="$AUTH_BASE_URL" node <<'NODE_PAYLOAD'
const crypto = require("crypto");
const suffix = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14) + "-" + crypto.randomBytes(3).toString("hex");
const password = () => crypto.randomBytes(27).toString("base64url") + "Aa1!";
const authBaseUrl = (process.env.AUTH_BASE_URL || "https://auth.alfares.cz").replace(/\/$/, "");
process.stdout.write(JSON.stringify({
  AUTH_BASE_URL: authBaseUrl,
  CUSTOMER_EMAIL: `sa-g7-customer-smoke-${suffix}@alfares.local`,
  CUSTOMER_PASSWORD: password(),
  ADMIN_EMAIL: `sa-g7-admin-smoke-${suffix}@alfares.local`,
  ADMIN_PASSWORD: password(),
  NON_ADMIN_EMAIL: `sa-g7-non-admin-smoke-${suffix}@alfares.local`,
  NON_ADMIN_PASSWORD: password(),
  CREATED_AT: new Date().toISOString()
}));
NODE_PAYLOAD
)"

PAYLOAD="$payload" node <<'NODE_REGISTER'
const data = JSON.parse(process.env.PAYLOAD);
async function register(email, password, firstName, lastName) {
  const response = await fetch(`${data.AUTH_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName })
  });
  if (![200, 201].includes(response.status)) {
    const text = await response.text();
    throw new Error(`register failed for ${firstName}: HTTP ${response.status} ${text.slice(0, 160)}`);
  }
  const body = await response.json();
  if (!body.accessToken) throw new Error(`register for ${firstName} did not return an access token`);
}
(async () => {
  await register(data.CUSTOMER_EMAIL, data.CUSTOMER_PASSWORD, "SA G7", "Customer Smoke");
  await register(data.ADMIN_EMAIL, data.ADMIN_PASSWORD, "SA G7", "Admin Smoke");
  await register(data.NON_ADMIN_EMAIL, data.NON_ADMIN_PASSWORD, "SA G7", "Non Admin Smoke");
})().catch((error) => { console.error(error.message); process.exit(1); });
NODE_REGISTER

(
  cd "$AUTH_REPO"
  DB_HOST="$AUTH_DB_HOST" ./scripts/seed-rbac.sh >/tmp/sa-g7-seed-rbac.log
  admin_email="$(PAYLOAD="$payload" node -e 'process.stdout.write(JSON.parse(process.env.PAYLOAD).ADMIN_EMAIL)')"
  DB_HOST="$AUTH_DB_HOST" ./scripts/assign-role-by-email.sh --email="$admin_email" --role=app:shop-assistant:admin >/tmp/sa-g7-assign-admin-role.log
)

CUSTOMER_EMAIL="$(PAYLOAD="$payload" node -e 'process.stdout.write(JSON.parse(process.env.PAYLOAD).CUSTOMER_EMAIL)')"
CUSTOMER_PASSWORD="$(PAYLOAD="$payload" node -e 'process.stdout.write(JSON.parse(process.env.PAYLOAD).CUSTOMER_PASSWORD)')"
ADMIN_EMAIL="$(PAYLOAD="$payload" node -e 'process.stdout.write(JSON.parse(process.env.PAYLOAD).ADMIN_EMAIL)')"
ADMIN_PASSWORD="$(PAYLOAD="$payload" node -e 'process.stdout.write(JSON.parse(process.env.PAYLOAD).ADMIN_PASSWORD)')"
NON_ADMIN_EMAIL="$(PAYLOAD="$payload" node -e 'process.stdout.write(JSON.parse(process.env.PAYLOAD).NON_ADMIN_EMAIL)')"
NON_ADMIN_PASSWORD="$(PAYLOAD="$payload" node -e 'process.stdout.write(JSON.parse(process.env.PAYLOAD).NON_ADMIN_PASSWORD)')"
CREATED_AT="$(PAYLOAD="$payload" node -e 'process.stdout.write(JSON.parse(process.env.PAYLOAD).CREATED_AT)')"

vault kv put "$VAULT_PATH" \
  AUTH_BASE_URL="$AUTH_BASE_URL" \
  CUSTOMER_EMAIL="$CUSTOMER_EMAIL" CUSTOMER_PASSWORD="$CUSTOMER_PASSWORD" \
  ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  NON_ADMIN_EMAIL="$NON_ADMIN_EMAIL" NON_ADMIN_PASSWORD="$NON_ADMIN_PASSWORD" \
  CREATED_AT="$CREATED_AT" >/tmp/sa-g7-vault-put.log

echo "SA-G7 smoke credentials created in Vault at ${VAULT_PATH}."
echo "Stored key names: AUTH_BASE_URL CUSTOMER_EMAIL CUSTOMER_PASSWORD ADMIN_EMAIL ADMIN_PASSWORD NON_ADMIN_EMAIL NON_ADMIN_PASSWORD CREATED_AT"
