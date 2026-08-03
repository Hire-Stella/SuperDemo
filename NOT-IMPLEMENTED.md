# FIT-AI — What's Mocked, What's Missing

Honest ledger. Read this before any client conversation so nothing gets over-promised.
Scope for v1: **inbound AI voice → human handoff, plus a mocked WhatsApp channel and mocked UAE
number provisioning**, single-tenant.

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
| **PSTN carrier** | Call state machine, routing, queueing, escalation, recording, transcript, analytics, CRM push | No actual phone network. `simulated` driver replays scripted FIT calls; `browser` driver uses real mic/speaker between two browser tabs | Contract a TDRA-licensed UAE SIP trunk, implement `livekit/livekit-telephony.ts` against the existing `TelephonyProvider` interface |
| **STT** | Transcript storage, segments, speaker labels, search, waveform sync | Chrome `webkitSpeechRecognition` — free, browser-only, English-biased, degrades on poor audio | Swap `STT_DRIVER=deepgram` (or self-host whisper.cpp) |
| **TTS** | Turn loop, audio delivery, barge-in timing | `SpeechSynthesis` — robotic, OS-voice-dependent, no Arabic-accented English | Swap `TTS_DRIVER=elevenlabs` or self-host Piper |
| **Conversation brain** | Turn loop, KB retrieval, escalation rules, session accounting | `scripted` driver: keyword + embedding match over the FIT course KB. Deterministic and safe, but cannot handle genuinely novel phrasing | Swap `LLM_DRIVER=claude` (defaults to `claude-opus-5`, structured output at low effort). Interface is unchanged |
| **Recordings storage** | Upload, signed URLs, retention sweep, audit | Local disk in dev | Point `STORAGE_DRIVER=r2` at Cloudflare R2 |
| **UAE number provisioning** | Inventory, purchase, routing to a queue + AI agent, release, roaming-saving estimate | The catalogue is fictional. Numbers use reserved/unassigned test ranges and cannot receive real calls | Contract a TDRA-licensed UAE carrier and implement `NumberProvisioningProvider` against their API |
| **Outbound calls** | — | Not built at all. Only inbound is in v1 scope | Implement `TelephonyProvider.dial()` + a campaign module |

**The important nuance for the demo:** the dashboard, transcripts, recordings, analytics and the Bitrix24 timeline entries are all produced by production code. Only the carrier and the speech providers are substituted. Nothing in the UI is a screenshot or hardcoded fixture.

---

## 2. Real in v1 — genuinely live

- Bitrix24 sync via inbound webhook: contact/lead upsert, `telephony.externalcall.register/show/finish/attachRecord`, `crm.activity.add`, and inbound `ONCRMLEADADD`/`ONCRMCONTACTUPDATE` handling. Free Bitrix plan, no app review needed.
- Auth, RBAC, agent presence, queues, skills-based routing, escalation-with-context screen-pop, wrap-up timers, dispositions, analytics rollups, audit log, transactional outbox.
- The docked WebRTC softphone — this is the piece that replaces their physical SIM cards for the India and Egypt agents.

---

## 3. Not built — deferred by decision

| Feature | Client asked for it? | Status | Blocker / effort |
|---|---|---|---|
| **Outbound AI calling campaigns** | Yes — stated second priority | `NONE` | `TelephonyProvider.dial()` is declared and throws `NotImplementedByDriverError`. Needs a carrier with outbound termination plus a campaign/pacing module. ~1 week after telephony is real |
| **WhatsApp channel** | Yes — `+971 4 570 9603` is live today | `MOCK` — channel fully built, transport simulated | **Meta business verification (days–weeks) and their number must migrate off the WhatsApp Business *app* to the Cloud API — it stops working in the consumer app.** The inbox, AI brain, escalation and CRM sync are done; only the Meta transport is a driver swap |
| **Website live chat widget** | Yes | `NONE` — but cheap | ~2 days: `Conversation.channel = WEBCHAT` already exists and the WhatsApp inbox plumbing is reusable as-is. Needs an embeddable widget and a public websocket endpoint |
| **Chat threads inside Bitrix Open Channels** | Implied by "unified" | `NONE` | **`imconnector.register` only works in Bitrix *application* context — an inbound webhook cannot do it.** Requires building a Bitrix local app with OAuth |
| **Bitrix click-to-call from a lead card** | Not explicitly | `NONE` | Needs the same Bitrix local app |
| **Supervisor listen-in / whisper / barge** | Implied by "monitor" | `NONE` | Straightforward once LiveKit is in — rooms support it natively |
| **Conference / 3-way transfer** | No | `NONE` | `CallParticipant` schema already models it |
| **Callback queue on abandon** | No | `NONE` | Needs outbound |
| **CSAT survey (post-call 1–5)** | No | `NONE` | ~1 day |
| **Email channel** | No | `NONE` | Out of scope |
| **Multi-tenancy** | No — single-tenant chosen | `NONE` | If hirestella resells: add `tenant_id` + Postgres RLS. Cheaper now than later, but it was a deliberate call |
| **Arabic language support** | Not raised, but 200+ nationalities and Arabic courses make it likely | `NONE` | STT/TTS/LLM drivers all support it; the KB and prompts need Arabic content |
| **SSO / SAML** | No | `NONE` | — |
| **Mobile app** | No | `NONE` | The dashboard is responsive; a native app isn't scoped |

---

## 4. Open blockers we need answers on

| # | Question | Who | Why it blocks |
|---|---|---|---|
| 1 | Which **TDRA-licensed** UAE carrier will provide the SIP trunk / DID? | Client + Neeraj | Nothing about real calling can proceed without it. **UAE law restricts PSTN-terminating VoIP to licensed operators — we cannot lawfully replace their carrier with an international trunk.** What we *can* deliver: their agents in India and Egypt work on browser softphones with no SIM and no roaming, with calls egressing through a licensed UAE trunk. That does solve their stated cost problem — but it needs a carrier |
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

---

## 6. Honest demo script — what to show, what to say

**Show (all real):** live ops board with traffic · a browser call where the audience *talks to the AI* about ABA certification fees · the AI escalating on "let me speak to someone" · screen-pop landing on a Dubai agent with full AI context before they say hello · the recording with transcript scroll-locked to the waveform · that same call appearing in the Bitrix24 lead timeline with the recording attached · containment-rate and agent-productivity dashboards.

**Say, when asked about phone numbers:** *"The platform is carrier-agnostic — it connects to any TDRA-licensed UAE trunk. Your Dubai number stays with your licensed operator; your India and Egypt agents log in through the browser with no SIM and no roaming charges. We'll confirm the trunk provider with you as step one of the rollout."*

**Do not say:** that WhatsApp is ready, that outbound campaigns exist today, that we can issue UAE virtual numbers ourselves, or that this is running on a live phone line.
