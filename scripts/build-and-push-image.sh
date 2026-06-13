#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

REGISTRY_HOST="${REGISTRY_HOST:-localhost:5000}"
IMAGE_REPOSITORY="${IMAGE_REPOSITORY:-shop-assistant}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE="${REGISTRY_HOST}/${IMAGE_REPOSITORY}:${IMAGE_TAG}"
SOURCE_FINGERPRINT="$("$PROJECT_ROOT/scripts/print-source-fingerprint.sh")"

echo "=== Shop Assistant image build ==="
echo "Image: ${IMAGE}"
echo "Git HEAD: $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "Source fingerprint: ${SOURCE_FINGERPRINT}"

if ! git diff --quiet --ignore-submodules -- 2>/dev/null || ! git diff --cached --quiet --ignore-submodules -- 2>/dev/null; then
  echo "Working tree has uncommitted changes; Docker build will include the current filesystem state."
  git status --short || true
fi

echo ""
echo "=== Build validation ==="
npm run build

echo ""
echo "=== Docker build ==="
docker build \
  --label "org.opencontainers.image.source=shop-assistant" \
  --label "org.opencontainers.image.revision=$(git rev-parse HEAD 2>/dev/null || echo unknown)" \
  --label "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --label "cz.alfares.shop-assistant.source-fingerprint=${SOURCE_FINGERPRINT}" \
  -t "$IMAGE" .

echo ""
echo "=== Image label check ==="
IMAGE_FINGERPRINT="$(docker image inspect "$IMAGE" --format '{{ index .Config.Labels "cz.alfares.shop-assistant.source-fingerprint" }}')"
if [ "$IMAGE_FINGERPRINT" != "$SOURCE_FINGERPRINT" ]; then
  echo "Image fingerprint label mismatch: expected ${SOURCE_FINGERPRINT}, got ${IMAGE_FINGERPRINT:-<empty>}" >&2
  exit 1
fi
echo "OK image source fingerprint label: ${IMAGE_FINGERPRINT}"

echo ""
echo "=== Docker push ==="
docker push "$IMAGE"

echo ""
echo "=== Registry tag check ==="
curl -fsS --max-time 8 "http://${REGISTRY_HOST}/v2/${IMAGE_REPOSITORY}/tags/list"
echo ""
echo "Image build and push complete: ${IMAGE}"
