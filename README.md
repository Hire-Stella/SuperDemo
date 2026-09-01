# SuperDemo — AI Contact Centre for FIT Institute

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
| `super@hirestella.com` | Platform operator | the one page that creates and manages contact centres |
| `layla@fitiedu.com` | Admin | settings, numbers, AI config, simulator |
| `omar@fitiedu.com` | Supervisor | live ops, analytics |
| `mariam@fitiedu.com` | Agent | the softphone receiving a real handoff |

### Tenancy

**HireStella is the platform; FIT Institute is a tenant on it.** The deployment hosts many
contact centres — clinics, restaurants, training institutes — and a platform operator creates
them from **Contact centres**, the only page that role has. The seed ships one tenant so the
demo has data; everything else is onboarded through that page.

Onboarding provisions a working centre, not an empty shell: queues, an AI receptionist briefed
for that vertical, placeholder knowledge documents and a phone number pointed at both. The
routing categories are re-labelled per vertical (`CATEGORY_LABELS`), so a clinic sees
*Appointments* where the institute sees *Courses & admissions* — same five slots underneath.

The platform's own name lives in `apps/web/lib/platform.ts` and reads
`NEXT_PUBLIC_PLATFORM_NAME`, so a white-label deployment changes one value.

A centre is created from a **name** and nothing else if you like. A logo is optional: where one
is missing the platform draws a monogram from the centre's own name in its own brand colour
(`packages/contracts/src/brand.ts`), so a tenant looks deliberate the moment it exists — in the
sidebar, on its landing page and in the browser tab. That is the difference between building six
demo centres before a meeting and building one.

Deleting a centre is possible, and asks for its handle typed back. Suspension is the reversible
action and the one a real client should ever get; deletion exists because demo tenants have to be
thrown away. It removes every tenant row explicitly — only `Setting` and `Site` cascade from
`Organization`, so relying on the database would orphan the rest.

### A landing page per centre

Every centre gets a public page at **`/{slug}`**, provisioned with the centre itself and editable
from **Website** in its own sidebar.

The point is not that anyone needs another website builder. It is that the page's call button
dials the DID that was provisioned two seconds earlier, and its callback form creates a contact in
that centre — optionally as a target on a campaign the dialer is working. One screen demonstrates
the whole loop.

* **Four layouts × eight palettes × 108 treatments** (`packages/contracts/src/sites.ts`), which is
  3,456 combinations and the reason a demo need not look like the last demo. A *layout* decides what
  is on the page; a *palette* is the tenant's theme; a *treatment* is four orthogonal axes — hero
  surface (plain / tinted / ink / full brand), headline face (serif / sans / condensed), corner
  radius and spacing. Six curated **Looks** pair them for you; every axis stays editable underneath.
  Content is stored template-agnostically, so switching any of it never loses a sentence anyone
  wrote.
* **Treatments follow the palette, not the other way round.** Every hero surface is a `color-mix`
  of the tenant's own `--primary`, emitted as `--site-hero-*` custom properties that the templates
  read — so no template branches on colour and none of them can drift out of step with a theme. The
  first version of `bold` had a near-black baked into it, which meant one layout in four ignored the
  client's brand entirely; the token indirection exists to make that impossible.
* **Starter copy per vertical.** A clinic's page talks about appointments and insurance, a gym's
  about trial sessions and monthly terms, with the centre's name substituted in. Real copy, not
  lorem, so a new tenant is presentable immediately.
* **Server-rendered with its theme in the HTML**, so a visitor never watches a client's page turn
  from HireStella red to their green.
* **Sections reorder and hide** from a form. That is most of what a builder is used for at a
  fraction of one; there is no block library, media pipeline or revision history, and the escape
  hatch for a client with strong opinions is their real website.
* **A live preview of the real page**, in an iframe beside the controls. Layout, palette and the
  four axes travel as query parameters that the public route validates against its own enums, so
  the preview is the same code a visitor gets rather than a second implementation that would drift.
  Nothing is persisted and no copy is overridable, so the worst a hand-written URL can do is render
  a page in one of its own supported looks — and a preview URL is `noindex`.

Two things worth knowing about the lead path, because they are where a landing page stops being
decoration and starts touching a client's data:

