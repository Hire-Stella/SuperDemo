import { z } from 'zod';
import {
  AgentStatus,
  CallState,
  Channel,
  ConversationStatus,
  Direction,
  Disposition,
  EscalationReason,
  HangupCause,
  Location,
  MessageRole,
  NumberStatus,
  ParticipantKind,
  Role,
  RoutingStrategy,
  Skill,
  SyncDirection,
  SyncStatus,
} from './enums';

/* ================================ primitives ============================== */

/** E.164. Deliberately strict: a malformed number breaks CRM matching silently. */
export const PhoneE164 = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be E.164, e.g. +971528876388');

export const Cuid = z.string().min(1);

export const Pagination = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type Pagination = z.infer<typeof Pagination>;

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    total: z.number().int().nonnegative().optional(),
  });
}

/* =================================== auth ================================= */

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const SessionUser = z.object({
  id: Cuid,
  email: z.string().email(),
  name: z.string(),
  role: Role,
  location: Location,
  timezone: z.string(),
  skills: z.array(Skill),
  avatarColor: z.string(),
});
export type SessionUser = z.infer<typeof SessionUser>;

export const LoginOutput = z.object({
  user: SessionUser,
  accessToken: z.string(),
});
export type LoginOutput = z.infer<typeof LoginOutput>;

/* ================================== users ================================= */

export const CreateUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: Role.default('AGENT'),
  location: Location,
  skills: z.array(Skill).min(1),
  extension: z.string().regex(/^\d{3,6}$/).optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInput>;

export const UpdateUserInput = CreateUserInput.partial().omit({ password: true });
export type UpdateUserInput = z.infer<typeof UpdateUserInput>;

export const AgentSummary = SessionUser.extend({
  extension: z.string().nullable(),
  status: AgentStatus,
  statusSince: z.coerce.date(),
  currentCallId: z.string().nullable(),
  /** Rolling today-only figures, cheap to compute from CallMetricsDaily. */
  today: z.object({
    callsHandled: z.number().int(),
    talkSeconds: z.number().int(),
    avgHandleSeconds: z.number().int(),
    occupancyPct: z.number(),
  }),
});
export type AgentSummary = z.infer<typeof AgentSummary>;

export const SetPresenceInput = z.object({
  status: AgentStatus,
  reason: z.string().max(120).optional(),
});
export type SetPresenceInput = z.infer<typeof SetPresenceInput>;

/* ================================ contacts ================================ */

export const ContactSummary = z.object({
  id: Cuid,
  name: z.string().nullable(),
  phoneE164: z.string().nullable(),
  email: z.string().nullable(),
  courseInterest: z.string().nullable(),
  bitrixEntity: z.string().nullable(),
  bitrixId: z.string().nullable(),
  bitrixUrl: z.string().nullable(),
  bitrixSyncedAt: z.coerce.date().nullable(),
  totalConversations: z.number().int().optional(),
});
export type ContactSummary = z.infer<typeof ContactSummary>;

/* ============================== conversations ============================= */

export const MessageDto = z.object({
  id: Cuid,
  role: MessageRole,
  text: z.string(),
  audioOffsetMs: z.number().int().nullable(),
  confidence: z.number().nullable(),
  createdAt: z.coerce.date(),
  authorName: z.string().nullable(),
});
export type MessageDto = z.infer<typeof MessageDto>;

export const CallParticipantDto = z.object({
  id: Cuid,
  kind: ParticipantKind,
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  joinedAt: z.coerce.date(),
  leftAt: z.coerce.date().nullable(),
});
export type CallParticipantDto = z.infer<typeof CallParticipantDto>;

export const CallDto = z.object({
  id: Cuid,
  providerCallId: z.string(),
  driver: z.string(),
  fromNumber: z.string(),
  toNumber: z.string(),
  state: CallState,
  ringingAt: z.coerce.date(),
  aiAnsweredAt: z.coerce.date().nullable(),
  escalatedAt: z.coerce.date().nullable(),
  agentAnsweredAt: z.coerce.date().nullable(),
  endedAt: z.coerce.date().nullable(),
  hangupCause: HangupCause.nullable(),
  escalationReason: EscalationReason.nullable(),
  queueWaitMs: z.number().int().nullable(),
  aiTalkMs: z.number().int().nullable(),
  agentTalkMs: z.number().int().nullable(),
  participants: z.array(CallParticipantDto).optional(),
});
export type CallDto = z.infer<typeof CallDto>;

