# Deploying SuperDemo on Azure

The API, Postgres, Redis and the recordings share go to Azure. **The web app
stays on Vercel** — see below for why, and what would change that.

`DEPLOY.md` is the host-agnostic version of this and explains the constraints.
This is the Azure runbook, with real calls and transcripts as the goal.

**In a hurry?** `azure/deploy.sh` is every step below in one idempotent script:

```bash
az login
bash azure/deploy.sh
```

It provisions everything, builds the image, deploys the app, discovers its own
ingress hostname and applies it as `PUBLIC_BASE_URL`, then prints what is left —
the schema push, the Vercel variables, and the ElevenLabs wiring, none of which
it can do for you. Read the steps below if you want to know why any of it is
shaped the way it is; a failed run is much easier to debug from the long form.

```
        browser ─────────► Vercel (Next.js)          unchanged
                              │  XHR + websocket
                              ▼
   Twilio number ──► ElevenLabs ──► Azure Container Apps (API)  1 replica
    (media leg)      (STT/TTS)      │        │        │
                                    │        │        └─► Azure Files  recordings
                                    │        └──────────► Azure Cache for Redis
                                    └───────────────────► PostgreSQL Flexible Server
```

---

## Why the web app stays on Vercel

14 of the web app's 15 pages are `'use client'`. There's no middleware, no
server actions, no `next/image`, no ISR. The only server-rendered route is the
public tenant site, which fetches a public API endpoint. Everything else talks
to the API cross-origin from the browser — which is already how development
works, and why `WEB_ORIGIN` and `NEXT_PUBLIC_API_URL` exist at all.

So co-locating buys nothing: no shared network path, no latency saved on any hot
path, no simpler auth. It costs a build pipeline you don't need — the workspace
build order in `apps/web/vercel.json` is not something a plain `next build`
gets right.

Data residency is not an argument either way: the web tier stores nothing. All
the data is in Postgres, Redis and the recordings share, and all three are in
Azure. **Move the UI only if procurement wants one vendor or one bill.** It's
cheap to move later precisely because the app is a SPA — the only friction is
that `NEXT_PUBLIC_*` are baked in at build time, so moving means rebuilding
rather than re-pointing.

---

## Before you start

| Need | Note |
|---|---|
| Azure subscription | `uaenorth` used throughout; any region works |
| Azure CLI | Not installed on this machine — `brew install azure-cli` |
| The existing Vercel project | Already linked: `.vercel/project.json` → `superdemo` |
| ElevenLabs account | You already have the API key, agent id, bridge and webhook secrets in `.env` |
| Twilio account | You already have the SID and auth token. A number is the one thing to buy |

You do **not** need Docker locally. Step 5 builds the image inside Azure, which
also sidesteps a real problem: this Mac is arm64, Container Apps runs amd64, and
the `Dockerfile` copies the generated Prisma client out of the build stage
because those engines are architecture-specific. A local `docker build` would
produce an image whose Prisma client is for the wrong platform.

---

## 0. Names and login

Everything below reads these. Set them once per shell.

```bash
az login
az account set --subscription "<your-subscription-id>"

export LOC=uaenorth
export RG=rg-superdemo
export SUFFIX=$RANDOM            # ACR and storage account names are global
export ACR=acrsuperdemo$SUFFIX
export ST=stsuperdemo$SUFFIX
export PG=pg-superdemo-$SUFFIX
export REDIS=redis-superdemo-$SUFFIX
export CAE=cae-superdemo
export APP=superdemo-api

az group create -n $RG -l $LOC
```

## 1. Postgres

```bash
export PG_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=')"
export MY_IP="$(curl -s https://api.ipify.org)"

az postgres flexible-server create \
  --resource-group $RG --name $PG --location $LOC \
  --tier Burstable --sku-name Standard_B1ms --storage-size 32 --version 16 \
  --admin-user superdemo --admin-password "$PG_PASSWORD" \
  --database-name superdemo \
  --public-access "$MY_IP"

export DATABASE_URL="postgresql://superdemo:${PG_PASSWORD}@${PG}.postgres.database.azure.com:5432/superdemo?sslmode=require"
```

`--public-access "$MY_IP"` is what lets step 7 run `db push` from your laptop.
Container Apps reaches the server through the *Allow Azure services* rule, which
that command adds alongside your IP.

