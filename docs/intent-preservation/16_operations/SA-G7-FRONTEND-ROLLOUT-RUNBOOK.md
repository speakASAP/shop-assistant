# SA-G7 Frontend Rollout Runbook

Purpose: deploy and verify the Shop Assistant commercial landing page, customer dashboard, and role-protected admin panel without losing traceability between source, image, rollout, and live smoke evidence.

## Preconditions

- Work from `/home/ssf/Documents/Github/shop-assistant` on `alfares`.
- Do not paste tokens into logs, shell history, docs, or chat.
- Production deployment requires explicit owner approval.
- Current deployment uses `localhost:5000/shop-assistant:latest` with `imagePullPolicy: Always`.
- If the staged frontend changes should go live, build and push the image before running `scripts/deploy.sh`.

## 1. Source And Build Preflight

```bash
cd /home/ssf/Documents/Github/shop-assistant
git status --short
./scripts/sa-g7-rollout-preflight.sh
```

Expected:

- Build passes.
- Script syntax checks pass.
- Source fingerprint command prints a non-empty SHA-256 value.
- Kubernetes namespace, node, current deployment, current pods, and local registry are reachable.
- Current local image label is printed when available; a mismatch means build/push is required before deploy.
- Dirty status is understood and intentional.

## 2. Build And Push Image

Run only after owner approval:

```bash
cd /home/ssf/Documents/Github/shop-assistant
./scripts/build-and-push-image.sh
```

Record:

- Printed `Source fingerprint`.
- If precomputed during preflight, the printed build fingerprint matches `./scripts/print-source-fingerprint.sh` for the same source state.
- Docker image label check result.
- Registry tag check result.

If the image label check fails, do not deploy.

## 3. Deploy With Fingerprint Enforcement

Use the source fingerprint printed by the build script:

```bash
cd /home/ssf/Documents/Github/shop-assistant
EXPECTED_SOURCE_FINGERPRINT=<printed-source-fingerprint> ./scripts/deploy.sh
```

Expected preflight evidence:

- Kubernetes namespace and node reachable.
- Local registry `/v2/` reachable.
- `shop-assistant:latest` tag exists.
- Current running image digest is printed.
- Registry image source-fingerprint label matches `EXPECTED_SOURCE_FINGERPRINT`.
- Source/image state phase prints Git HEAD and dirty status.

If preflight fails, do not continue by bypassing the guard. Fix image packaging or registry state first.

## 4. Post-Deploy No-Secret Smoke

`scripts/deploy.sh` runs `scripts/post-deploy-check.sh` automatically after rollout. To rerun manually:

```bash
cd /home/ssf/Documents/Github/shop-assistant
./scripts/post-deploy-check.sh
```

Expected:

- `/`, `/dashboard.html`, `/admin.html`, `/login.html`, `/register.html`, `/test.html`, `/debug.html`, legal pages, and `/health` return `200`.
- Public landing settings endpoint returns valid `publicLanding`.
- Static Auth handoff checks pass.
- Unauthenticated protected APIs return `401`.
- Disabled local auth proxy endpoints return `404`.
- Optional token checks are skipped if no token environment variables are set.

## 5. Token-Backed Smoke

Set tokens as environment variables only for the command invocation. Do not echo them.

```bash
cd /home/ssf/Documents/Github/shop-assistant
CUSTOMER_TOKEN=<customer-token> \
ADMIN_TOKEN=<admin-token> \
NON_ADMIN_TOKEN=<non-admin-token> \
AGENT_FLOW_SESSION_ID=<optional-session-id> \
./scripts/sa-g7-live-smoke.sh
```

Expected:

- `CUSTOMER_TOKEN` proves customer dashboard/account contracts:
  - `/api/me`
  - `/api/me/dashboard`
  - `/api/me/sessions`
  - `/api/me/choices`
  - `/api/profiles`
  - `/api/saved-criteria`
- `ADMIN_TOKEN` proves admin overview, settings metadata, prompts, models, operations, and optional Agent Flow access.
- `NON_ADMIN_TOKEN` returns `403` for protected admin surfaces.

## 6. Browser Verification

Use a real browser/Auth callback for at least:

- Landing page:
  - commercial copy loads;
  - search flow still works;
  - lead form still submits;
  - legal and cookie links remain reachable.
- Customer dashboard:
  - Auth redirect works;
  - dashboard does not render before auth;
  - request history, saved searches, profiles, selected products, and session detail render for the signed-in user.
- Admin panel:
  - Auth redirect works;
  - non-admin account is denied;
  - admin account can view overview, operations, settings audit, prompts, models, account data, and Agent Flow.

## 7. Failure Diagnostics

If rollout fails, `scripts/deploy.sh` prints:

- deployment summary and describe;
- ReplicaSets;
- pods;
- pod descriptions;
- pod logs;
- recent namespace events.

Also run:

```bash
kubectl get pods -n statex-apps -l app=shop-assistant -o wide
kubectl get events -n statex-apps --sort-by=.lastTimestamp | tail -80
curl -fsS --max-time 8 http://localhost:5000/v2/shop-assistant/tags/list
docker image inspect localhost:5000/shop-assistant:latest --format '{{ json .Config.Labels }}'
```

If the new pod is stuck in `ContainerCreating`, `ErrImagePull`, `ImagePullBackOff`, or `CreateContainerError`, do not mark SA-G7 complete. Capture diagnostics and keep the previous ready pod serving.

## 8. Evidence To Record

Append to `docs/intent-preservation/validation-reports/VAL-SA-G7-FRONTEND.md`:

- Source fingerprint.
- Image digest after build/push.
- Deployment command and result.
- New pod name and status.
- No-secret smoke result.
- Customer/admin/non-admin smoke result.
- Browser verification notes.
- Any rollback or failed rollout diagnostics.

Update `STATE.json` and `TASKS.md` after the rollout attempt.
