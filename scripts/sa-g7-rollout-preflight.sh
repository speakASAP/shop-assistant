#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

NAMESPACE="${NAMESPACE:-statex-apps}"
SERVICE_NAME="${SERVICE_NAME:-shop-assistant}"
REGISTRY_URL="${REGISTRY_URL:-http://localhost:5000}"
IMAGE_REPOSITORY="${IMAGE_REPOSITORY:-shop-assistant}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE="${REGISTRY_URL#http://}/${IMAGE_REPOSITORY}:${IMAGE_TAG}"
EXPECTED_SOURCE_FINGERPRINT="${EXPECTED_SOURCE_FINGERPRINT:-}"

section() {
  echo ""
  echo "=== $1 ==="
}

section "SA-G7 rollout preflight"
echo "Repository: $PROJECT_ROOT"
echo "Image: $IMAGE"

section "Source state"
echo "Git HEAD: $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
if git diff --quiet --ignore-submodules -- 2>/dev/null && git diff --cached --quiet --ignore-submodules -- 2>/dev/null; then
  echo "OK working tree clean"
else
  echo "Working tree has uncommitted changes; confirm these are intended before build/push/deploy."
  git status --short || true
fi

section "Script syntax"
bash -n scripts/print-source-fingerprint.sh
bash -n scripts/build-and-push-image.sh
bash -n scripts/deploy.sh
bash -n scripts/post-deploy-check.sh
bash -n scripts/sa-g7-live-smoke.sh
echo "OK script syntax checks passed"

section "Source fingerprint"
SOURCE_FINGERPRINT="$(./scripts/print-source-fingerprint.sh)"
if [ -z "$SOURCE_FINGERPRINT" ]; then
  echo "Source fingerprint is empty" >&2
  exit 1
fi
echo "$SOURCE_FINGERPRINT"
if [ -n "$EXPECTED_SOURCE_FINGERPRINT" ] && [ "$SOURCE_FINGERPRINT" != "$EXPECTED_SOURCE_FINGERPRINT" ]; then
  echo "Expected source fingerprint $EXPECTED_SOURCE_FINGERPRINT, got $SOURCE_FINGERPRINT from current source" >&2
  exit 1
fi

section "Application build"
npm run build
echo "OK application build passed"

section "Kubernetes readiness"
kubectl get namespace "$NAMESPACE" >/dev/null
kubectl get nodes
kubectl get deployment "$SERVICE_NAME" -n "$NAMESPACE" -o wide
kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" -o wide

section "Current running image digest"
kubectl get pod -n "$NAMESPACE" -l app="$SERVICE_NAME" -o jsonpath='{range .items[*]}{.metadata.name}{" "}{range .status.containerStatuses[*]}{.imageID}{"\n"}{end}{end}' || true
echo ""

section "Registry state"
curl -fsS --max-time 8 "$REGISTRY_URL/v2/" >/dev/null
curl -fsS --max-time 8 "$REGISTRY_URL/v2/$IMAGE_REPOSITORY/tags/list"
echo ""
echo "OK registry is reachable"

section "Local image label"
IMAGE_FINGERPRINT="$(docker image inspect "$IMAGE" --format '{{ index .Config.Labels "cz.alfares.shop-assistant.source-fingerprint" }}' 2>/dev/null || true)"
if [ -n "$IMAGE_FINGERPRINT" ]; then
  echo "$IMAGE_FINGERPRINT"
  if [ "$IMAGE_FINGERPRINT" = "$SOURCE_FINGERPRINT" ]; then
    echo "OK local image label matches current source fingerprint"
  else
    echo "Local image label does not match current source fingerprint; build/push is required before deploy."
  fi
else
  echo "No local image source-fingerprint label found for $IMAGE; build/push is required before deploy."
fi
if [ -n "$EXPECTED_SOURCE_FINGERPRINT" ] && [ "$IMAGE_FINGERPRINT" != "$EXPECTED_SOURCE_FINGERPRINT" ]; then
  echo "Expected local image fingerprint $EXPECTED_SOURCE_FINGERPRINT, got ${IMAGE_FINGERPRINT:-<empty>}" >&2
  exit 1
fi

section "Preflight complete"
echo "No Docker image was built or pushed."
echo "No Kubernetes deployment was changed."
echo "Use this fingerprint for the owner-approved deploy gate after build/push: $SOURCE_FINGERPRINT"