* A request is **queued to the dialer only while the nominated campaign is RUNNING**. Telling a
  visitor "we will call you shortly" and then parking them behind a paused list is worse than not
  promising. (A campaign fed only by web leads legitimately starts empty, so the "add someone
  before starting" check knows about that one exception.)
* **A do-not-call flag is not revoked by a web form.** Anyone can type anyone's number into a
  public page, so an opted-out number is recorded as a lead — the centre should see the enquiry —
  and never dialled. A human decides, with the opt-out visible beside the request.

Handles are checked against `RESERVED_SLUGS`: a centre called "Analytics" would otherwise take
`/analytics` and have its page permanently shadowed by the dashboard's, with nothing anywhere to
explain why. Suspending a centre takes its page down with it.

### Outbound campaigns

**Outbound** in the sidebar. A campaign has an opening line, an AI assistant, a list of people
drawn from contacts the centre already knows, and pacing: how many calls at once, a calling window
in the centre's own timezone, and how many attempts each person gets before it gives up.

The dialer (`apps/api/src/calls/dialer.service.ts`) ticks every 5s and asks only "may I place
another call right now" — never "how many are left", because pacing off a backlog is how a list
gets hammered. Three things it guarantees:

* **A consent basis is required**, in free text, and it is written onto every conversation the
  campaign creates. Cold-calling a list you happen to hold is not a lawful basis, and a dialer that
  doesn't make you write it down invites exactly that.
* **Opt-outs apply at dial time**, not at import. Marking a contact do-not-call also suppresses
  them from every list they are currently queued on.
* **Targets are claimed atomically**, so two API instances cannot call the same person at once.

Today it dials the **simulated** driver: real conversations, real AI turns, real analytics, no
carrier. `dial()` throws on the other drivers — attaching a carrier with outbound termination is
the only missing piece, and the dialer already treats "answered" as an event that arrives later,
which is the shape a real carrier has.

### CRM per tenant

Each centre picks its own CRM in **Settings → CRM integration**. A centre that picks nothing
inherits the deployment's `CRM_DRIVER`, so an existing single-tenant install keeps working
untouched.

| Provider | Credentials | Live calls? | Notes |
|---|---|---|---|
| **Bitrix24** | One inbound webhook URL | Yes | `telephony.externalcall.*` shows the call while it rings |
| **Zoho CRM** | OAuth client + refresh token + region | No | Calls module records finished calls; recordings become Notes |
| **HubSpot** | Private app token (`pat-…`) | Yes | Calls, Notes and a first-class recording field on the contact |
| **Custom webhook** | Your URL + a signing secret | No | Signed JSON to your endpoint — reaches Salesforce, Pipedrive, Dynamics or a booking system via Zapier / Make / your own code |
| **None** | — | Yes (mock) | In-process mock; sync still runs end to end |

Adding a sixth provider is a class implementing `CrmProvider` (8 members) plus a case in
`CrmResolver` and a form field — no migration, because credentials live in one encrypted blob
and non-secret fields in a JSON column.

**The webhook driver cannot read.** A CRM driver's first job is "does this caller already exist,
and what is their id"; a fire-and-forget POST gets no answer, so it returns a stable id derived
from the phone number. Reply with `{"id":"..."}` and it will use yours instead. Every request
carries `X-HireStella-Signature`: HMAC-SHA256 over `timestamp.body`, with the timestamp signed so
a captured request cannot be replayed.

**Sync is one-way (us → CRM).** There is no inbound route, so a lead edited in the CRM does not
flow back.

* Credentials are encrypted at rest with AES-256-GCM under `CRM_SECRET_KEY`, and the API never
  returns them — the settings page is told *whether* each secret is set, never what it is. Saving
  therefore means re-entering them.
* Without `CRM_SECRET_KEY` set, saving a credential is **refused** rather than stored in the clear.
* `CrmResolver` picks the driver per organisation and caches an instance keyed by a fingerprint of
  the credentials, so a change takes effect immediately and a Zoho access token is reused rather
  than re-minted per call.
* A centre with broken credentials fails its syncs into the outbox's dead letters — visible on its
  own settings page — while its calls keep being answered.

### Per-tenant theming

Every colour in the app is already a shadcn CSS custom property, so a tenant theme is just a
set of overrides for those same properties — which is exactly what
[tweakcn](https://tweakcn.com) exports. A client's brand can therefore be pasted in rather than
translated.

* **Presets** — seven palettes in `packages/contracts/src/themes.ts`, derived from a hue and a
  chroma so every tenant's UI is structurally identical and only differently coloured. The
  operator picks one per centre on the **Contact centres** page; a new centre defaults to
  whatever suits its vertical (clinic → teal, restaurant → amber).
* **Custom tokens** — `Organization.themeTokens` takes a tweakcn export as
  `{ light: {...}, dark: {...} }` and wins over the preset. Settable via
  `PUT /api/platform/orgs/:id`; there is no UI for pasting one yet.
* **What is not themeable, deliberately** — the state colours. Amber means warning, green means
  live, purple means AI-handled, in every centre. An operator moving between two clients should
  not have to relearn them.

Applied client-side by `components/tenant-theme.tsx`, which injects one stylesheet after
`globals.css`. There is a brief flash of the default palette on hard reload, since the theme is
only known once the session resolves.

* Every tenant-owned row carries `orgId`, and isolation is enforced by a Prisma client
  extension ([`packages/db/src/tenant.ts`](packages/db/src/tenant.ts)) that injects it into
  every where-clause and every create. Individual queries do not filter by org, so there is
  no filter to forget — that file also documents what it deliberately does not cover
  (raw SQL, nested writes).
* A platform operator can **read** any centre — a banner names the one on screen — and can
  **write** nothing inside it. `JwtAuthGuard` refuses their non-GET requests to anything but
  `/api/platform/*`, so the rule holds for controllers written later.
* Suspending a centre signs out its whole staff and refuses new sign-ins, and takes effect on
  the next request rather than when tokens expire, because the org is re-read every time.
* An inbound call is attributed to a centre by the number dialled
  ([`CallsService.onInboundCall`](apps/api/src/calls/calls.service.ts)), since a carrier
  webhook arrives with no session to inherit an org from.

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
| `STT` / `TTS` | browser Web Speech — free, Chrome/Edge only | `TTS_DRIVER=elevenlabs` for real voices, or the full ElevenLabs telephony path below |

### Real calling via ElevenLabs

`TELEPHONY_DRIVER=elevenlabs` puts real phone calls on the platform while **our
API stays the brain**. ElevenLabs does the part we don't want to build — PSTN,
speech-to-text, turn-taking, barge-in, low-latency synthesis. Everything that
makes this platform worth paying for stays here.

```
Caller ──SIP/Twilio──> ElevenLabs Agent
                            │  each turn
                            ▼
   POST /api/elevenlabs/llm/v1/chat/completions   (OpenAI-compatible, SSE)
                            │  KB retrieval · confidence floor · escalation policy
                            ▼
   escalate_to_advisor ──> our routing + agent screen-pop ──> Bitrix
```

Endpoints ElevenLabs calls, and how each is authenticated:

| Endpoint | Purpose | Auth |
|---|---|---|
| `POST /api/elevenlabs/webhooks/conversation-init` | create the Call, return `fit_call_id` | `elevenlabs-signature` HMAC |
| `POST /api/elevenlabs/llm/v1/chat/completions` | the brain, streamed as SSE | `Bearer ELEVENLABS_BRIDGE_SECRET` |
| `POST /api/elevenlabs/tools/escalate` | hand to a human immediately | `Bearer ELEVENLABS_BRIDGE_SECRET` |
| `POST /api/elevenlabs/webhooks/post-call` | transcript + recording ingest | `elevenlabs-signature` HMAC |

#### Two ways to run it

|  | Browser call (no carrier) | Phone call |
|---|---|---|
| Needs | API key + public URL | the above **plus** Twilio or a SIP trunk |
| Inbound | ✅ someone clicks "Start call" and speaks | ✅ a real number rings |
| Outbound to a real phone | ❌ impossible without a carrier | ✅ |
| Voice quality, turn-taking, barge-in | identical — same agent | identical |
| Our brain, KB, escalation, CRM | identical | identical |

**The browser path is the demo path.** ElevenLabs runs the media over WebRTC, so
you get their voice, real speech recognition, real turn-taking and working
barge-in with no Twilio account and no per-minute telephony. It's on
*Simulator → Talk to the AI — ElevenLabs voice*.

**Outbound to a real phone is not possible without a carrier.** ElevenLabs does
not sell numbers; outbound needs PSTN termination from Twilio or a SIP trunk.
Outbound *campaigns* can be demonstrated with the scripted simulator, but that is
a simulation and the UI labels it as one.

#### Turning it on

```bash
# 1. keys + a public URL (they cannot reach localhost)
ELEVENLABS_API_KEY=...
ELEVENLABS_BRIDGE_SECRET=$(openssl rand -hex 32)
ELEVENLABS_WEBHOOK_SECRET=$(openssl rand -hex 32)
PUBLIC_BASE_URL=https://<your-tunnel>.trycloudflare.com

# 2. create the agent (one call, returns the id)
curl -X POST -H "Authorization: Bearer <admin jwt>" \
  http://localhost:3101/api/elevenlabs/setup/agent

# 3. put the returned id in ELEVENLABS_AGENT_ID, restart, and in the ElevenLabs
#    dashboard store ELEVENLABS_BRIDGE_SECRET as a workspace secret named
#    FIT_BRIDGE_SECRET, and point the post-call webhook at
#    <PUBLIC_BASE_URL>/api/elevenlabs/webhooks/post-call
```

`TELEPHONY_DRIVER` can stay `simulated` for the browser path — the ElevenLabs
endpoints work regardless of which driver is active, so scripted traffic and a
live ElevenLabs call can run side by side during a demo.

**This does not solve the UAE number problem.** ElevenLabs supports third-party
SIP trunking, so a TDRA-licensed UAE trunk terminates straight into it with no
code change — but ElevenLabs and Twilio cannot themselves issue UAE numbers.
Until FIT contract a licensed carrier, leave `ELEVENLABS_TRANSFER_NUMBER` blank:
escalation still fires the screen-pop and the CRM sync, the caller is just told
an advisor will pick up rather than having their audio moved.

Verified without an account: the SSE bridge (correct KB answer, sentence-chunked
for lower latency), escalation reaching `AGENT_RINGING` in the right queue, the
escalate tool's idempotency, HMAC accept/reject/replay-reject, and bearer
accept/reject. Not verifiable without one: the conversation-init webhook's
response shape, which is implemented defensively with fallbacks.

**The one thing to be careful about in front of the client:** UAE law reserves PSTN-terminating
voice to TDRA-licensed operators, so this platform cannot issue UAE numbers itself. What it *can*
do — and what genuinely solves their stated problem — is put the India and Egypt agents on browser
softphones with no SIM and no roaming, with calls egressing through a licensed UAE trunk. The exact
wording for that conversation is in [NOT-IMPLEMENTED.md](NOT-IMPLEMENTED.md) §6.

---

## Transcripts, summaries and reports

Every completed call produces a transcript and an AI summary — including
AI-contained calls, which is most of the traffic.

| Artefact | Where | Export |
|---|---|---|
| Turn-by-turn transcript | conversation detail, timestamped, click-to-seek against the recording | **Transcript** button → `.txt` |
| AI summary + intent + course + handoff reason | conversation detail, the screen-pop, and the Bitrix timeline | in the transcript file |
| Call log | inbox, filterable by channel / containment / search | **Export CSV** → honours the active filters |
| Management report | analytics | **Report CSV** → headline, cost-avoided, daily, by queue, by location, handoff reasons, dispositions, top courses |
| Agent productivity | analytics | **Agents CSV** → handled, talk time, AHT, wrap, occupancy, adherence, missing dispositions |

Recordings only exist where there is genuinely audio: browser and ElevenLabs
calls capture it, simulated calls have no media path and the UI says so rather
than showing a dead player.

CSV exports guard against spreadsheet formula injection — a contact whose name
begins `=`, `+`, `-` or `@` is quoted as text, because Excel would otherwise
execute it when a supervisor opens the file.

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
pnpm --filter @superdemo/api typecheck
pnpm --filter @superdemo/web typecheck
```

Set `SIMULATOR_AUTOPILOT=true` to generate a scripted call every 45 seconds, so an unattended
dashboard stays populated during a demo.
