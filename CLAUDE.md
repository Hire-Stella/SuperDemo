# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

SuperDemo is HireStella's multi-tenant AI contact centre: inbound/outbound AI voice with warm handoff to human agents, a unified inbox (voice + WhatsApp), per-tenant CRM sync, and a public landing page per tenant. FIT Institute is the seeded demo tenant. Before changing behaviour, skim `README.md` (feature rationale), `ARCHITECTURE.md` (LLD, event flow), `SKILLS.md` (capability → library) and `NOT-IMPLEMENTED.md` (what is deliberately missing or simulated).

## Commands

pnpm 11 workspaces + Turborepo, Node ≥22. No Docker or system installs: Postgres 17 is vendored via `embedded-postgres` (cluster in `.data/pg`).

```bash
pnpm install
pnpm services:up                 # Postgres on :55432 + Redis on :6379 (status | down | reset)
pnpm db:push && pnpm db:seed     # schema + FIT tenant, 12 agents, ~570 calls
pnpm setup                       # all of the above in one go
```

All `db:*` and API scripts load `../../.env` via `dotenv-cli`. `README.md` says to copy `.env.example`, but that file is not committed. The env schema is `packages/contracts/src/env.ts` (`parseApiEnv`): every variable, its default, and the cross-field rules (e.g. `LLM_DRIVER=claude` requires `ANTHROPIC_API_KEY`).

Run locally (two terminals):

```bash
cd apps/api && pnpm build && npx dotenv -e ../../.env -- node dist/main.js   # API :3101/api; health at :3101/ready (no /api prefix)
cd apps/web && pnpm dev                                                       # dashboard :3200
```

`pnpm --filter @superdemo/api dev` (nest watch) also works. Sign in with seeded users using password `Password123!`: `super@hirestella.com` (platform operator), `layla@fitiedu.com` (admin), `omar@fitiedu.com` (supervisor), `mariam@fitiedu.com` (agent).

Checks:

```bash
pnpm typecheck                              # whole repo (builds deps first via turbo ^build)
pnpm --filter @superdemo/api typecheck
pnpm --filter @superdemo/web typecheck
pnpm --filter @superdemo/web lint           # next lint; the only package with lint
pnpm --filter @superdemo/api test           # vitest run; add a path or -t "<name>" for a single test
pnpm format                                 # prettier
```

The API has vitest configured, but no test files are committed yet. Other useful scripts: `pnpm db:studio`, `pnpm demo:tenant`, `pnpm demo:site`, `pnpm demo:seed`, and in `packages/db` the `backfill:*` and `seed:calendar` scripts. Set `SIMULATOR_AUTOPILOT=true` to generate a scripted call every 45s.

**`@superdemo/contracts` and `@superdemo/db` resolve from their `dist/`.** After editing either one, rebuild it (`pnpm --filter @superdemo/contracts build`, `pnpm --filter @superdemo/db build`) before the API or web will see the change. After editing `schema.prisma`, run `pnpm db:push` (it pushes and regenerates the client).

## Architecture

```
apps/api        NestJS 11. main.ts = HTTP + Socket.IO; worker.ts = outbox drainer only (same AppModule)
apps/web        Next.js 15 App Router, React 19, shadcn/ui. (app)/ = dashboard, (site)/[slug] = public tenant pages
apps/backend    Separate Python voice agents (FIT, Lampatron) using RAG, Modal deploys. Not in the pnpm workspace; see apps/backend/LAMPATRON.md
packages/contracts   zod DTOs, socket event types, provider interfaces, env schema, site/theme/brand enums. The single source of truth shared by api and web
packages/db          Prisma schema, seeds, tenant-isolation extension, seed data (FIT courses, demo packs, scenarios)
packages/templates/* @stella/template-*: ported landing-page designs. `runtime` aggregates them into TEMPLATES; `schema` defines their content shape
scripts/services.mjs starts and stops the vendored Postgres and Redis
```

### Swappable drivers, real core

External systems sit behind interfaces in `packages/contracts/src/providers.ts`. Each one is selected once at boot by an env var in a Nest module that uses a factory provider (pattern: `apps/api/src/integrations/llm/llm.module.ts`): `TELEPHONY_DRIVER` (simulated/browser/twilio/elevenlabs), `LLM_DRIVER` (scripted/claude/ollama), `CRM_DRIVER`, `MESSAGING_DRIVER`, `STT_DRIVER`, `TTS_DRIVER`, `STORAGE_DRIVER`. Everything else is production code: the call state machine, routing and escalation (`apps/api/src/calls/`), presence, transcripts, analytics, and outbox-based CRM sync. The defaults are free and simulated. **Settings → Active drivers** in the UI shows which drivers are real.

