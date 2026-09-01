# SuperDemo — Skills & Stack Matrix

*"What do we actually need to build?"* — every capability the platform requires, the library or technique chosen for it, why that one, and whether it's in v1.

Legend: **v1** = building now · **P2** = scaffolded, deferred · **P3** = later phase

---

## 0. As-built deviations from this plan

This document was written before the build. The tables below are the *intended* stack; these rows
came out differently in practice, and the reasons matter more than the plan did:

| Planned | As built | Why |
|---|---|---|
| Fastify adapter | **Express adapter** | Fastify + socket.io + Nest 11 has sharp edges, and at 12 agents the throughput difference is irrelevant. Chose the boring path that provably works over the theoretically faster one. |
| pgvector | **`Float[]` + in-process BM25/IDF ranking** | The vendored Postgres can't build extensions. At 34 chunks the scan is sub-millisecond, and calibrated retrieval mattered far more than the storage mechanism — see the confidence note below. |
| shadcn/ui via CLI | **shadcn/ui, installed via the CLI** into `components/ui/*` | As planned. Primitives are owned source — `button.tsx` was extended in place with `danger`/`live` variants and a `loading` prop rather than wrapped. App-level compounds (Metric, Panel-style Card, MockNotice) sit in `components/composites.tsx` on top. |
| wavesurfer.js waveform | **progress bar with the handoff marked** | Real waveform rendering needs decoded audio; the useful part for a supervisor is *where the AI handed off*, which this shows. wavesurfer is a drop-in upgrade. |
| shadcn Radix `Select` everywhere | **native `<select>` styled with shadcn tokens** | Selects here live in dense table rows and the docked softphone. Native gives real keyboard behaviour, the OS picker on mobile, and no portal fighting the softphone's z-index. `components/ui/select.tsx` is installed for anywhere the richer picker is worth it. |
| casl | **role guard + `@Roles()`** | Three roles and coarse rules. casl's cost is justified by row-level abilities, which single-tenant doesn't have yet. |
| nestjs-zod | **own `ZodValidationPipe`** (~35 lines) | Same outcome, one fewer dependency, and it reuses `@superdemo/contracts` verbatim. |
| nestjs-pino / terminus | **Nest logger + plain `/ready`** | `/ready` checks Postgres and Redis and reports active drivers, which is what a deploy gate needs. Structured logging is worth adding before production. |
| BullMQ for wrap-up timers | **in-process timers** | BullMQ is installed and Redis is running, but wrap-up and ring timeouts are seconds-long and tied to a live socket — surviving a restart isn't meaningful for them. The **outbox** (which must survive) is durable in Postgres. |
| husky / commitlint / ESLint / react-hook-form / papaparse / virtualisation | **not installed** | Deferred. `tsc --noEmit` passes on both apps and is wired as `pnpm typecheck`; the rest is polish that adds no capability. |

One thing the plan understated: **retrieval confidence calibration**. Raw cosine similarity landed
every query between 0.20 and 0.45, so any fixed confidence floor either escalated everything or
nothing. The shipped scorer ranks with BM25 and derives confidence from *IDF-weighted query
coverage* — "how much of the informative meaning in this question does the best passage actually
account for?" That is naturally 0–1, explainable to a client, and correctly scores near zero for
courses FIT doesn't teach.

---

## 1. Foundation

| Capability | Choice | Why this one | Phase |
|---|---|---|---|
| Monorepo | pnpm workspaces + **Turborepo** | Content-hashed remote caching; `pnpm` strict node_modules catches phantom deps that break in prod | v1 |
| Language | **TypeScript 5.7**, strict, ESM | `strict` + `noUncheckedIndexedAccess` on from day one — retrofitting is misery | v1 |
| Runtime | Node 24 LTS | Native `fetch`, stable test runner, `--env-file` | v1 |
| Shared contracts | **zod 3** in `packages/contracts` | One schema → NestJS validation (`nestjs-zod`), OpenAPI, web types, socket payload types. Kills client/server drift | v1 |
| Env validation | zod schema, parsed at boot | Fail-fast beats a `undefined` API key discovered mid-demo | v1 |
| Lint / format | ESLint 9 flat + typescript-eslint + Prettier | Flat config is the only supported path now | v1 |
| Hooks | husky + lint-staged + commitlint | Conventional commits → generated changelog | v1 |
| CI | GitHub Actions: typecheck → lint → test → build | Turbo cache makes it ~90s | v1 |

