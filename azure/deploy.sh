#!/usr/bin/env bash
#
# One-shot Azure deploy. AZURE-DEPLOY.md is the same thing step by step, with the
# reasoning; this is for when you just want it up.
#
#   az login
#   bash azure/deploy.sh
#
# Idempotent. Every resource is created only if absent, so a re-run after a
# failure picks up where it stopped, and a re-run after a code change rebuilds
# the image and updates the app without touching the database.
#
# Names and generated secrets are written to azure/.deploy.env (gitignored,
# chmod 600) and read back on the next run. That file is why a second run
# reaches the same Postgres instead of provisioning a new one, and why your
# JWT secrets do not rotate underneath everybody's session.
#
# What this does NOT do, because neither is ours to automate:
#   * the schema and demo data — step 7 of the runbook, run from your laptop
#   * the ElevenLabs dashboard wiring — step 10, and the agent's custom-LLM URL
#     is the one people forget
set -euo pipefail

cd "$(dirname "$0")/.."
STATE=azure/.deploy.env

say() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }
skip() { printf '  %s — already exists, skipping\n' "$1"; }

# ── preflight ────────────────────────────────────────────────────────────────
if ! command -v az >/dev/null; then
  cat >&2 <<'EOF'
The Azure CLI is not installed, and this machine has neither Homebrew nor Docker.
Contained install, no system Python touched:

  python3 -m venv ~/.azure-cli
  ~/.azure-cli/bin/pip install --quiet --upgrade pip azure-cli
  sudo ln -sf ~/.azure-cli/bin/az /usr/local/bin/az

Or install Homebrew first and use `brew install azure-cli`.
EOF
  exit 1
fi

if ! az account show >/dev/null 2>&1; then
  echo "Not logged in. Run: az login" >&2
  exit 1
fi

# ── config ───────────────────────────────────────────────────────────────────
# shellcheck disable=SC1090
[[ -f $STATE ]] && source "$STATE"

: "${LOC:=uaenorth}"
: "${RG:=rg-superdemo}"
# Persisted on first run. A fresh $RANDOM each time would provision a second
# copy of everything and leave the first orphaned.
: "${SUFFIX:=$RANDOM}"
: "${ACR:=acrsuperdemo$SUFFIX}"
: "${ST:=stsuperdemo$SUFFIX}"
: "${PG:=pg-superdemo-$SUFFIX}"
: "${REDIS:=redis-superdemo-$SUFFIX}"
: "${CAE:=cae-superdemo}"
: "${APP:=superdemo-api}"
: "${TAG:=$(date -u +%Y%m%d%H%M%S)}"

# Secrets: generated once, then reused from $STATE.
: "${PG_PASSWORD:=$(openssl rand -base64 24 | tr -d '/+=')}"
: "${JWT_ACCESS_SECRET:=$(openssl rand -base64 48)}"
: "${JWT_REFRESH_SECRET:=$(openssl rand -base64 48)}"
: "${CRM_SECRET_KEY:=$(openssl rand -base64 32)}"

# Brought across from your local .env if not already set. These are the four
# that make real calls work; the deploy succeeds without them but the API will
# refuse to boot with TELEPHONY_DRIVER=elevenlabs and no key.
if [[ -f .env ]]; then
  for v in ELEVENLABS_API_KEY ELEVENLABS_AGENT_ID ELEVENLABS_BRIDGE_SECRET ELEVENLABS_WEBHOOK_SECRET; do
    if [[ -z "${!v:-}" ]]; then
      val="$(grep -E "^${v}=" .env | head -1 | cut -d= -f2- | tr -d '"' || true)"
      [[ -n "$val" ]] && export "$v=$val"
    fi
  done
fi

missing=()
for v in ELEVENLABS_API_KEY ELEVENLABS_AGENT_ID ELEVENLABS_BRIDGE_SECRET ELEVENLABS_WEBHOOK_SECRET; do
  [[ -n "${!v:-}" ]] || missing+=("$v")
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Not found in the environment or .env — ${missing[*]}" >&2
  echo "TELEPHONY_DRIVER=elevenlabs will not boot without them. Export them and re-run." >&2
  exit 1
fi

# WEB_ORIGIN is the one thing this script cannot discover: it is your Vercel
# production URL. Placeholder now, real value on the re-run after step 8.
: "${WEB_ORIGIN:=https://placeholder.invalid}"

