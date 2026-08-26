# FIT-AI — What's Mocked, What's Missing

Honest ledger. Read this before any client conversation so nothing gets over-promised.
Scope for v1: **inbound AI voice → human handoff, plus a mocked WhatsApp channel and mocked UAE
number provisioning**. Now **multi-tenant**: HireStella is the platform, and each contact centre
(FIT Institute among them) is a tenant with its own staff, data, branding and CRM.

Status: `MOCK` = works end-to-end but the external system is simulated · `STUB` = interface exists, no implementation · `NONE` = not started

---

## 0. Verified working (as of 2026-08-03)

Exercised end to end against the running stack, not just typechecked:

- **Full voice pipeline** — inbound → AI answers with consent line → 4 KB-grounded turns →
  escalation → agent screen-pop → agent answers → hangup → disposition → `COMPLETED` with derived
  timings (`queueWaitMs` 3.4s, `aiTalkMs`, `agentTalkMs`), all three participants recorded, and
  `crmSynced: true` via the transactional outbox.
- **Skills-based routing** — an ABA enquiry routed to *Education Enquiries*, not the next free agent.
- **Handoff detection** — `speak to a person`, `can someone call me please`, `have someone contact
  me`, `could an advisor phone me back` all escalate as `CALLER_REQUESTED`; ordinary questions do
  not over-escalate.
- **WhatsApp channel** — scripted customer thread, AI reply, escalation to *Finance & Tax*.
- **Browser call path** — start, turn, reply with citations, escalation.
- **Analytics** — 569 calls aggregated: 43.9% containment, SLA, AHT/ASA, cost-saved, 46-day series,
  5 queues, 3 locations, 88-cell heatmap, 8 top courses, 4 escalation reasons.
- **All 9 dashboard routes** compile and serve; both apps typecheck clean.

Four real bugs were found and fixed by running it rather than trusting it:

1. **Anaphoric retrieval quoted the wrong course's fee.** "And how much does it cost?" contains no
   course term, so retrieval returned whichever document mentioned fees — the assistant confidently
   quoted the Hospitality diploma's price for an ABA enquiry. Fixed with a topic anchor carried
   through the call.
2. **`wantsHuman` was written but never called**, so an explicit "can I speak to someone" escalated
   as `LOW_CONFIDENCE` instead of `CALLER_REQUESTED`.
3. **Callback phrasings were unmatched** — "can someone call me" is person-then-verb, which the
   original pattern didn't cover.
4. **The scripted caller hung up while queued**, ending calls before an agent could answer, because
   the closing timer was recreated after the escalation cleared it.

None of these would have been caught by a mocked dashboard.

---

## 1. Mocked in v1 — real code path, fake external system

| Area | What's real | What's mocked | To make it real |
|---|---|---|---|
| **PSTN carrier** | Call state machine, routing, queueing, escalation, recording, transcript, analytics, CRM push. **The ElevenLabs driver is built** — real telephony, STT, TTS and turn-taking, with our API as the brain via the custom-LLM bridge | No number is attached yet, and no ElevenLabs key is configured. `simulated` remains the default | Add `ELEVENLABS_API_KEY` + a public `PUBLIC_BASE_URL`, then attach a number: Twilio for a dialable test line, or a **TDRA-licensed UAE trunk** via their SIP support for production |
| **STT** | Transcript storage, segments, speaker labels, search, waveform sync | Chrome `webkitSpeechRecognition` — free, browser-only, English-biased, degrades on poor audio | Swap `STT_DRIVER=deepgram` (or self-host whisper.cpp) |
| **TTS** | Turn loop, audio delivery, barge-in timing | `SpeechSynthesis` — robotic, OS-voice-dependent, no Arabic-accented English | Swap `TTS_DRIVER=elevenlabs` or self-host Piper |
| **Conversation brain** | Turn loop, KB retrieval, escalation rules, session accounting | `scripted` driver: keyword + embedding match over the FIT course KB. Deterministic and safe, but cannot handle genuinely novel phrasing | Swap `LLM_DRIVER=claude` (defaults to `claude-opus-5`, structured output at low effort). Interface is unchanged |
| **Recordings storage** | Upload, signed URLs, retention sweep, audit | Local disk in dev | Point `STORAGE_DRIVER=r2` at Cloudflare R2 |
| **UAE number provisioning** | Inventory, purchase, routing to a queue + AI agent, release, roaming-saving estimate | The catalogue is fictional. Numbers use reserved/unassigned test ranges and cannot receive real calls | Contract a TDRA-licensed UAE carrier and implement `NumberProvisioningProvider` against their API |
| **Outbound calls** | Campaigns, pacing, calling windows, retries, opt-out, and the whole call flow — `CallsService.placeOutboundCall` creates real conversations with real AI turns, and `DialerService` paces them | The carrier. `dial()` is implemented on the **simulated** driver only; `browser` and the null driver still throw, and ElevenLabs needs an attached number | Attach a carrier with outbound termination. Nothing in the dialer changes — it already treats "answered" as an event that arrives later, which is the shape a real carrier has |