No extensions needed. The `KnowledgeChunk.embedding` column is `Float[]`, not
pgvector — deliberately, so the vendored local Postgres needs no extension build
toolchain. Cosine similarity runs in process.

Write `$PG_PASSWORD` down now. Azure will not show it again.

## 2. Redis

```bash
az redis create \
  --resource-group $RG --name $REDIS --location $LOC \
  --sku Basic --vm-size c0 --minimum-tls-version 1.2

export REDIS_KEY="$(az redis list-keys -g $RG -n $REDIS --query primaryKey -o tsv)"
export REDIS_URL="rediss://:${REDIS_KEY}@${REDIS}.redis.cache.windows.net:6380"
```

`rediss://` — the second `s` is TLS, and port 6380 is the TLS port. ioredis
handles the scheme; a `redis://` URL on 6380 will hang instead of failing
cleanly.

Not optional. The API opens three connections at boot: pub/sub for the live
inbox, and one for BullMQ with `maxRetriesPerRequest: null`.

Basic C0 is single-node with no SLA — fine for a demo, not for production.
Upstash also works from Azure if you'd rather not pay for this one.

## 3. The recordings share

```bash
az storage account create -g $RG -n $ST -l $LOC --sku Standard_LRS
az storage share-rm create -g $RG --storage-account $ST -n recordings --quota 5

export ST_KEY="$(az storage account keys list -g $RG -n $ST --query '[0].value' -o tsv)"
```

This exists because the ElevenLabs post-call webhook stores the call audio —
`storage.put(...)` in `elevenlabs.telephony.ts`. Without a mounted share those
recordings live on the container's disk and vanish on every deploy.

`STORAGE_DRIVER=r2` throws at boot by design and is not an alternative. See the
known gaps at the end.

## 4. Secrets the API needs

```bash
export JWT_ACCESS_SECRET="$(openssl rand -base64 48)"
export JWT_REFRESH_SECRET="$(openssl rand -base64 48)"   # a DIFFERENT one
export CRM_SECRET_KEY="$(openssl rand -base64 32)"
```

The variable is `JWT_ACCESS_SECRET`, not `JWT_SECRET`. Both must be at least 32
characters or the process exits at boot with a validation error.

Then bring the ElevenLabs values across from your local `.env`:

```bash
export ELEVENLABS_API_KEY="…"
export ELEVENLABS_AGENT_ID="…"
export ELEVENLABS_BRIDGE_SECRET="…"
export ELEVENLABS_WEBHOOK_SECRET="…"
```

## 5. Build the image in Azure

```bash
az acr create -g $RG -n $ACR --sku Basic --admin-enabled true
export TAG=v1
az acr build -r $ACR -t superdemo-api:$TAG -f Dockerfile .
export ACR_PASSWORD="$(az acr credential show -n $ACR --query 'passwords[0].value' -o tsv)"
```

`az acr build` uploads the build context and builds on amd64 in Azure. The root
`Dockerfile` needs no build arguments; it runs the whole pnpm workspace build
and ships a production-only runtime tree.

## 6. The Container App

Create the environment and register the share with it:

```bash
az containerapp env create -g $RG -n $CAE -l $LOC

az containerapp env storage set \
  -g $RG -n $CAE --storage-name recordings \
  --azure-file-account-name $ST \
  --azure-file-account-key "$ST_KEY" \
  --azure-file-share-name recordings \
  --access-mode ReadWrite
```

Now fill in `azure/containerapp.yaml`. Deploy in two passes, because
`PUBLIC_BASE_URL` and `WEB_ORIGIN` are chicken-and-egg — the app's own URL does
not exist until it is created, and the Vercel URL does not point anywhere useful
until the API does.

```bash
export ENV_ID="$(az containerapp env show -g $RG -n $CAE --query id -o tsv)"
export PUBLIC_BASE_URL="https://placeholder.invalid"
export WEB_ORIGIN="https://placeholder.invalid"

bash azure/render.sh                     # writes azure/containerapp.local.yaml
az containerapp create -g $RG -n $APP --yaml azure/containerapp.local.yaml

export API_URL="https://$(az containerapp show -g $RG -n $APP --query 'properties.configuration.ingress.fqdn' -o tsv)"
echo "$API_URL"
```

Check it came up before going further:

```bash
curl -s "$API_URL/health"
curl -s "$API_URL/ready"
```