export const RecordingDto = z.object({
  id: Cuid,
  durationMs: z.number().int(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  url: z.string(),
  expiresAt: z.coerce.date().nullable(),
});
export type RecordingDto = z.infer<typeof RecordingDto>;

export const TranscriptSegmentDto = z.object({
  id: z.string(),
  speaker: ParticipantKind,
  startMs: z.number().int(),
  endMs: z.number().int(),
  text: z.string(),
  confidence: z.number().nullable(),
});
export type TranscriptSegmentDto = z.infer<typeof TranscriptSegmentDto>;

export const AiSessionDto = z.object({
  id: Cuid,
  aiAgentName: z.string(),
  driverStt: z.string(),
  driverLlm: z.string(),
  driverTts: z.string(),
  turns: z.number().int(),
  escalated: z.boolean(),
  escalationReason: EscalationReason.nullable(),
  detectedIntent: z.string().nullable(),
  courseOfInterest: z.string().nullable(),
  sentiment: z.number().nullable(),
  summary: z.string().nullable(),
  avgLatencyMs: z.number().int().nullable(),
  costUsd: z.number().nullable(),
});
export type AiSessionDto = z.infer<typeof AiSessionDto>;

export const ConversationListItem = z.object({
  id: Cuid,
  channel: Channel,
  direction: Direction,
  status: ConversationStatus,
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable(),
  disposition: Disposition.nullable(),
  contact: ContactSummary.nullable(),
  queueName: z.string().nullable(),
  handledByName: z.string().nullable(),
  aiContained: z.boolean(),
  escalationReason: EscalationReason.nullable(),
  durationMs: z.number().int().nullable(),
  lastMessagePreview: z.string().nullable(),
  messageCount: z.number().int(),
  callState: CallState.nullable(),
  hasRecording: z.boolean(),
  crmSynced: z.boolean(),
});
export type ConversationListItem = z.infer<typeof ConversationListItem>;

export const ConversationDetail = ConversationListItem.extend({
  call: CallDto.nullable(),
  messages: z.array(MessageDto),
  recording: RecordingDto.nullable(),
  transcript: z.array(TranscriptSegmentDto),
  aiSession: AiSessionDto.nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
});
export type ConversationDetail = z.infer<typeof ConversationDetail>;

export const ListConversationsQuery = Pagination.extend({
  channel: Channel.optional(),
  status: ConversationStatus.optional(),
  disposition: Disposition.optional(),
  queueId: z.string().optional(),
  agentId: z.string().optional(),
  aiContained: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type ListConversationsQuery = z.infer<typeof ListConversationsQuery>;

export const UpdateConversationInput = z.object({
  disposition: Disposition.optional(),
  notes: z.string().max(4000).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
});
export type UpdateConversationInput = z.infer<typeof UpdateConversationInput>;

/* ================================== calls ================================= */

/** Agent actions from the softphone. */
export const AnswerCallInput = z.object({ callId: Cuid });
export const RejectCallInput = z.object({ callId: Cuid, reason: z.string().max(120).optional() });
export const HangupCallInput = z.object({ callId: Cuid });
export const HoldCallInput = z.object({ callId: Cuid, hold: z.boolean() });
export const TransferCallInput = z.object({
  callId: Cuid,
  targetUserId: z.string().optional(),
  targetQueueId: z.string().optional(),
});
export const CompleteWrapupInput = z.object({
  callId: Cuid,
  disposition: Disposition,
  notes: z.string().max(4000).optional(),
});
export type CompleteWrapupInput = z.infer<typeof CompleteWrapupInput>;

/**
 * Screen-pop payload. This is the product's differentiator: the agent sees the
 * AI's understanding *before* they say hello.
 */
export const ScreenPopPayload = z.object({
  callId: Cuid,
  conversationId: Cuid,
  fromNumber: z.string(),
  contact: ContactSummary.nullable(),
  queueName: z.string().nullable(),
  waitedMs: z.number().int(),
  ai: z
    .object({
      summary: z.string(),
      detectedIntent: z.string().nullable(),
      courseOfInterest: z.string().nullable(),
      sentiment: z.number().nullable(),
      escalationReason: EscalationReason,
      turns: z.number().int(),
      transcript: z.array(TranscriptSegmentDto),
    })
    .nullable(),
  history: z.array(
    z.object({
      id: Cuid,
      channel: Channel,
      startedAt: z.coerce.date(),
      disposition: Disposition.nullable(),
      summary: z.string().nullable(),
    }),
  ),
  expiresAt: z.coerce.date(),
});
export type ScreenPopPayload = z.infer<typeof ScreenPopPayload>;

/* ================================= queues ================================= */

export const QueueDto = z.object({
  id: Cuid,
  name: z.string(),
  requiredSkill: Skill,
  slaSeconds: z.number().int(),
  strategy: RoutingStrategy,
  isActive: z.boolean(),
  live: z.object({
    waiting: z.number().int(),
    longestWaitMs: z.number().int(),
    agentsAvailable: z.number().int(),
    agentsOnCall: z.number().int(),
  }),
});
export type QueueDto = z.infer<typeof QueueDto>;

export const UpsertQueueInput = z.object({
  name: z.string().min(2).max(60),
  requiredSkill: Skill,
  slaSeconds: z.coerce.number().int().min(5).max(600).default(20),
  strategy: RoutingStrategy.default('LONGEST_IDLE'),
  isActive: z.boolean().default(true),
});
export type UpsertQueueInput = z.infer<typeof UpsertQueueInput>;

/* ================================ ai agents =============================== */

export const EscalationRules = z.object({
  /** Any of these phrases in caller speech escalates immediately. */
  handoffKeywords: z.array(z.string()).default([
    'human',
    'agent',
    'person',
    'representative',
    'speak to someone',
    'real person',
    'manager',
  ]),
  /** Below this retrieval confidence, hand off rather than guess. */
  confidenceFloor: z.number().min(0).max(1).default(0.45),
  /** Hard cap on AI turns before handing off. */
  maxTurns: z.number().int().min(2).max(40).default(12),
  /** Sentiment below this (-1..1) escalates. */
  sentimentFloor: z.number().min(-1).max(1).default(-0.5),
  /** Intents the AI must never handle alone. */
  humanOnlyIntents: z.array(z.string()).default(['refund', 'complaint', 'visa', 'legal']),
});
export type EscalationRules = z.infer<typeof EscalationRules>;

export const AiAgentDto = z.object({
  id: Cuid,
  name: z.string(),
  greeting: z.string(),
  systemPrompt: z.string(),
  voice: z.string(),
  language: z.string(),
  escalationRules: EscalationRules,
  defaultQueueId: z.string().nullable(),
  isActive: z.boolean(),
  stats: z
    .object({
      calls30d: z.number().int(),
      containmentPct: z.number(),
      avgTurns: z.number(),
    })
    .optional(),
});
export type AiAgentDto = z.infer<typeof AiAgentDto>;

export const UpsertAiAgentInput = z.object({
  name: z.string().min(2).max(60),
  greeting: z.string().min(10).max(600),
  systemPrompt: z.string().min(10).max(8000),
  voice: z.string().default('en-GB'),
  language: z.string().default('en'),
  escalationRules: EscalationRules,
  defaultQueueId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});
export type UpsertAiAgentInput = z.infer<typeof UpsertAiAgentInput>;

/* =============================== knowledge ================================ */

export const KnowledgeDocDto = z.object({
  id: Cuid,
  title: z.string(),
  category: Skill,
  source: z.string(),
  chunkCount: z.number().int(),
  updatedAt: z.coerce.date(),
});
export type KnowledgeDocDto = z.infer<typeof KnowledgeDocDto>;

export const UpsertKnowledgeDocInput = z.object({
  title: z.string().min(2).max(200),
  category: Skill,
  source: z.string().max(200).default('manual'),
  content: z.string().min(20),
});
export type UpsertKnowledgeDocInput = z.infer<typeof UpsertKnowledgeDocInput>;

export const KnowledgeSearchResult = z.object({
  chunkId: Cuid,
  docId: Cuid,
  docTitle: z.string(),
  category: Skill,
  content: z.string(),
  score: z.number(),
});
export type KnowledgeSearchResult = z.infer<typeof KnowledgeSearchResult>;

/* ================================ numbers ================================= */

/**
 * Mocked DID inventory. Demonstrates the SIM-replacement story: buy a virtual
 * +971 number, assign it to a queue, agents anywhere answer it in the browser.
 * Real provisioning requires a TDRA-licensed carrier — see NOT-IMPLEMENTED.md.
 */
export const PhoneNumberDto = z.object({
  id: Cuid,
  e164: z.string(),
  label: z.string().nullable(),
  country: z.string(),
  region: z.string().nullable(),
  monthlyCostUsd: z.number(),
  status: NumberStatus,
  provider: z.string(),
  inboundQueueId: z.string().nullable(),
  inboundQueueName: z.string().nullable(),
  aiAgentId: z.string().nullable(),
  aiAgentName: z.string().nullable(),
  recordingEnabled: z.boolean(),
  purchasedAt: z.coerce.date().nullable(),
  calls30d: z.number().int().optional(),
});
export type PhoneNumberDto = z.infer<typeof PhoneNumberDto>;

export const AvailableNumberDto = z.object({
  e164: z.string(),
  country: z.string(),
  region: z.string(),
  monthlyCostUsd: z.number(),
  setupCostUsd: z.number(),
  capabilities: z.array(z.enum(['VOICE', 'SMS', 'WHATSAPP'])),
});
export type AvailableNumberDto = z.infer<typeof AvailableNumberDto>;

export const SearchNumbersQuery = z.object({
  country: z.string().length(2).default('AE'),
  contains: z.string().max(8).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export type SearchNumbersQuery = z.infer<typeof SearchNumbersQuery>;

export const PurchaseNumberInput = z.object({
  e164: PhoneE164,
  label: z.string().max(60).optional(),
  inboundQueueId: z.string().optional(),
  aiAgentId: z.string().optional(),
});
export type PurchaseNumberInput = z.infer<typeof PurchaseNumberInput>;

export const UpdateNumberInput = z.object({
  label: z.string().max(60).nullable().optional(),
  inboundQueueId: z.string().nullable().optional(),
  aiAgentId: z.string().nullable().optional(),
  recordingEnabled: z.boolean().optional(),
});
export type UpdateNumberInput = z.infer<typeof UpdateNumberInput>;

/* ================================ whatsapp ================================ */

export const SendMessageInput = z.object({
  conversationId: Cuid,
  text: z.string().min(1).max(4000),
});
export type SendMessageInput = z.infer<typeof SendMessageInput>;

export const ClaimConversationInput = z.object({ conversationId: Cuid });

/** Simulator entrypoint for mock WhatsApp traffic. */
export const SimulateWhatsAppInput = z.object({
  fromNumber: PhoneE164,
  fromName: z.string().max(80).optional(),
  text: z.string().min(1).max(1000),
});
export type SimulateWhatsAppInput = z.infer<typeof SimulateWhatsAppInput>;

/* =============================== simulator ================================ */

export const SimulateCallInput = z.object({
  scenarioId: z.string().optional(),
  fromNumber: PhoneE164.optional(),
  toNumber: PhoneE164.optional(),
  /** Multiplier on scripted delays. 0 = instant, useful for seeding. */
  speed: z.coerce.number().min(0).max(20).default(1),
});
export type SimulateCallInput = z.infer<typeof SimulateCallInput>;

export const ScenarioDto = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  skill: Skill,
  escalates: z.boolean(),
  expectedTurns: z.number().int(),
});
export type ScenarioDto = z.infer<typeof ScenarioDto>;

/** Browser-driver call control: the demo audience talks to the AI. */
export const StartBrowserCallInput = z.object({
  toNumber: PhoneE164.optional(),
  fromNumber: PhoneE164.optional(),
  callerName: z.string().max(80).optional(),
});
export type StartBrowserCallInput = z.infer<typeof StartBrowserCallInput>;

export const BrowserCallTurnInput = z.object({
  callId: Cuid,
  text: z.string().min(1).max(1000),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1).optional(),
});
export type BrowserCallTurnInput = z.infer<typeof BrowserCallTurnInput>;

export const BrowserCallTurnOutput = z.object({
  reply: z.string(),
  escalated: z.boolean(),
  escalationReason: EscalationReason.nullable(),
  endCall: z.boolean(),
  citations: z.array(z.string()),
  latencyMs: z.number().int(),
  turn: z.number().int(),
});
export type BrowserCallTurnOutput = z.infer<typeof BrowserCallTurnOutput>;

/* =============================== analytics ================================ */

export const LiveOpsSnapshot = z.object({
  activeCalls: z.number().int(),
  aiHandling: z.number().int(),
  withAgents: z.number().int(),
  waitingInQueue: z.number().int(),
  longestWaitMs: z.number().int(),
  agentsAvailable: z.number().int(),
  agentsOnCall: z.number().int(),
  agentsOnBreak: z.number().int(),
  agentsOffline: z.number().int(),
  openWhatsApp: z.number().int(),
  today: z.object({
    calls: z.number().int(),
    aiContained: z.number().int(),
    escalated: z.number().int(),
    abandoned: z.number().int(),
    containmentPct: z.number(),
    answeredWithinSlaPct: z.number(),
    avgHandleSeconds: z.number().int(),
    avgSpeedOfAnswerSeconds: z.number().int(),
  }),
});
export type LiveOpsSnapshot = z.infer<typeof LiveOpsSnapshot>;

export const ActiveCallRow = z.object({
  callId: Cuid,
  conversationId: Cuid,
  state: CallState,
  fromNumber: z.string(),
  contactName: z.string().nullable(),
  queueName: z.string().nullable(),
  agentName: z.string().nullable(),
  startedAt: z.coerce.date(),
  elapsedMs: z.number().int(),
  lastUtterance: z.string().nullable(),
  detectedIntent: z.string().nullable(),
});
export type ActiveCallRow = z.infer<typeof ActiveCallRow>;

export const AnalyticsRangeQuery = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  queueId: z.string().optional(),
  agentId: z.string().optional(),
});
export type AnalyticsRangeQuery = z.infer<typeof AnalyticsRangeQuery>;