**The important nuance for the demo:** the dashboard, transcripts, recordings, analytics and the Bitrix24 timeline entries are all produced by production code. Only the carrier and the speech providers are substituted. Nothing in the UI is a screenshot or hardcoded fixture.

---

## 2. Real in v1 — genuinely live

- **CRM sync, per tenant — outbound only.** Bitrix24 via inbound webhook (contact/lead upsert, `telephony.externalcall.register/show/finish/attachRecord`, `crm.activity.add`), Zoho CRM via OAuth (Leads/Contacts search and create, Calls, Notes), HubSpot via private app token (Contacts, Calls, Notes), plus a signed generic webhook for anything else. Each centre connects its own from Settings; credentials are encrypted at rest. The drivers are real code making real calls — but see section 5: only the webhook driver has been run against a live receiver.
- Auth, RBAC, agent presence, queues, skills-based routing, escalation-with-context screen-pop, wrap-up timers, dispositions, analytics rollups, audit log, transactional outbox.
- The docked WebRTC softphone — this is the piece that replaces their physical SIM cards for the India and Egypt agents.

---

## 3. Not built — deferred by decision

| Feature | Client asked for it? | Status | Blocker / effort |
|---|---|---|---|
| **Outbound AI calling campaigns** | Yes — stated second priority | `MOCK` — dialer built, carrier substituted | Built: `Campaign`/`CampaignTarget`, per-campaign concurrency, a calling window in the centre's own timezone, retry with backoff, atomic target claiming (two API instances cannot double-call one person), a required consent basis recorded on every conversation, and a do-not-call flag honoured at dial time. Runs against the simulated driver today. Needs a carrier for real |
| **WhatsApp channel** | Yes — `+971 4 570 9603` is live today | `MOCK` — channel fully built, transport simulated | **Meta business verification (days–weeks) and their number must migrate off the WhatsApp Business *app* to the Cloud API — it stops working in the consumer app.** The inbox, AI brain, escalation and CRM sync are done; only the Meta transport is a driver swap |
| **Website live chat widget** | Yes | `NONE` — but cheap | ~2 days: `Conversation.channel = WEBCHAT` already exists and the WhatsApp inbox plumbing is reusable as-is. Needs an embeddable widget and a public websocket endpoint |
| **Chat threads inside Bitrix Open Channels** | Implied by "unified" | `NONE` | **`imconnector.register` only works in Bitrix *application* context — an inbound webhook cannot do it.** Requires building a Bitrix local app with OAuth |
| **Bitrix click-to-call from a lead card** | Not explicitly | `NONE` | Needs the same Bitrix local app |
| **Supervisor listen-in / whisper / barge** | Implied by "monitor" | `NONE` | Straightforward once LiveKit is in — rooms support it natively |
| **Conference / 3-way transfer** | No | `NONE` | `CallParticipant` schema already models it |
| **Callback queue on abandon** | No | `NONE` | Needs outbound |
| **CSAT survey (post-call 1–5)** | No | `NONE` | ~1 day |
| **Email channel** | No | `NONE` | Out of scope |
| **Multi-tenancy** | Yes — the platform onboards clinics, restaurants, institutes | `DONE` | Built. `orgId` on every tenant-owned row, enforced by a Prisma client extension (`packages/db/src/tenant.ts`) rather than per-query filters. A SUPERADMIN manages centres from one page and can read a centre but never write to it. Not done: Postgres RLS as a second line of defence, which would catch raw SQL the extension cannot see |
| **Arabic language support** | Not raised, but 200+ nationalities and Arabic courses make it likely | `NONE` | STT/TTS/LLM drivers all support it; the KB and prompts need Arabic content |
| **SSO / SAML** | No | `NONE` | — |
| **Mobile app** | No | `NONE` | The dashboard is responsive; a native app isn't scoped |

---

## 4. Open blockers we need answers on

