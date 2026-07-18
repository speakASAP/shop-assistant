# deploy.config.sh — declaration consumed by shared/scripts/deploy.sh.
# See shared/docs/DEPLOY_STANDARDIZATION_REPORT.md section 6/7 for the design.
# scripts/deploy.sh is still the live, authoritative deploy path.
#
# Migrated 2026-07-18 at the owner's request. shop-assistant previously used
# a different mechanism than the rest of the ecosystem: a separate
# build-and-push-image.sh computed a SHA256 content fingerprint of the
# source tree and baked it into the image as a label, and deploy.sh verified
# that label before rolling out (registry precheck + fingerprint match)
# instead of using a git-hash tag. That solves the same problem the standard
# compute_default_tag() scheme solves — confirming what's running matches
# what's on disk — just via content hashing instead of git state. Adopting
# the standard scheme here in favor of ecosystem consistency; the fingerprint
# mechanism and the separate build script are superseded, not preserved.
#
# post-deploy-check.sh (the old script) also referenced docker-compose
# blue/green containers (shop-assistant-blue/-green) from before this
# service ran in K8s — those sections already silently no-op today, so
# they're dropped here rather than carried forward as dead code.

SERVICE_NAME="shop-assistant"
PORT="4500"

IMAGES=(
  "shop-assistant|.||"
)

DEPLOYMENTS=(
  "shop-assistant|app|shop-assistant"
)

deploy_preflight() {
  ( cd "$PROJECT_ROOT" && npm run build )
}

deploy_post_verify() {
  kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" -o wide || true
  curl -s -o /dev/null -w "shop-assistant.alfares.cz/health: %{http_code}\n" https://shop-assistant.alfares.cz/health || true
  if [ -x "$PROJECT_ROOT/scripts/sa-g7-live-smoke.sh" ]; then
    "$PROJECT_ROOT/scripts/sa-g7-live-smoke.sh"
  fi
}