`/ready` will report `degraded` on Postgres until step 7 — that is correct, the
schema does not exist yet. If it reports degraded on **redis**, the URL scheme
or port is wrong; go back to step 2.

Note the probe paths: `/health` and `/ready` sit outside the `/api` prefix,
because `main.ts` excludes them from `setGlobalPrefix`.

## 7. Schema and demo data

From your laptop, against the Azure database:

```bash
export DATABASE_URL="postgresql://superdemo:${PG_PASSWORD}@${PG}.postgres.database.azure.com:5432/superdemo?sslmode=require"

pnpm --filter @superdemo/db push
pnpm --filter @superdemo/db seed
pnpm --filter @superdemo/db backfill:evals
pnpm --filter @superdemo/db backfill:outcomes
```

`push`, not `migrate` — this repo has no migrations directory and syncs the
schema directly. Move to `prisma migrate` before a real customer; there is
currently no history and no way back.

`seed` owns the whole database and resets it, so run it before anything else
exists. To add traffic to a centre later without destroying anything, use the
additive seeder instead: `pnpm demo:seed --slug fit-ai --days 90`.

## 8. Vercel

Point the existing project at the new API. Both are `NEXT_PUBLIC_`, so they are
baked in at build time — this needs a redeploy, not a restart.

```bash
vercel env add NEXT_PUBLIC_API_URL production   # paste $API_URL
vercel env add NEXT_PUBLIC_WS_URL production    # the same value
vercel --prod
```

If the project was never deployed: set **Root Directory** to `apps/web` in the
dashboard first, and leave *Include files outside the root directory* on. Without
the root directory the build fails with *"No Next.js version detected"*, because
the repo root is a workspace root with no `next` dependency.

## 9. Close the CORS loop

```bash
export WEB_ORIGIN="https://<your-project>.vercel.app"    # exact, no trailing slash
export PUBLIC_BASE_URL="$API_URL"

bash azure/render.sh
az containerapp update -g $RG -n $APP --yaml azure/containerapp.local.yaml
```

Skipping this gives a dashboard that loads and then fails every request on
CORS, which looks like a broken app rather than a missing variable. The API
allows exactly one origin — `origin: [env.WEB_ORIGIN]` — so a Vercel preview URL
will not work against a production API. Use the production domain.

## 10. Real calls, with transcripts

You already have every credential for this. The important part is that
**`TELEPHONY_DRIVER=twilio` cannot produce a transcript** — that driver has no
inbound webhook, no media stream, and there is no server-side STT in the repo.
It bridges a human agent to a customer and records the legs, nothing more.

The path that transcribes is `elevenlabs`, which the YAML already sets. You keep
using a Twilio number; ElevenLabs owns the media leg through their own Twilio
integration, and your API is the brain:

| Route | What it does |
|---|---|
| `POST /api/elevenlabs/webhooks/conversation-init` | Inbound call arriving; creates the `Call` row and returns the greeting |
| `POST /api/elevenlabs/llm/v1/chat/completions` | The custom-LLM bridge. **This is where the transcript is written, turn by turn** |
| `POST /api/elevenlabs/tools/escalate` | Handoff to a human advisor |
| `POST /api/elevenlabs/webhooks/post-call` | Reconciles turns the bridge dropped, stores the audio, takes their duration as truth |

**Buy the number:**

```bash
# Search UAE, or wherever you want the caller to dial
twilio api core available-phone-numbers local list --country-code AE --limit 5
twilio phone-numbers:buy:local --country-code AE
```

Caller-ID caveat: a Twilio US number presents as `+1` to a Dubai customer. A
local presentation number needs TDRA approval — see `NOT-IMPLEMENTED.md`.

**In the ElevenLabs dashboard:**

1. Store a workspace secret named exactly `SUPERDEMO_BRIDGE_SECRET`, value =
   your `ELEVENLABS_BRIDGE_SECRET`. The agent references it by that name for
   both the bridge and the escalate tool.
2. Import the Twilio number (Phone Numbers → import, with your Twilio SID and
   auth token) and assign it to the agent.
3. Set the **post-call webhook** to `$PUBLIC_BASE_URL/api/elevenlabs/webhooks/post-call`,
   signed with `ELEVENLABS_WEBHOOK_SECRET`.
4. Set the **conversation-initiation webhook** to
   `$PUBLIC_BASE_URL/api/elevenlabs/webhooks/conversation-init`.
