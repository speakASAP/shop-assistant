#!/bin/bash
set -eEuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'

SERVICE_NAME="shop-assistant"
NAMESPACE="${NAMESPACE:-statex-apps}"
K8S_DIR="$PROJECT_ROOT/k8s"
REGISTRY_URL="${REGISTRY_URL:-http://localhost:5000}"
IMAGE_REPOSITORY="${IMAGE_REPOSITORY:-shop-assistant}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE="${REGISTRY_URL#http://}/${IMAGE_REPOSITORY}:${IMAGE_TAG}"
EXPECTED_SOURCE_FINGERPRINT="${EXPECTED_SOURCE_FINGERPRINT:-}"

# shellcheck disable=SC1091
source "$(dirname "$PROJECT_ROOT")/shared/scripts/load-deploy-phase-timing.sh" "$PROJECT_ROOT" 2>/dev/null \
  || source "$HOME/Documents/Github/shared/scripts/load-deploy-phase-timing.sh" "$PROJECT_ROOT" \
  || { echo "Error: deploy timing library not found" >&2; exit 1; }
deploy_timing_init "$SERVICE_NAME"

DEPLOY_TIMING_FINISHED=0

print_rollout_diagnostics() {
  echo -e "${YELLOW}=== Rollout diagnostics for ${SERVICE_NAME} in ${NAMESPACE} ===${NC}"
  if ! command -v kubectl >/dev/null 2>&1; then
    echo -e "${YELLOW}kubectl unavailable; skipping rollout diagnostics.${NC}"
    return
  fi
  if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo -e "${YELLOW}Namespace unavailable: ${NAMESPACE}; skipping rollout diagnostics.${NC}"
    return
  fi

  echo -e "${YELLOW}--- deployment ---${NC}"
  kubectl get deployment "$SERVICE_NAME" -n "$NAMESPACE" -o wide || true
  kubectl describe deployment "$SERVICE_NAME" -n "$NAMESPACE" || true

  echo -e "${YELLOW}--- replicasets ---${NC}"
  kubectl get rs -n "$NAMESPACE" -l app="$SERVICE_NAME" -o wide || true

  echo -e "${YELLOW}--- pods ---${NC}"
  kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" -o wide || true
  local pods
  pods="$(kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)"
  for pod in $pods; do
    echo -e "${YELLOW}--- describe pod/${pod} ---${NC}"
    kubectl describe pod -n "$NAMESPACE" "$pod" || true
    echo -e "${YELLOW}--- logs pod/${pod} (tail 80) ---${NC}"
    kubectl logs -n "$NAMESPACE" "$pod" --tail=80 --all-containers=true 2>&1 || true
  done

  echo -e "${YELLOW}--- recent namespace events ---${NC}"
  kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp | tail -60 || true
}

on_deploy_error() {
  local exit_code=$?
  local line_no="${1:-unknown}"
  if [ "${DEPLOY_TIMING_FINISHED:-0}" = "1" ]; then
    return "$exit_code"
  fi
  echo -e "${RED}Deployment failed at line ${line_no} with exit code ${exit_code}.${NC}"
  print_rollout_diagnostics
  return "$exit_code"
}

trap 'on_deploy_error "$LINENO"' ERR

preflight_service_health() {
  echo -e "${YELLOW}Preflight: checking Kubernetes and current service health...${NC}"

  if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo -e "${RED}Namespace not found: $NAMESPACE${NC}"
    exit 1
  fi

  if ! kubectl get nodes >/dev/null 2>&1; then
    echo -e "${RED}kubectl cannot reach cluster${NC}"
    exit 1
  fi

  echo -e "${YELLOW}Preflight: checking local registry image availability...${NC}"
  if ! curl -fsS --max-time 8 "$REGISTRY_URL/v2/" >/dev/null; then
    echo -e "${RED}Registry is not reachable: $REGISTRY_URL${NC}"
    exit 1
  fi
  if ! curl -fsS --max-time 8 "$REGISTRY_URL/v2/$IMAGE_REPOSITORY/tags/list" | grep -q "\"$IMAGE_TAG\""; then
    echo -e "${RED}Registry tag not available: $IMAGE_REPOSITORY:$IMAGE_TAG at $REGISTRY_URL${NC}"
    exit 1
  fi
  echo -e "${GREEN}OK Registry has ${IMAGE_REPOSITORY}:${IMAGE_TAG}${NC}"

  echo -e "${YELLOW}Current running image digest:${NC}"
  kubectl get pod -n "$NAMESPACE" -l app="$SERVICE_NAME" -o jsonpath='{range .items[*]}{.metadata.name}{" "}{range .status.containerStatuses[*]}{.imageID}{"\n"}{end}{end}' || true

  echo -e "${YELLOW}Registry image source fingerprint label:${NC}"
  local image_fingerprint
  image_fingerprint="$(docker image inspect "$IMAGE" --format '{{ index .Config.Labels "cz.alfares.shop-assistant.source-fingerprint" }}' 2>/dev/null || true)"
  if [ -n "$image_fingerprint" ]; then
    echo "$image_fingerprint"
  else
    echo "No local image label found for $IMAGE. Run scripts/build-and-push-image.sh before deploy to package current source."
  fi
  if [ -n "$EXPECTED_SOURCE_FINGERPRINT" ] && [ "$image_fingerprint" != "$EXPECTED_SOURCE_FINGERPRINT" ]; then
    echo -e "${RED}Expected source fingerprint ${EXPECTED_SOURCE_FINGERPRINT}, got ${image_fingerprint:-<empty>} for ${IMAGE}${NC}"
    exit 1
  fi

  BAD_PODS=$(kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" --no-headers 2>/dev/null | awk '$3 ~ /Error|CrashLoopBackOff|ImagePullBackOff|CreateContainerConfigError|CreateContainerError|ErrImagePull/ {print $1}')
  if [ -n "$BAD_PODS" ]; then
    echo -e "${RED}Service has unhealthy pods before deploy:${NC}"
    kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME" -o wide || true
    for pod in $BAD_PODS; do
      echo -e "${YELLOW}--- describe pod/$pod ---${NC}"
      kubectl describe pod -n "$NAMESPACE" "$pod" || true
      echo -e "${YELLOW}--- logs pod/$pod (tail 80) ---${NC}"
      kubectl logs -n "$NAMESPACE" "$pod" --tail=80 || true
    done
    echo -e "${RED}Fix pod errors first, then redeploy.${NC}"
    exit 1
  fi

  echo -e "${GREEN}Preflight passed${NC}"
}

post_deploy_checks() {
  echo -e "${YELLOW}Running post-deploy checks...${NC}"
  "$PROJECT_ROOT/scripts/post-deploy-check.sh"
  echo -e "${GREEN}OK Post-deploy checks passed${NC}"
}

preflight_source_state() {
  echo -e "${YELLOW}Preflight: source and image packaging state...${NC}"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo -e "${YELLOW}Git HEAD:${NC} $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
    local status
    status="$(git status --short 2>/dev/null || true)"
    if [ -n "$status" ]; then
      echo -e "${YELLOW}Working tree has uncommitted changes:${NC}"
      printf '%s\n' "$status"
      echo -e "${YELLOW}If these changes should be deployed, run scripts/build-and-push-image.sh before this deployment so localhost:5000/${IMAGE_REPOSITORY}:${IMAGE_TAG} contains them.${NC}"
    else
      echo -e "${GREEN}OK Working tree clean${NC}"
    fi
  else
    echo -e "${YELLOW}Git metadata unavailable; skipping source-state check.${NC}"
  fi
}

echo -e "${BLUE}==========================================================${NC}"
echo -e "${BLUE}  Shop Assistant - Kubernetes Deployment${NC}"
echo -e "${BLUE}==========================================================${NC}"

if [ ! -d "$K8S_DIR" ]; then
  echo -e "${RED}Missing k8s directory: $K8S_DIR${NC}"
  exit 1
fi

deploy_timing_run_phase "Preflight" preflight_service_health
deploy_timing_run_phase "Source/image state" preflight_source_state

deploy_timing_phase_start "Apply Kubernetes manifests"
echo -e "${YELLOW}Applying Kubernetes manifests...${NC}"
for manifest in configmap.yaml external-secret.yaml deployment.yaml service.yaml ingress.yaml; do
  if [ -f "$K8S_DIR/$manifest" ]; then
    kubectl apply -f "$K8S_DIR/$manifest" -n "$NAMESPACE"
  fi
done
echo -e "${GREEN}OK Kubernetes manifests applied${NC}"
deploy_timing_phase_end "Apply Kubernetes manifests"

deploy_timing_phase_start "Rollout restart"
echo -e "${YELLOW}Triggering rollout restart...${NC}"
kubectl rollout restart deployment/"$SERVICE_NAME" -n "$NAMESPACE"
echo -e "${GREEN}OK Rollout restart triggered${NC}"
deploy_timing_phase_end "Rollout restart"

deploy_timing_phase_start "Wait for rollout"
echo -e "${YELLOW}Waiting for rollout...${NC}"
deploy_timing_k8s_rollout_wait kubectl "$SERVICE_NAME" "$NAMESPACE"
echo -e "${GREEN}OK Rollout complete${NC}"
deploy_timing_phase_end "Wait for rollout"

deploy_timing_phase_start "Post-deploy status"
echo -e "${YELLOW}Current pods:${NC}"
kubectl get pods -n "$NAMESPACE" -l app="$SERVICE_NAME"
deploy_timing_phase_end "Post-deploy status"

deploy_timing_run_phase "Post-deploy checks" post_deploy_checks

deploy_timing_finish_success "Shop Assistant"
DEPLOY_TIMING_FINISHED=1
exit 0