save_state() {
  umask 077
  # Defaults-only assignments, not plain ones: this file is sourced at the top,
  # and a plain `WEB_ORIGIN=...` here would overwrite the value the caller just
  # passed on the command line — which is exactly how step 3 is invoked.
  cat > "$STATE" <<EOF
# Written by azure/deploy.sh. Holds secrets — gitignored, do not commit.
: "\${LOC:=$LOC}"
: "\${RG:=$RG}"
: "\${SUFFIX:=$SUFFIX}"
: "\${ACR:=$ACR}"
: "\${ST:=$ST}"
: "\${PG:=$PG}"
: "\${REDIS:=$REDIS}"
: "\${CAE:=$CAE}"
: "\${APP:=$APP}"
: "\${PG_PASSWORD:=$PG_PASSWORD}"
: "\${JWT_ACCESS_SECRET:=$JWT_ACCESS_SECRET}"
: "\${JWT_REFRESH_SECRET:=$JWT_REFRESH_SECRET}"
: "\${CRM_SECRET_KEY:=$CRM_SECRET_KEY}"
: "\${WEB_ORIGIN:=$WEB_ORIGIN}"
EOF
  chmod 600 "$STATE"
}
save_state

echo "subscription : $(az account show --query name -o tsv)"
echo "region       : $LOC"
echo "resource grp : $RG"
echo "suffix       : $SUFFIX   (reused from $STATE on re-runs)"

# ── 1. resource group ────────────────────────────────────────────────────────
say "resource group"
az group create -n "$RG" -l "$LOC" -o none

# ── 2. postgres ──────────────────────────────────────────────────────────────
say "postgres"
if az postgres flexible-server show -g "$RG" -n "$PG" -o none 2>/dev/null; then
  skip "$PG"
else
  MY_IP="$(curl -fsS https://api.ipify.org)"
  az postgres flexible-server create \
    -g "$RG" -n "$PG" -l "$LOC" \
    --tier Burstable --sku-name Standard_B1ms --storage-size 32 --version 16 \
    --admin-user superdemo --admin-password "$PG_PASSWORD" \
    --database-name superdemo --public-access "$MY_IP" -o none
  echo "  firewall opened for $MY_IP, so the schema push below works from here"
fi
DATABASE_URL="postgresql://superdemo:${PG_PASSWORD}@${PG}.postgres.database.azure.com:5432/superdemo?sslmode=require"

# ── 3. redis ─────────────────────────────────────────────────────────────────
say "redis"
if az redis show -g "$RG" -n "$REDIS" -o none 2>/dev/null; then
  skip "$REDIS"
else
  # Several minutes. Nothing later needs it until the app starts, but the app is
  # the last step anyway, so waiting here keeps the failure legible.
  az redis create -g "$RG" -n "$REDIS" -l "$LOC" \
    --sku Basic --vm-size c0 --minimum-tls-version 1.2 -o none
fi
REDIS_KEY="$(az redis list-keys -g "$RG" -n "$REDIS" --query primaryKey -o tsv)"
# rediss:// on 6380 — the second s is TLS. A redis:// URL on this port hangs
# rather than failing cleanly.
REDIS_URL="rediss://:${REDIS_KEY}@${REDIS}.redis.cache.windows.net:6380"

# ── 4. recordings share ──────────────────────────────────────────────────────
say "recordings share"
if az storage account show -g "$RG" -n "$ST" -o none 2>/dev/null; then
  skip "$ST"
else
  az storage account create -g "$RG" -n "$ST" -l "$LOC" --sku Standard_LRS -o none
fi
az storage share-rm create -g "$RG" --storage-account "$ST" -n recordings --quota 5 -o none
ST_KEY="$(az storage account keys list -g "$RG" -n "$ST" --query '[0].value' -o tsv)"

# ── 5. image ─────────────────────────────────────────────────────────────────
say "image"
if ! az acr show -n "$ACR" -o none 2>/dev/null; then
  az acr create -g "$RG" -n "$ACR" --sku Basic --admin-enabled true -o none
fi
# Built in Azure on amd64, not locally: the Dockerfile copies the generated
# Prisma client out of the build stage because those engines are
# architecture-specific, so an arm64 build would ship the wrong ones.
echo "  building superdemo-api:$TAG (context is ~8 MB)"
az acr build -r "$ACR" -t "superdemo-api:$TAG" -f Dockerfile . -o none
ACR_PASSWORD="$(az acr credential show -n "$ACR" --query 'passwords[0].value' -o tsv)"