5. **Check the agent's custom-LLM URL.** Your existing `ELEVENLABS_AGENT_ID` was
   created against some earlier address — `PUBLIC_BASE_URL` is empty in your
   local `.env`, so it is not pointing at anything reachable now. It must read
   `$PUBLIC_BASE_URL/api/elevenlabs/llm`, and the escalate tool must read
   `$PUBLIC_BASE_URL/api/elevenlabs/tools/escalate`.

On (5), editing the two URLs in the dashboard is better than re-running
`POST /api/elevenlabs/setup/agent`. That endpoint creates a *new* agent wired to
the current `PUBLIC_BASE_URL` and hands back an id to paste into
`ELEVENLABS_AGENT_ID` — useful for a first-time setup, but it leaves the old
agent behind and you would have to re-attach the number and redo the voice and
turn-taking settings, which live only in the dashboard on purpose.

Then dial the number. A successful call leaves a `Conversation` with `Message`
rows per turn, `TranscriptSegment` rows on the `Call`, a `Recording` on the
mounted share, and the whole thing readable in the inbox with the transcript
scroll-locked to the waveform.

**Optional, and worth it:** `LLM_DRIVER` defaults to `scripted`, which answers
from knowledge-base retrieval. Set `LLM_DRIVER=claude` with an
`ANTHROPIC_API_KEY` for a genuinely conversational demo — `ANTHROPIC_MODEL`
already defaults to `claude-opus-5`.

## 11. The worker, if you want it

The outbox drains inline in the API, which is adequate. Splitting it out keeps a
slow CRM push off the live-call path:

```bash
az containerapp create -g $RG -n superdemo-worker \
  --environment $CAE \
  --image $ACR.azurecr.io/superdemo-api:$TAG \
  --registry-server $ACR.azurecr.io \
  --registry-username $ACR --registry-password "$ACR_PASSWORD" \
  --command node --args apps/api/dist/worker.js \
  --min-replicas 1 --max-replicas 1 --ingress disabled \
  --env-vars NODE_ENV=production DATABASE_URL="$DATABASE_URL" REDIS_URL="$REDIS_URL" \
             JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET" JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
```

Same image, no HTTP listener. One replica here too — two workers would drain the
same outbox rows twice.

---

## Redeploying

```bash
export TAG=v2
az acr build -r $ACR -t superdemo-api:$TAG -f Dockerfile .
bash azure/render.sh
az containerapp update -g $RG -n $APP --yaml azure/containerapp.local.yaml
```

`app.enableShutdownHooks()` means SIGTERM drains in-flight calls rather than
cutting them off, and the `Dockerfile` has no shell wrapper so the signal
actually reaches node.

## What will bite

**One replica, and it is not negotiable yet.** `@socket.io/redis-adapter` is
installed but never wired up, so a socket event emitted on one replica never
reaches a client on another — the live inbox and softphone would silently
half-work. Separately, the dialer's `@Interval` and the `@Cron` jobs in
`maintenance.service.ts` would double-fire per replica. Both need fixing before
`maxReplicas` goes above 1, and neither is hard: an `IoAdapter` override for the
first, a Redis lock for the second.

**A new storage driver would be ignored.** Both `elevenlabs.telephony.ts` and
`media/media.controller.ts` inject `LocalStorage` concretely rather than the
`STORAGE_PROVIDER` token. Writing an Azure Blob driver means fixing those two
injections in the same change, or it will be configured and silently do nothing.
This is why step 3 mounts a share instead.

**`WEB_ORIGIN` is one origin, not a list.** Vercel preview deployments will not
talk to the production API.

**No migrations, no CI.** `db push` has no history and no way back, and nothing
builds or tests on push — `.github/workflows` does not exist.

**The browser softphone never uploads audio.** `POST /media/recording` is
implemented server-side, but nothing in `apps/web` calls it and there is no
`MediaRecorder` anywhere. Browser-originated calls therefore produce no
recording; ElevenLabs calls do, through the post-call webhook.

## Roughly what it costs

Burstable B1ms Postgres, Basic C0 Redis, a 0.5 vCPU Container App running
always-on, Basic ACR and a 5 GB file share land in the low tens of dollars a
month at current list prices — check the Azure pricing calculator for your
region rather than trusting a number written here. Vercel stays free. The
variable cost that will actually matter is ElevenLabs conversation minutes plus
Twilio per-minute, neither of which Azure affects.
