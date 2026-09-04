#!/usr/bin/env bash
#
# Renders azure/containerapp.yaml into azure/containerapp.local.yaml, filling
# every __TOKEN__ from the environment.
#
# The output holds real secret values, so it is gitignored. The template is not.
#
#   bash azure/render.sh
#
# Fails loudly on a missing variable rather than shipping the literal token to
# Azure, where it would surface later as an unreachable database or a container
# that will not start.
set -euo pipefail

cd "$(dirname "$0")/.."
TEMPLATE=azure/containerapp.yaml
OUT=azure/containerapp.local.yaml

VARS=(
  LOCATION ENV_ID ACR ACR_PASSWORD TAG IMAGE_REPO SHARE
  DATABASE_URL REDIS_URL
  JWT_ACCESS_SECRET JWT_REFRESH_SECRET CRM_SECRET_KEY
  WEB_ORIGIN PUBLIC_BASE_URL
  ELEVENLABS_API_KEY ELEVENLABS_AGENT_ID
  ELEVENLABS_BRIDGE_SECRET ELEVENLABS_WEBHOOK_SECRET
)

# LOCATION is spelled LOC in the runbook's exports, because that is what reads
# naturally next to RG. Accept either rather than making the two disagree.
: "${LOCATION:=${LOC:-}}"

missing=()
for v in "${VARS[@]}"; do
  [[ -n "${!v:-}" ]] || missing+=("$v")
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "render.sh: not set — ${missing[*]}" >&2
  echo "See AZURE-DEPLOY.md; every one of these is exported by steps 0-5." >&2
  exit 1
fi

cp "$TEMPLATE" "$OUT"
for v in "${VARS[@]}"; do
  # Python rather than sed: these values contain /, +, = and & from base64 and
  # from connection strings, and every one of those is special to sed in either
  # the pattern or the replacement.
  TOKEN="__${v}__" VALUE="${!v}" OUT="$OUT" python3 - <<'PY'
import os, pathlib
p = pathlib.Path(os.environ['OUT'])
p.write_text(p.read_text().replace(os.environ['TOKEN'], os.environ['VALUE']))
PY
done

if grep -q '__[A-Z_]\+__' "$OUT"; then
  echo "render.sh: unreplaced tokens remain in $OUT:" >&2
  grep -o '__[A-Z_]\+__' "$OUT" | sort -u >&2
  exit 1
fi

echo "wrote $OUT"