---

## 2. Backend — NestJS

| Capability | Choice | Why this one | Phase |
|---|---|---|---|
| Framework | **NestJS 11** + **Fastify** adapter | DI and module boundaries are what keep a contact-centre codebase from becoming a ball of mud; Fastify is ~2× Express throughput | v1 |
| ORM | **Prisma 6** | Best-in-class migrations and typed client; relation-heavy call/participant queries stay readable | v1 |
| Database | **PostgreSQL 17** | JSONB for provider payloads, partial indexes, window functions for agent occupancy, `pgvector` for KB | v1 |
| Vector search | **pgvector** | One less service. 20 courses ≈ a few hundred chunks — a dedicated vector DB would be theatre | v1 |
| Cache / pubsub | **Redis 7** (already installed locally) | BullMQ backing store, socket.io adapter, KB cache — three jobs, one dependency | v1 |
| Job queue | **BullMQ** | Retries with backoff, DLQ, repeatable jobs, delayed jobs (wrap-up timers). Battle-tested on Redis | v1 |
| Realtime | **socket.io** + `@socket.io/redis-adapter` | Rooms and reconnection semantics we'd otherwise rebuild badly; Redis adapter = horizontal scale | v1 |
| Validation | **nestjs-zod** | Reuses `packages/contracts` verbatim. class-validator would mean a second schema definition | v1 |
| Auth | **@nestjs/passport** + JWT, **argon2** | Access 15m + rotating refresh with reuse detection, httpOnly SameSite=Strict cookies | v1 |
| Authorisation | **casl** | Declarative ability rules: agent→own calls, supervisor→team, admin→settings. Beats guard sprawl | v1 |
| API docs | **@nestjs/swagger** from zod | Free OpenAPI; useful when hirestella resells this | v1 |
| Logging | **pino** + `nestjs-pino` | Structured JSON, correlation id threaded HTTP → queue → socket | v1 |
| Health | **@nestjs/terminus** | Readiness gates deploys on Postgres + Redis + provider reachability | v1 |
| Scheduling | **@nestjs/schedule** | Nightly metric rollups, recording retention sweep, Bitrix token refresh | v1 |
| Rate limiting | **@nestjs/throttler** | Login brute-force and webhook flood protection | v1 |
| Hardening | **helmet**, CORS allowlist | Baseline | v1 |
| Tracing | OpenTelemetry hooks, no collector yet | Wired but unexported — turn on when volume justifies it | P2 |

---

## 3. Frontend — Next.js