| # | Question | Who | Why it blocks |
|---|---|---|---|
| 1 | Which **TDRA-licensed** UAE carrier will provide the SIP trunk / DID? ElevenLabs supports third-party SIP, so this drops in with no code change. | Client + Neeraj | Nothing about real calling can proceed without it. **UAE law restricts PSTN-terminating VoIP to licensed operators — we cannot lawfully replace their carrier with an international trunk.** What we *can* deliver: their agents in India and Egypt work on browser softphones with no SIM and no roaming, with calls egressing through a licensed UAE trunk. That does solve their stated cost problem — but it needs a carrier |
| 2 | Bitrix24 portal URL + an inbound webhook with `crm` and `telephony` scopes | Client | Blocks the real-CRM demo. Takes them 2 minutes |
| 3 | Does FIT require **UAE data residency**? | Client | Changes hosting from Vercel/Neon to a Dubai VPS. No architectural change |
| 4 | Recording retention period, and consent wording per jurisdiction | Client legal | Dubai, India and Egypt differ. Consent announcement is on by default |
| 5 | Their current Bitrix custom fields for leads | Client | Field-mapping UI needs the real field list |
| 6 | Expected call volume and concurrency | Neeraj | Decides self-hosted LiveKit vs managed, and STT/TTS spend |
| 7 | Do the 12 agents need Bitrix seats, or only our dashboard? | Client | Affects licensing cost in the proposal |
| 8 | Arabic support required? | Client | 200+ nationalities and four language diplomas make it likely |

---

## 5. Known limitations to state plainly if asked