# ── 6. container apps environment ────────────────────────────────────────────
say "container apps environment"
if az containerapp env show -g "$RG" -n "$CAE" -o none 2>/dev/null; then
  skip "$CAE"
else
  az containerapp env create -g "$RG" -n "$CAE" -l "$LOC" -o none
fi
az containerapp env storage set \
  -g "$RG" -n "$CAE" --storage-name recordings \
  --azure-file-account-name "$ST" \
  --azure-file-account-key "$ST_KEY" \
  --azure-file-share-name recordings \
  --access-mode ReadWrite -o none
ENV_ID="$(az containerapp env show -g "$RG" -n "$CAE" --query id -o tsv)"

# ── 7. the app, in two passes ────────────────────────────────────────────────
# PUBLIC_BASE_URL is the app's own ingress hostname, which does not exist until
# the app does. So: create with a placeholder, read the hostname back, render
# again, update. The runbook has you do this by hand; here it is automatic.
say "app"
export LOCATION="$LOC" ENV_ID ACR ACR_PASSWORD TAG \
  DATABASE_URL REDIS_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET CRM_SECRET_KEY \
  WEB_ORIGIN ELEVENLABS_API_KEY ELEVENLABS_AGENT_ID \
  ELEVENLABS_BRIDGE_SECRET ELEVENLABS_WEBHOOK_SECRET

if az containerapp show -g "$RG" -n "$APP" -o none 2>/dev/null; then
  API_HOST="$(az containerapp show -g "$RG" -n "$APP" --query 'properties.configuration.ingress.fqdn' -o tsv)"
  PUBLIC_BASE_URL="https://$API_HOST" bash azure/render.sh >/dev/null
  az containerapp update -g "$RG" -n "$APP" --yaml azure/containerapp.local.yaml -o none
else
  PUBLIC_BASE_URL="https://placeholder.invalid" bash azure/render.sh >/dev/null
  az containerapp create -g "$RG" -n "$APP" --yaml azure/containerapp.local.yaml -o none
  API_HOST="$(az containerapp show -g "$RG" -n "$APP" --query 'properties.configuration.ingress.fqdn' -o tsv)"
  echo "  ingress is https://$API_HOST — applying it as PUBLIC_BASE_URL"
  PUBLIC_BASE_URL="https://$API_HOST" bash azure/render.sh >/dev/null
  az containerapp update -g "$RG" -n "$APP" --yaml azure/containerapp.local.yaml -o none
fi
API_URL="https://$API_HOST"

# ── done ─────────────────────────────────────────────────────────────────────
say "up"
echo "  api    $API_URL"
printf '  health '; curl -fsS "$API_URL/health" || echo '(not answering yet — revisions take a moment)'
echo
printf '  ready  '; curl -fsS "$API_URL/ready" || echo '(degraded is expected until the schema exists)'
echo

cat <<EOF

Next, in this order:

1. Schema and demo data, from here:

     export DATABASE_URL='$DATABASE_URL'
     pnpm --filter @superdemo/db push
     pnpm --filter @superdemo/db seed
     pnpm --filter @superdemo/db backfill:evals
     pnpm --filter @superdemo/db backfill:outcomes

2. Point Vercel at the API and redeploy — both are NEXT_PUBLIC_, so they are
   baked in at build time and this needs a deploy, not a restart:

     vercel env add NEXT_PUBLIC_API_URL production   # $API_URL
     vercel env add NEXT_PUBLIC_WS_URL production    # $API_URL
     vercel --prod

3. Close the CORS loop. The API allows exactly one origin, so a preview URL
   will not work against it — use the production domain:

     WEB_ORIGIN=https://your-project.vercel.app bash azure/deploy.sh

4. Real calls: AZURE-DEPLOY.md step 10. The agent's custom-LLM URL must read
   $API_URL/api/elevenlabs/llm
   and the escalate tool
   $API_URL/api/elevenlabs/tools/escalate
   Your existing agent was created against an earlier address and is not
   pointing at anything reachable.

Logs:   az containerapp logs show -g $RG -n $APP --follow
Teardown: az group delete -n $RG --yes
EOF
