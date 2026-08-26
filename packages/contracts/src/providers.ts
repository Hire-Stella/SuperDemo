import type { AvailableNumberDto, KnowledgeSearchResult } from './dto';
import type { EscalationReason, ParticipantKind, Skill } from './enums';

/**
 * Provider seams. Every external system the platform touches sits behind one of
 * these. v1 ships mock implementations; production swaps the driver via env var
 * with no change above this line.
 *
 * Rule: these interfaces describe *what the contact centre needs*, not what any
 * particular vendor offers. That is what keeps the swap cheap.
 */

/* ============================== telephony ================================= */

export interface InboundCallEvent {
  /** Provider's own id. Unique-constrained in our DB → idempotent redelivery. */
  providerCallId: string;
  fromNumber: string;
  toNumber: string;
  callerName?: string;
  receivedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface TelephonyCallHandle {
  providerCallId: string;
  /** Room/session identifier the media layer uses (LiveKit room, WebRTC id). */
  mediaSessionId: string | null;
}

export interface PlayAudioOptions {
  /** Text to synthesise and play to the caller. */
  text: string;
  voice?: string;
  language?: string;
  /** If true, caller speech interrupts playback. */
  allowBargeIn?: boolean;
}

/**
 * The carrier seam.
 *
 * `simulated` — deterministic scripted calls, no media.
 * `browser`   — real mic/speaker via Web Speech; WebRTC for the human leg.
 * `livekit`   — real SIP trunk. Not implemented in v1.
 */
export interface TelephonyProvider {
  readonly name: string;
  /** Whether real audio flows. False for `simulated`; drives UI affordances. */
  readonly supportsMedia: boolean;
  readonly supportsOutbound: boolean;

  /** Answer an inbound call and attach the AI leg. */
  answer(providerCallId: string): Promise<TelephonyCallHandle>;

  /** Speak to the caller. No-op for `simulated` (text is logged as a turn). */
  play(providerCallId: string, opts: PlayAudioOptions): Promise<void>;

  /** Bridge a human agent in. Returns the token/credentials the client needs. */
  bridgeAgent(
    providerCallId: string,
    agentUserId: string,
  ): Promise<{ mediaSessionId: string; agentToken: string | null }>;

  /** Remove the AI leg once a human has taken over. */
  releaseAi(providerCallId: string): Promise<void>;

  hold(providerCallId: string, hold: boolean): Promise<void>;
  hangup(providerCallId: string, reason?: string): Promise<void>;

  /**
   * Outbound dial. Throws NotImplemented on drivers that can't (check
   * `supportsOutbound` first).
   *
   * Resolves once the attempt is placed, not once it is answered — whether
   * anyone picked up arrives via `TelephonySink.onOutboundResult`.
   */
  dial(params: {
    fromNumber: string;
    toNumber: string;
    /** What the assistant says first, when the driver drives the script. */
    opener?: string;
    /** Scales scripted pauses on the simulated driver. Ignored by real ones. */
    speed?: number;
  }): Promise<TelephonyCallHandle>;