export const AnalyticsOverview = z.object({
  totals: z.object({
    calls: z.number().int(),
    aiContained: z.number().int(),
    escalated: z.number().int(),
    abandoned: z.number().int(),
    whatsappConversations: z.number().int(),
    containmentPct: z.number(),
    abandonmentPct: z.number(),
    answeredWithinSlaPct: z.number(),
    avgHandleSeconds: z.number().int(),
    avgSpeedOfAnswerSeconds: z.number().int(),
    totalTalkHours: z.number(),
  }),
  /** Money slide: AI-contained calls never cost agent time. */
  savings: z.object({
    containedCalls: z.number().int(),
    agentHoursSaved: z.number(),
    estimatedCostSavedUsd: z.number(),
    assumedAgentHourlyUsd: z.number(),
  }),
  daily: z.array(
    z.object({
      day: z.string(),
      calls: z.number().int(),
      aiContained: z.number().int(),
      escalated: z.number().int(),
      abandoned: z.number().int(),
    }),
  ),
  escalationReasons: z.array(z.object({ reason: EscalationReason, count: z.number().int() })),
  dispositions: z.array(z.object({ disposition: Disposition, count: z.number().int() })),
  byQueue: z.array(
    z.object({
      queueId: z.string(),
      queueName: z.string(),
      calls: z.number().int(),
      containmentPct: z.number(),
      avgSpeedOfAnswerSeconds: z.number().int(),
      slaPct: z.number(),
    }),
  ),
  byLocation: z.array(
    z.object({
      location: Location,
      agents: z.number().int(),
      callsHandled: z.number().int(),
      avgHandleSeconds: z.number().int(),
      occupancyPct: z.number(),
    }),
  ),
  /** hour (0-23, institute tz) x weekday (0=Sun) heatmap of call volume. */
  hourlyHeatmap: z.array(
    z.object({ weekday: z.number().int(), hour: z.number().int(), calls: z.number().int() }),
  ),
  topCourses: z.array(z.object({ course: z.string(), enquiries: z.number().int() })),
});
export type AnalyticsOverview = z.infer<typeof AnalyticsOverview>;