| Capability | Choice | Why this one | Phase |
|---|---|---|---|
| Framework | **Next.js 15** App Router, React 19 | Server Components for shells; Client Components for the realtime surfaces | v1 |
| Styling | **Tailwind v4** | New engine, CSS-first config, no `tailwind.config.js` sprawl | v1 |
| Components | **shadcn/ui** | Source-in-repo, not a dependency — extended in place for the call-control variants, and the whole app re-themes from CSS variables | v1 |
| Server state | **TanStack Query v5** | Socket events patch/invalidate the cache — zero polling anywhere in the app | v1 |
| Local state | **Zustand** | Only for the softphone state machine. Deliberately no global store | v1 |
| Tables | **TanStack Table v8** | Headless: server-side sort/filter/paginate on 100k+ conversations | v1 |
| Forms | **react-hook-form** + zod resolver | Same schemas as the API | v1 |
| Charts | **Recharts** | Composable, SSR-safe, one shared theme, light+dark, colour-blind-safe ramp | v1 |
| Audio playback | **wavesurfer.js** | Waveform with transcript scroll-locked to playhead; escalation marked on the timeline | v1 |
| Icons | **lucide-react** | Matches shadcn | v1 |
| Dates / tz | **date-fns** + `date-fns-tz` | Dubai / Kolkata / Cairo are all in play — tz is a correctness issue, not cosmetic | v1 |
| Toasts | **sonner** | Incoming-call and sync-failure surfacing | v1 |
| Theme | **next-themes** + 3-way toggle (light / dark / system) | Dark mode for agents on night shift. The whole palette derives from two CSS variables (`--fit-red`, `--fit-red-dark`) so FIT's real brand hex is a one-line change | v1 |
| Tables→CSV | **papaparse** | Supervisors will ask to export reports on the call | v1 |
| Virtualisation | **@tanstack/react-virtual** | Long transcripts and the conversation list | v1 |

---

## 4. Telephony & AI — the swappable layer

Every one of these sits behind an interface in `packages/contracts`. Switching driver is an env var.

| Capability | v1 (free) | Production path | Phase |
|---|---|---|---|
| **Telephony** | `simulated` — deterministic scenario runner emitting real domain events; `browser` — real mic/speaker + `RTCPeerConnection` for the human leg, our API as signalling server | **LiveKit Agents** self-hosted (native SIP in/out, WebRTC softphone) on a **TDRA-licensed UAE trunk** | v1 → P2 |
| **STT** | **Web Speech API** (`webkitSpeechRecognition`) — free, streaming, interim results, in-browser | Deepgram Nova / self-hosted `whisper.cpp` | v1 → P2 |
| **TTS** | **SpeechSynthesis API** — free, instant, no network hop | ElevenLabs Flash / self-hosted **Piper** | v1 → P2 |
| **Conversation brain** | `scripted` — keyword + embedding retrieval over the FIT course KB. Deterministic, zero hallucination, zero cost, perfect for a demo | **Claude** (`claude-opus-5`) for generative handling — structured output so the reply, confidence, intent and sentiment arrive schema-validated in one call; `ollama` driver for free local dev | v1 → P2 |
| **Recording** | `MediaRecorder` → opus/webm → local disk | LiveKit Egress → Cloudflare R2 | v1 → P2 |
| **Transcript** | Web Speech results, already segmented and speaker-attributed | Deepgram diarisation | v1 → P2 |
| **Barge-in / VAD** | Web Speech `interimResults` as a proxy | Silero VAD in the LiveKit pipeline | P2 |
| **Turn detection** | Silence timer | Semantic turn detection | P3 |

**Why mock rather than trial a paid provider:** the demo needs to be repeatable and offline-safe on someone else's Wi-Fi, cost nothing, and — critically — exercise the same code that production will run. A free-trial key that expires or rate-limits mid-presentation is a worse risk than a simulator.

---

## 5. Contact-centre domain logic

Not a library — this is the part we actually engineer.

| Capability | Approach | Phase |
|---|---|---|
| Call state machine | Explicit states + guarded transitions in `CallsService`; illegal transitions throw. No boolean soup | v1 |
| Skills-based routing | Queues mapped to FIT's four course categories; longest-idle-available selection with skill match | v1 |
| Escalation with context | Transfer payload carries AI summary, detected intent, course of interest, transcript, sentiment, Bitrix URL → screen-pop before "hello" | v1 |
| Agent presence | Current-state row for reads + append-only event log for reports | v1 |
| Wrap-up timer | BullMQ delayed job auto-returns agent to AVAILABLE | v1 |
| Dispositions | Configurable per queue, mandatory before wrap ends | v1 |
| Idempotency | `providerCallId` unique constraint + Redis dedupe on webhook event ids | v1 |
| Transactional outbox | Domain write and event publish in one transaction; worker drains | v1 |
| Recording retention | Nightly sweep against `Recording.expiresAt` | v1 |
| Consent announcement | Spoken on answer, configurable per number (UAE/India/Egypt law) | v1 |
| Whisper / barge / listen-in | Supervisor monitoring | P2 |
| Conference / 3-way | `CallParticipant` already supports it | P2 |
| Callback queue | Caller abandons → scheduled outbound | P2 |
| CSAT | Post-call 1–5 IVR | P2 |