  /** Called once at boot so a driver can register listeners / warm up. */
  init?(): Promise<void>;
}

/** Where inbound provider events land. Implemented by CallsService. */
export interface TelephonySink {
  onInboundCall(event: InboundCallEvent): Promise<void>;
  onCallerHangup(providerCallId: string): Promise<void>;
  /**
   * How an outbound attempt resolved.
   *
   * Inbound arrives as an event; outbound is the inverse — we already created
   * the call, and what we do not know is whether anyone picked up. A dialer
   * needs that answer to decide between "log the conversation" and "retry in
   * two hours", so it is a distinct callback rather than an overload of
   * onInboundCall.
   */
  onOutboundResult?(params: {
    providerCallId: string;
    answered: boolean;
    failureReason?: string;
  }): Promise<void>;
  /** A caller utterance became available (final, not partial). */
  onCallerUtterance(params: {
    providerCallId: string;
    text: string;
    startMs: number;
    endMs: number;
    confidence?: number;
  }): Promise<void>;
}

/* ============================ number provisioning ========================= */

/**
 * DID inventory. The mock driver keeps a realistic +971 stock so the
 * SIM-replacement story can be demonstrated end-to-end. Real provisioning needs
 * a TDRA-licensed UAE carrier — see NOT-IMPLEMENTED.md §4.
 */
export interface NumberProvisioningProvider {
  readonly name: string;
  search(params: { country: string; contains?: string; limit: number }): Promise<AvailableNumberDto[]>;
  purchase(e164: string): Promise<{ e164: string; provider: string; purchasedAt: Date }>;
  release(e164: string): Promise<void>;
}

/* =============================== messaging =============================== */

export interface InboundMessageEvent {
  providerMessageId: string;
  channel: 'WHATSAPP' | 'WEBCHAT';
  fromNumber: string;
  fromName?: string;
  text: string;
  receivedAt: Date;
}

/** WhatsApp / web chat seam. `mock` in v1, Meta Cloud API later. */
export interface MessagingProvider {
  readonly name: string;
  readonly channel: 'WHATSAPP' | 'WEBCHAT';
  send(params: {
    toNumber: string;
    text: string;
    conversationId: string;
  }): Promise<{ providerMessageId: string }>;
  /** Mark read — no-op on mock. */
  markRead?(providerMessageId: string): Promise<void>;
}

export interface MessagingSink {
  onInboundMessage(event: InboundMessageEvent): Promise<void>;
}

/* ================================== AI =================================== */

export interface ConversationTurn {
  role: 'CALLER' | 'AI';
  text: string;
}

export interface BrainRequest {
  /** Full history so far, oldest first. */
  history: ConversationTurn[];
  /** The caller's latest utterance. */
  utterance: string;
  systemPrompt: string;
  /** Retrieved knowledge-base context, highest scoring first. */
  context: KnowledgeSearchResult[];
  turn: number;
  /**
   * Configured phrases that mean "get me a person". Supplied by the
   * orchestrator from the AI agent's escalation rules so the client's admin can
   * tune them without a deploy.
   */
  handoffKeywords?: string[];
}

export interface BrainResponse {
  reply: string;
  /** 0..1 — how well the KB actually covered the question. Drives escalation. */
  confidence: number;
  /** Free-text intent label, e.g. "fee_enquiry" or "course_schedule". */
  detectedIntent: string | null;
  /** Which FIT course the caller is asking about, if identifiable. */
  courseOfInterest: string | null;
  /** -1..1 */
  sentiment: number;
  /** Driver-detected escalation need; the orchestrator also applies rules. */
  wantsHuman: boolean;
  /** True when the caller's need is met and the call can end. */
  resolved: boolean;
  /** Doc titles used, surfaced in the UI as citations. */
  citations: string[];
  usage?: { inputTokens: number; outputTokens: number; costUsd: number };
}

/**
 * The conversation brain.
 *
 * `scripted` — deterministic retrieval over the FIT knowledge base. Zero cost,
 *              zero hallucination, and it escalates when it doesn't know. This
 *              is the correct default in front of a client.
 * `claude`   — generative handling for production.
 * `ollama`   — local model for offline development.
 */
export interface LlmProvider {
  readonly name: string;
  respond(req: BrainRequest): Promise<BrainResponse>;
  /** Post-call summary for the CRM timeline and the screen-pop. */
  summarise(history: ConversationTurn[]): Promise<{
    summary: string;
    detectedIntent: string | null;
    courseOfInterest: string | null;
  }>;
}

/**
 * STT/TTS are declared for completeness but v1 runs both *in the browser*
 * (Web Speech API) — the server only receives final transcripts. These
 * interfaces exist so a server-side driver (Deepgram, ElevenLabs, Piper) can be
 * introduced without touching the orchestrator.
 */
export interface SttProvider {
  readonly name: string;
  readonly runsInBrowser: boolean;
  transcribe?(audio: Uint8Array, mimeType: string): Promise<{ text: string; confidence: number }>;
}

export interface TtsProvider {
  readonly name: string;
  readonly runsInBrowser: boolean;
  synthesise?(text: string, voice: string): Promise<{ audio: Uint8Array; mimeType: string }>;
}

/* ================================ storage ================================= */

export interface StorageProvider {
  readonly name: string;
  put(key: string, body: Uint8Array, contentType: string): Promise<{ key: string; size: number }>;
  /** Short-lived signed URL. Recording access is audited by the caller. */
  signedUrl(key: string, ttlSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/* ================================== CRM =================================== */

export interface CrmContactRef {
  entity: 'lead' | 'contact';
  id: string;
  url: string | null;
}

export interface CrmContactInput {
  name: string | null;
  phoneE164: string;
  email?: string | null;
  courseInterest?: string | null;
  source?: string;
}

export interface CrmCallInput {
  providerCallId: string;
  contact: CrmContactRef;
  fromNumber: string;
  toNumber: string;
  direction: 'INBOUND' | 'OUTBOUND';
  startedAt: Date;
  durationSeconds: number;
  /** Bitrix expects 200 for a successful call, 304 for missed, 603 declined. */
  statusCode: '200' | '304' | '603';
  agentBitrixUserId?: string | null;
}

/**
 * CRM seam. The Bitrix24 driver uses inbound webhooks, which is enough for
 * contacts, leads and `telephony.externalcall.*`. Pushing *chat* into Bitrix
 * Open Channels needs an application context — see NOT-IMPLEMENTED.md §3.
 */
export interface CrmProvider {
  readonly name: string;
  readonly portalUrl: string | null;

  /**
   * Whether this CRM can represent a call that is still happening.
   *
   * Bitrix can (`telephony.externalcall.register` shows a ringing call to the
   * agent). Zoho cannot — its Calls module records calls that already ended, so
   * its driver opens a record and completes it later. HubSpot can, via
   * `hs_call_status`.
   *
   * Declared rather than inferred so callers can say "appears in the CRM when
   * the call ends" instead of implying live visibility every driver would then
   * have to fake. Adding a fourth and fifth provider is what made this
   * necessary: three different flavours of pretending is a bug waiting to be
   * written.
   */
  readonly supportsLiveCall: boolean;

  testConnection(): Promise<{ ok: boolean; detail: string; scopes?: string[] }>;

  /** Match on phone, create a lead when unknown. */
  findOrCreateContact(input: CrmContactInput): Promise<CrmContactRef>;

  /**
   * Open the CRM's record for this call and return its id.
   *
   * On a provider with `supportsLiveCall` the record is visible immediately; on
   * one without, it exists but only becomes meaningful once `finishCall` runs.
   */
  registerCall(input: CrmCallInput): Promise<{ crmCallId: string }>;

  /** telephony.externalcall.finish */
  finishCall(params: {
    crmCallId: string;
    durationSeconds: number;
    statusCode: '200' | '304' | '603';
    failedReason?: string;
  }): Promise<void>;

  /** telephony.externalcall.attachRecord */
  attachRecording(params: {
    crmCallId: string;
    filename: string;
    /** Publicly reachable URL, or base64 content for small files. */
    url?: string;
    contentBase64?: string;
  }): Promise<void>;

  /** crm.activity.add — the AI transcript + summary on the timeline. */
  logActivity(params: {
    contact: CrmContactRef;
    subject: string;
    description: string;
    completed: boolean;
  }): Promise<{ activityId: string }>;
}

/* ============================== knowledge ================================= */

/** Retrieval over the FIT course knowledge base. */
export interface KnowledgeRetriever {
  search(params: { query: string; limit?: number; category?: Skill }): Promise<KnowledgeSearchResult[]>;
}

/* ============================== escalation =============================== */

/** Result of applying escalation rules to a brain response. */
export interface EscalationDecision {
  escalate: boolean;
  reason: EscalationReason | null;
  /** Human-readable justification, stored on the AI session for auditing. */
  detail: string | null;
}

/* ============================== transcripts ============================== */

export interface TranscriptTurnInput {
  speaker: ParticipantKind;
  startMs: number;
  endMs: number;
  text: string;
  confidence?: number;
}

/** Thrown by drivers that intentionally don't implement a capability. */
export class NotImplementedByDriverError extends Error {
  constructor(driver: string, capability: string) {
    super(
      `Driver "${driver}" does not implement ${capability}. ` +
        `See NOT-IMPLEMENTED.md for the production path.`,
    );
    this.name = 'NotImplementedByDriverError';
  }
}