- Browser Web Speech STT/TTS is **Chrome/Edge only** and needs internet (Chrome proxies recognition to Google). Firefox and Safari won't run the `browser` driver.
- The `scripted` conversation brain answers what's in the FIT knowledge base. Ask it something genuinely off-topic and it escalates to a human — which is correct behaviour, but it is not a general-purpose LLM until `LLM_DRIVER=claude` is switched on.
- Analytics are served from nightly-plus-incremental rollups. Numbers are live to the minute for today, exact for prior days.
- No load testing yet. Designed for 12 agents and low-hundreds of concurrent calls; unverified above that.
- **pgvector is not available** with the vendored Postgres, so `KnowledgeChunk.embedding` is `Float[]` and retrieval ranking runs in-process (BM25 + IDF-weighted coverage over 34 chunks — sub-millisecond). Swap to pgvector plus a real embedding model in production; `KnowledgeRetriever` is the only seam that changes.
- **Ports differ from the docs' defaults**: the API runs on **3101** and the dashboard on **3200**, because 3000 and 3001 were already occupied on the build machine.
- Recordings in dev sit on local disk unencrypted. Production uses R2 with encryption at rest and signed URLs.
- **A tenant gets five routing categories, not more.** `Skill` is a Postgres enum of five slots, and each vertical re-labels them (`CATEGORY_LABELS` in `packages/contracts/src/enums.ts`) — a clinic's "Appointments" and an institute's "Courses & admissions" are the same slot. This is why onboarding a new vertical needs no migration. A tenant that genuinely needs a sixth category needs the categories to become per-org rows, which changes routing (`RoutingService`), the knowledge category filter and the analytics group-bys. Nothing else is blocking it; it just isn't a label change.
- **The DB still stores the education-era slot names.** A clinic's "Appointments" queue has `requiredSkill = EDUCATION` on disk, and its settings row calls the business name `instituteName`. Harmless to the app — neither string is shown to a user — but confusing to anyone reading SQL directly. Renaming the enum would mean relabelling every existing tenant's rows to suit whichever vertical was onboarded most recently, so the names stayed put.
- **A tenant cannot change its own theme.** Only a platform operator can, from the Contact centres page. Deliberate for a white-label deployment (you brand the client's instance at onboarding), but if clients should self-serve it belongs in their Settings page — the API route would need to accept `themePreset` from an org's own ADMIN, which today it does not.
- **Pasting a tweakcn export has no UI.** `Organization.themeTokens` accepts one over `PUT /api/platform/orgs/:id` and overrides the preset, but the picker only offers the built-in palettes.
- **Two browser tabs can sign you out.** Refresh-token rotation treats a second use of the same token as theft and revokes every session, which is right for a stolen token and wrong for two tabs starting at once. Predates the tenancy work; the fix is a short grace window on concurrent reuse.
- **Provisioning templates are starting points, not content.** A newly onboarded centre gets working queues, an AI briefing and a phone number, but its knowledge documents are explicitly marked `PLACEHOLDER` and say so in the body. The AI will answer from them until the client replaces them, so onboarding is not finished until someone does.
- **The outbound dialer only dials the simulator.** The pacing, windows, retries, consent checks and call flow are production logic and were exercised end to end, but `dial()` is implemented on the `simulated` driver alone. The answer rate there is a fixed ~62% so analytics stay coherent with the seeded history — it is not a model of any real carrier's connect rate.
- **Outbound has no answering-machine detection.** A voicemail that picks up looks exactly like a person to this code: the AI opens, talks to the machine, and the call is recorded as answered. Real AMD is a carrier or media-server feature, and without it a client's connect-rate figures will be optimistic.
- **Nothing enforces a national do-not-call registry.** The `doNotCall` flag is per contact and per centre. UAE TDRA rules also require honouring their registry, which means an import path we do not have.
- **There is no inbound CRM → us sync.** An earlier version of this document listed `ONCRMLEADADD` / `ONCRMCONTACTUPDATE` handling under "Real in v1". That was wrong: there is no CRM webhook route in the API (`ProcessedWebhook` is used only by the ElevenLabs post-call hook), so a lead edited in Bitrix or Zoho does not flow back to us. Sync is one-way, us → CRM. Building the return path needs a public endpoint per provider plus their event subscriptions, and for Bitrix specifically an *application* rather than an inbound webhook.
- **The CRM is per centre, and the vendor integrations are untested against a real account.** Bitrix24, Zoho CRM and HubSpot can each be connected from a centre's Settings page, and the drivers make real calls to the right vendor and region — verified by watching Bitrix return 403, Zoho return `invalid_client` and HubSpot return 401 for deliberately fake credentials. None has been exercised against a live portal, because no credentials exist for one. The generic webhook driver *has* been tested end to end against a local receiver, including its HMAC signature. The mock remains the default.
- **The webhook driver cannot look a caller up.** It posts events and gets no answer, so `findOrCreateContact` returns an id derived from the phone number rather than the CRM's own. Stable (a repeat caller threads to the same record) but ours, so nothing in our UI can deep-link to the real record. A receiver that replies `{"id":"..."}` overrides it. Anything needing a genuine lookup wants a real driver.
- **HubSpot maps every caller to a Contact.** Its Leads object is recent and not enabled on every portal, so unlike Bitrix and Zoho there is no lead-versus-contact distinction. Association type ids (194 call→contact, 202 note→contact) are HubSpot-defined constants; if HubSpot ever changes them, records would be created but silently never appear on a timeline.
- **Zoho differs from Bitrix in two visible ways.** Zoho has no live-call API (`telephony.externalcall.*` has no equivalent), so a call appears on the Zoho timeline when it *ends* rather than while it rings. And Zoho's Attachments API takes no Call parent, so a recording is added as a Note containing its URL instead of as an attached file — which also means recordings need `PUBLIC_BASE_URL` set to be reachable.
- **Rotating `CRM_SECRET_KEY` orphans stored credentials.** Tenant CRM credentials are encrypted at rest with AES-256-GCM (`apps/api/src/shared/secret-box.ts`) using a key derived from that env var. There is no key rotation or re-encryption path: change the key and every centre must re-enter its credentials. A production deployment wants KMS here.
- **Numbers issued at onboarding are from the mock range** (`+97148…`, generated, `provider = mock`). Real DIDs need a TDRA-licensed UAE carrier, same caveat as the rest of the number inventory.

---

## 6. Honest demo script — what to show, what to say

**Show (all real):** live ops board with traffic · a browser call where the audience *talks to the AI* about ABA certification fees · the AI escalating on "let me speak to someone" · screen-pop landing on a Dubai agent with full AI context before they say hello · the recording with transcript scroll-locked to the waveform · that same call appearing in the Bitrix24 lead timeline with the recording attached · containment-rate and agent-productivity dashboards.

**Say, when asked about phone numbers:** *"The platform is carrier-agnostic — it connects to any TDRA-licensed UAE trunk. Your Dubai number stays with your licensed operator; your India and Egypt agents log in through the browser with no SIM and no roaming charges. We'll confirm the trunk provider with you as step one of the rollout."*

**Do not say:** that WhatsApp is ready, that outbound campaigns run today, that we can issue UAE virtual numbers ourselves, or that this is running on a live phone line.

**On outbound specifically.** Outbound is AI-first by design and the inbox, analytics
and exports already carry outbound AI calls — but that is *seeded history*, not a
working dialer. What is safe to say: "outbound is AI-led in the same way inbound is,
the reporting for it is built, and the dialer needs the carrier before it can run."
What is not safe: implying you could start a campaign on Tuesday. The five outbound
campaigns modelled — enquiry follow-up, intake reminder, incomplete enrolment,
certificate ready — are all follow-ups to people who already contacted FIT, never
cold calls, which is also what keeps them defensible under UAE consent rules. Worth
saying out loud, because it is a question their marketing side will ask.