export const AgentScorecard = z.object({
  userId: Cuid,
  name: z.string(),
  location: Location,
  callsHandled: z.number().int(),
  talkSeconds: z.number().int(),
  avgHandleSeconds: z.number().int(),
  avgWrapSeconds: z.number().int(),
  occupancyPct: z.number(),
  loggedInSeconds: z.number().int(),
  breakSeconds: z.number().int(),
  transfersOut: z.number().int(),
  dispositionsMissing: z.number().int(),
});
export type AgentScorecard = z.infer<typeof AgentScorecard>;

/* ================================== crm =================================== */

export const CrmConnectionDto = z.object({
  driver: z.string(),
  connected: z.boolean(),
  portalUrl: z.string().nullable(),
  lastSyncAt: z.coerce.date().nullable(),
  pending: z.number().int(),
  failed: z.number().int(),
  succeeded24h: z.number().int(),
});
export type CrmConnectionDto = z.infer<typeof CrmConnectionDto>;

export const CrmSyncLogRow = z.object({
  id: z.string(),
  direction: SyncDirection,
  method: z.string(),
  entityType: z.string(),
  localId: z.string().nullable(),
  bitrixId: z.string().nullable(),
  status: SyncStatus,
  attempts: z.number().int(),
  error: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type CrmSyncLogRow = z.infer<typeof CrmSyncLogRow>;

export const TestCrmConnectionOutput = z.object({
  ok: z.boolean(),
  driver: z.string(),
  portalUrl: z.string().nullable(),
  detail: z.string(),
  scopes: z.array(z.string()).optional(),
});
export type TestCrmConnectionOutput = z.infer<typeof TestCrmConnectionOutput>;
