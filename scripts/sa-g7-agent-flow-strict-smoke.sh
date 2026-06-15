#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://shop-assistant.alfares.cz}"
BASE_URL="${BASE_URL%/}"

if [ -z "${AGENT_FLOW_SESSION_ID:-}" ]; then
  AGENT_FLOW_SESSION_ID="$(node <<'NODE_SESSION'
const base = (process.env.BASE_URL || "https://shop-assistant.alfares.cz").replace(/\/$/, "");
(async () => {
  const response = await fetch(`${base}/api/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ priorities: ["quality", "price", "location"] })
  });
  if (![200, 201].includes(response.status)) {
    throw new Error(`session create failed: HTTP ${response.status}`);
  }
  const body = await response.json();
  if (!body.sessionId) throw new Error("session create did not return sessionId");
  process.stdout.write(body.sessionId);
})().catch((error) => { console.error(error.message); process.exit(1); });
NODE_SESSION
)"
  export AGENT_FLOW_SESSION_ID
  echo "Created smoke Agent Flow session id for strict checks."
else
  export AGENT_FLOW_SESSION_ID
  echo "Using supplied AGENT_FLOW_SESSION_ID for strict checks."
fi

./scripts/sa-g7-strict-token-smoke.sh
