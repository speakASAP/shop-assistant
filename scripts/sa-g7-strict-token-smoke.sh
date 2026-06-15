#!/usr/bin/env bash
set -euo pipefail

OUTPUT_ENV="${OUTPUT_ENV:-.env.sa-g7-smoke}"

./scripts/sa-g7-token-env-from-vault.sh
set -a
# shellcheck disable=SC1090
. "$OUTPUT_ENV"
set +a
export REQUIRE_TOKEN_SMOKE="${REQUIRE_TOKEN_SMOKE:-1}"
./scripts/sa-g7-live-smoke.sh
