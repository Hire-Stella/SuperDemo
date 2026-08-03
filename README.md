# FIT-AI — AI Contact Centre for FIT Institute

AI-first contact centre: inbound AI voice with warm handoff to human agents, a unified inbox
across voice and WhatsApp, and synchronisation with the client's existing Bitrix24 CRM.

**Client:** [FIT Institute](https://fitiedu.com), Dubai (JLT) — KHDA-approved training provider.
**Vendor:** hirestella.ai

- [ARCHITECTURE.md](ARCHITECTURE.md) — low-level design, schema, event flow
- [SKILLS.md](SKILLS.md) — every capability → chosen library → why
- [NOT-IMPLEMENTED.md](NOT-IMPLEMENTED.md) — **read before any client conversation**

---

## Run it locally

No Docker, no Homebrew, no system installs. This machine has no system package manager, so
PostgreSQL is vendored into the repo: `embedded-postgres` manages real PostgreSQL 17 binaries
under `node_modules`, with the cluster in `.data/pg`.

```bash
pnpm install
pnpm services:up                  # real Postgres 17 on :55432 + Redis on :6379
cp .env.example .env              # already points at those
pnpm db:push && pnpm db:seed      # FIT courses, 12 agents, 4 queues, ~570 historical calls
```

Then, in two terminals:

```bash
# terminal 1 — API (HTTP + WebSocket)
cd apps/api && pnpm build && npx dotenv -e ../../.env -- node dist/main.js

# terminal 2 — dashboard
cd apps/web && pnpm dev
```

| Service  | URL                            | Notes |
|----------|--------------------------------|-------|
| Dashboard | http://localhost:3200          | port 3200, not 3000 — 3000 and 3001 were already in use on this machine |
| API       | http://localhost:3101/api      | `/ready` reports Postgres, Redis and which drivers are active |
| Postgres  | `localhost:55432`              | vendored, repo-local |
| Redis     | `localhost:6379`               | pre-existing install |

**Sign in** with any seeded account, password `Password123!`:

| Account | Role | Use it to see |
|---|---|---|
| `layla@fitiedu.com` | Admin | settings, numbers, AI config, simulator |
| `omar@fitiedu.com` | Supervisor | live ops, analytics |
| `mariam@fitiedu.com` | Agent | the softphone receiving a real handoff |

---

## The two-minute demo

1. Sign in as **mariam** in one browser window and set her status to **Available** (she holds the
   Education skill, which is where an ABA enquiry routes).
2. Sign in as **layla** in a second window → **Simulator** → scenario
   *“ABA certification — fees then handoff”* → **Place the call**.
3. Watch **Live ops**: the call appears, the AI answers, handles four turns from the knowledge
   base, then escalates.
4. Mariam's softphone rings with the **screen-pop** — caller name, the course, the AI's summary,
   why it stepped back, and the transcript so far. She answers already knowing the context.
5. She ends the call, picks a disposition. Within seconds the conversation shows a recording, a
   synced transcript, and a CRM badge.

For the version where the audience **talks to the AI themselves**, use *Simulator → Talk to the AI*
in Chrome or Edge. Their microphone drives the real assistant; escalation hands to a live agent.

---

## What's real and what's simulated

The dashboard, call state machine, routing, escalation, transcripts, recordings, analytics and CRM
sync are **production code**. Only the external systems are substituted — visible at a glance on
**Settings → Active drivers** (amber = simulated, green = real).

| Driver | Default | Swap to |
|---|---|---|
| `TELEPHONY_DRIVER` | `simulated` — scripted FIT calls, or `browser` for real mic/speaker | `livekit` + a **TDRA-licensed UAE carrier** |
| `LLM_DRIVER` | `scripted` — deterministic KB retrieval, zero cost, cannot hallucinate a fee | `claude` (Opus 5) or `ollama` |
| `CRM_DRIVER` | `mock` | `bitrix` + an inbound webhook URL (~2 minutes for the client to create) |
| `MESSAGING_DRIVER` | `mock` | `meta` (needs Meta business verification) |
| `STT` / `TTS` | browser Web Speech — free, Chrome/Edge only | Deepgram / ElevenLabs |

**The one thing to be careful about in front of the client:** UAE law reserves PSTN-terminating
voice to TDRA-licensed operators, so this platform cannot issue UAE numbers itself. What it *can*
do — and what genuinely solves their stated problem — is put the India and Egypt agents on browser
softphones with no SIM and no roaming, with calls egressing through a licensed UAE trunk. The exact
wording for that conversation is in [NOT-IMPLEMENTED.md](NOT-IMPLEMENTED.md) §6.

---

## Theming

The dashboard is built on **shadcn/ui** — components are owned source under
`apps/web/components/ui/`, so they're edited directly rather than configured
around. App-level compounds (metric tiles, the panel-style card, the simulated
notice) live in `apps/web/components/composites.tsx`.

**The FIT red is two CSS variables.** In `apps/web/app/globals.css`:

```css
--fit-red:      oklch(0.53 0.204 26);  /* light mode */
--fit-red-dark: oklch(0.7  0.185 26);  /* dark mode — lifted so it stays red */
```

Change those and the whole app follows — buttons, active nav, charts, heatmap.
The current values are a chosen institutional red, **not** FIT's official brand
hex; if they send their brand guide, that's the only edit needed.

A red brand in an ops dashboard has one genuine conflict: red is also the
universal "something is wrong" colour. The palette resolves it deliberately —
brand red for identity and primary actions, **amber** for warnings, a deeper
red for critical only, green for healthy, purple for AI-handled. Every state
also carries an icon or label, so nothing depends on hue alone.

There's a three-way theme toggle (light / dark / system) in the sidebar footer
and on the login page. Agents work night shifts, so dark mode is a requirement
rather than a nicety.

---

## Layout

```
apps/
  api/     NestJS 11 — call engine, AI orchestrator, integrations
           main.ts = HTTP + WebSocket · worker.ts = BullMQ only (same codebase)
  web/     Next.js 15 — dashboard + docked agent softphone
packages/
  contracts/  zod schemas, socket event types, provider interfaces (single source of truth)
  db/         Prisma schema, seed, FIT knowledge base
scripts/
  services.mjs  starts/stops the vendored Postgres + Redis
```

## Useful commands

```bash
pnpm services:status     # are Postgres and Redis up
pnpm services:reset      # wipe the cluster (then db:push && db:seed)
pnpm db:studio           # browse the data
pnpm --filter @fit-ai/api typecheck
pnpm --filter @fit-ai/web typecheck
```

Set `SIMULATOR_AUTOPILOT=true` to generate a scripted call every 45 seconds, so an unattended
dashboard stays populated during a demo.