- `calls/ai-orchestrator.service.ts` runs AI turns against the `LlmProvider`. `routing.service.ts` handles escalation to human queues/skills, which triggers the agent softphone screen-pop over WebSocket (`realtime/`).
- `calls/dialer.service.ts` paces outbound campaigns on a 5s tick. It claims targets atomically and checks do-not-call at dial time. `dial()` only works on the simulated driver.
- Calendar (`calendar/`): `CalendarProvider` chosen per centre by `CalendarConfig.provider`. `mock` is our own `CalendarBooking` table. `calcom` (`calendar/calcom/`) takes slots from Cal.com v2 for one event type and creates/cancels bookings there first, then mirrors them locally (`externalUid`). The key is in `Setting.calcomSecretsEnc` (under `CRM_SECRET_KEY`). `CalcomService` reconciles every 60s, plus a webhook at `/api/public/calcom/:calendarToken` when `PUBLIC_BASE_URL` is set. Connect it from the Calendar page (ADMIN).
- CRM sync goes through `outbox/` and is one-way (us → CRM). `integrations/crm/crm.resolver.ts` picks a provider **per organisation**: Bitrix, Zoho, HubSpot, a signed webhook, or a mock. Credentials are AES-GCM encrypted under `CRM_SECRET_KEY` (`shared/secret-box.ts`) and are never returned by the API. A new CRM means a new `CrmProvider` class plus a case in `CrmResolver`.
- ElevenLabs integration (`integrations/elevenlabs/`) exposes an OpenAI-compatible SSE endpoint so that our API stays the brain while ElevenLabs handles the audio. `integrations/dograh/` powers the demo-call agents. `dograh-sync.service.ts` polls Dograh's superuser API (`DOGRAH_SUPERUSER_KEY`) every 60s and imports finished voice runs into the centre mapped by `Organization.dograhOrgId` / `dograhWorkflowIds`. Transcripts become `Message` rows and recordings are copied into local storage, both fetched via Dograh's `/s3/signed-url`. A 5s `pollLive` keeps in-progress runs in memory for `GET /api/ai-live` (`ai-live.controller.ts`), which drives the Live ops board for such centres (`components/ai-live-board.tsx`); a run leaving the live set triggers an immediate import. It writes the rollup directly via `AnalyticsService.rollUp`, not through the outbox, so imported calls are never pushed to a CRM.

### Multi-tenancy

- Every tenant-owned row has `orgId`. **Isolation is enforced by a Prisma client extension (`packages/db/src/tenant.ts`) that injects `orgId` into every where-clause and create.** Do not add manual org filters. Know its gaps: raw SQL and nested creates bypass it, so nested creates on scoped models must pass `orgId` explicitly. New tenant-owned models must be added to `TENANT_MODELS`.
- The org context comes from `tenancy/tenant.middleware.ts` and `tenant-context.service.ts`. Inbound calls have no session, so they are attributed to an org by the dialled number (`CallsService.onInboundCall`).
- A SUPERADMIN can read any centre (via the `X-Org-Id` header, set from `apps/web/lib/api.ts`) but can write only to `/api/platform/*`. `JwtAuthGuard` enforces this for every controller.
- Deleting an org removes tenant rows explicitly. Only `Setting` and `Site` cascade from `Organization`, so a new tenant model needs adding to the delete path too.
- Public tenant slugs are checked against `RESERVED_SLUGS` so they cannot shadow dashboard routes.

### Web

- `lib/api.ts` keeps the access token in memory only. Refresh uses an httpOnly cookie, and a 401 triggers a single shared refresh attempt. `lib/socket.ts` handles realtime events, whose types come from `contracts/src/events.ts`.
- Theming uses shadcn CSS variables. Tenant palettes are in `contracts/src/themes.ts`, with optional tweakcn `themeTokens` overrides, applied by `components/tenant-theme.tsx`. State colours (amber warning, green live, purple AI) are deliberately not themeable.
- Landing pages: `components/site/templates/registry.tsx` (`SiteRender`) tries the ported `@stella/template-runtime` library first, then falls back to the in-house templates (solaris, sentira, knotch, nudge). Site content is stored template-agnostically and converted at the seam (`library-adapter.ts`). The template packages must not learn about SuperDemo types. Layouts, palettes and treatments are defined in `contracts/src/sites.ts`. The hero colours are `color-mix` values derived from the tenant's `--primary`, never hard-coded.
- Ported templates compile with `tsconfig.templates.json` (`noUncheckedIndexedAccess` off) so the upstream code stays untouched.
- The platform name comes from `NEXT_PUBLIC_PLATFORM_NAME` via `apps/web/lib/platform.ts`.

## Deployment

See `DEPLOY.md` (Vercel for the web app, `Dockerfile` for the API) and `AZURE-DEPLOY.md` (`azure/` Container Apps scripts). In production the worker runs as its own process (`pnpm --filter @superdemo/api start:worker`) so that CRM pushes never add latency to live calls.