---

## 6. Bitrix24 CRM integration

| Capability | Method | Phase |
|---|---|---|
| Connection | Inbound webhook (free Bitrix plan, no app review) | v1 |
| Caller identification | `crm.contact.list` by phone → `crm.contact.add` / `crm.lead.add` | v1 |
| Call in CRM timeline | `telephony.externalcall.register` → `.show` → `.finish` | v1 |
| Recording attached | `telephony.externalcall.attachRecord` | v1 |
| AI transcript + summary logged | `crm.activity.add` | v1 |
| Bitrix → us | Outbound webhook `ONCRMLEADADD` / `ONCRMCONTACTUPDATE` → signature-verified queued handler | v1 |
| Field mapping UI | Map our fields ↔ their custom Bitrix fields | v1 |
| Sync log + retry | `CrmSyncLog` table, visible in settings, manual replay | v1 |
| Chat into Open Channels | `imconnector.register` — **requires a Bitrix local app with OAuth, not a webhook** | P2 |
| Bitrix-initiated click-to-call | `telephony.externalCall` app placement | P2 |

---

## 7. Observability & quality

| Capability | Choice | Phase |
|---|---|---|
| Unit tests | **Vitest** | v1 |
| API e2e | **Supertest** against a dedicated Postgres schema (Testcontainers needs Docker — not installed) | v1 |
| UI e2e | **Playwright** driving the `simulated` driver through ring→AI→escalate→answer→hangup→CRM | v1 |
| Frontend mocking | **MSW** | v1 |
| Seed data | Real FIT courses, 12 agents across 3 locations, 4 queues, ~200 historical calls | v1 |
| Structured logs | pino + correlation id | v1 |
| Error tracking | Sentry (free tier) | P2 |
| Dashboards | Grafana + Prometheus | P3 |
| Load test | k6 against the simulated driver | P2 |

---

## 8. Deployment

| Concern | Choice | Phase |
|---|---|---|
| Local | brew Postgres 17 + pgvector, brew Redis (installed), `pnpm dev`. **No Docker required** | v1 |
| Web hosting | Vercel (free) | v1 |
| API + worker | Fly.io or Railway (free tier) | v1 |
| Database | Neon (free, pgvector supported) | v1 |
| Redis | Upstash (free) | v1 |
| Object storage | Cloudflare R2 (free egress) | v1 |
| Secrets | Platform env vars; no `.env` in git | v1 |
| Migrations | `prisma migrate deploy` in release step | v1 |
| **UAE data residency** | Fallback: single Dubai VPS (Hetzner/DO) + Caddy. Architecture unchanged, target changed | P2 if asked |

---

## 9. What we are deliberately *not* using

| Rejected | Reason |
|---|---|
| Docker / docker-compose locally | Not installed on this machine; brew services are simpler and faster for a 2-service stack |
| Twilio / Vapi / Retell in v1 | Paid per minute, and a trial key that rate-limits mid-demo is a worse risk than a simulator |
| Redux / Redux Toolkit | TanStack Query owns server state; Zustand covers the one genuinely local machine |
| A dedicated vector DB | pgvector handles a few hundred KB chunks; anything more is résumé-driven |
| GraphQL | Single known client, heavily realtime. REST + typed sockets is less machinery |
| Microservices | Single-tenant, 12 agents. A modular monolith with a separate worker process is the correct size |
| Kafka | BullMQ on the already-present Redis covers every ordering guarantee this needs |
| tRPC | zod contracts + OpenAPI keep the API consumable by hirestella's other clients later |
