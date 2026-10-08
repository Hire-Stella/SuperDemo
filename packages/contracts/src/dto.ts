import { z } from 'zod';
import { ThemePreset, ThemeTokens } from './themes';
import { isSafeLogoUrl } from './brand';
import { SiteTemplate } from './sites';
import { DemoDialerKind } from './demo-calls';
import { CrmDriver, EvalReviewer } from './enums';
import { CampaignStatus, TargetStatus } from './enums';
import {
  AgentStatus,
  AssignableRole,
  CallState,
  Industry,
  Channel,
  ConversationStatus,
  Direction,
  Disposition,
  DispositionFilter,
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
  ZohoRegion,
} from './enums';

/* ================================ primitives ============================== */

/** E.164. Deliberately strict: a malformed number breaks CRM matching silently. */
export const PhoneE164 = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be E.164, e.g. +971528876388');

export const Cuid = z.string().min(1);

/**
 * A logo URL, or nothing.
 *
 * Validated rather than sanitised, because this string is written into an
 * `<img src>` on a page served to anonymous visitors. Empty string is coerced to
 * null so that clearing the field in a form means "use the monogram" instead of
 * "point at nothing".
 */
export const LogoUrl = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || isSafeLogoUrl(v), {
    message: 'Use an http(s) URL or a path starting with /',
  });

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
  /** Null for SUPERADMIN only — every other role lives inside one org. */
  orgId: Cuid.nullable(),
  orgName: z.string().nullable(),
  /** Drives the routing-category labels this user sees. Null for SUPERADMIN. */
  orgIndustry: Industry.nullable(),
  /** This centre's theme, applied over globals.css. Null for SUPERADMIN. */
  orgThemePreset: ThemePreset.nullable(),
  orgThemeTokens: ThemeTokens.nullable(),
  /**
   * The centre's mark, shown in the app shell. Null means "draw the monogram
   * fallback" rather than "show nothing" — see packages/contracts/src/brand.ts.
   */
  orgLogoUrl: z.string().nullable(),
  orgTagline: z.string().nullable(),
  /**
   * Whether this centre uses the landing page. Null for SUPERADMIN, who has no
   * org of their own — the shell treats only an explicit `false` as "hide it",
   * so an operator inside a centre can still reach the section to turn it on.
   */
  orgWebsiteEnabled: z.boolean().nullable(),
  /** Same shape and same reasoning as orgWebsiteEnabled. Null for SUPERADMIN. */
  orgSimulatorEnabled: z.boolean().nullable(),
  /** Same shape and same reasoning as orgWebsiteEnabled. Null for SUPERADMIN. */
  orgDemoCallsEnabled: z.boolean().nullable(),
  /** Sidebar hrefs this user may open; empty means every section their role allows. */
  navAllowlist: z.array(z.string()),
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

/* ============================= organisations ============================== */

export const OrgSummary = z.object({
  id: Cuid,
  name: z.string(),
  slug: z.string(),
  industry: Industry,
  themePreset: ThemePreset,
  /** A pasted tweakcn export, if this centre has one. */
  themeTokens: ThemeTokens.nullable(),
  /** Null draws the monogram fallback — see brand.ts. */
  logoUrl: z.string().nullable(),
  tagline: z.string().nullable(),
  timezone: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  /** The public landing page: which layout, and whether it is live. */
  site: z
    .object({ template: z.string(), isPublished: z.boolean(), leads: z.number().int() })
    .nullable(),
  /** Headline counts for the superadmin's one page — cheap group-bys. */
  counts: z.object({
    users: z.number().int().nonnegative(),
    admins: z.number().int().nonnegative(),
    queues: z.number().int().nonnegative(),
    conversations: z.number().int().nonnegative(),
    numbers: z.number().int().nonnegative(),
  }),
  /** Null until someone signs in. Lets the operator spot a dormant centre. */
  lastLoginAt: z.coerce.date().nullable(),
});
export type OrgSummary = z.infer<typeof OrgSummary>;

/**
 * Creating an org and creating its first admin is one action, not two: an org
 * with no admin is unreachable, and leaving that window open is how you get
 * orphaned tenants nobody can log into.
 */
export const CreateOrgInput = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  /** Decides the queues, AI briefing and starter knowledge it is created with. */
  industry: Industry.default('GENERIC'),
  /** Omitted means "whatever suits the vertical" — see DEFAULT_PRESET_FOR_INDUSTRY. */
  themePreset: ThemePreset.optional(),
  /**
   * Identity. Both optional, and the whole point of the monogram fallback: a
   * demo centre should be creatable from a name alone, because "find their logo
   * first" is what stops you building six of them before a meeting.
   */
  logoUrl: LogoUrl.optional(),
  tagline: z.string().trim().max(120).optional(),
  /** Landing-page layout. Omitted follows the vertical — see sites.ts. */
  siteTemplate: SiteTemplate.optional(),
  /**
   * Whether to build this centre a landing page at all.
   *
   * Plenty of clients already have a website and are buying a contact centre,
   * and for them the page is a section of the product they will never open.
   * Off skips the page, skips enrichment, and hides the Website section — the
   * queues, agent, knowledge and number are created exactly the same.
   */
  websiteEnabled: z.boolean().default(true),
  /**
   * Whether this centre keeps the call simulator.
   *
   * On by default: it is the fastest way to prove routing works on a centre
   * thirty seconds old. Off for a client already taking real calls, to whom a
   * button that invents one is a support ticket waiting to happen.
   */
  simulatorEnabled: z.boolean().default(true),
  /**
   * Whether this centre gets the Demo calls page.
   *
   * On by default, same as the other two. Given a websiteUrl, enrichment
   * builds an inbound, an outbound and an info agent from the site and points
   * the three slots at them; otherwise they are chosen afterward in the voice
   * panel — there is no org yet for this request to point a workflow at.
   */
  demoCallsEnabled: z.boolean().default(true),
  /**
   * Which of the three demo-call slots this centre starts with switched on.
   *
   * With a websiteUrl, only these agents are built from the site; without one,
   * these slots are switched on and wait for an operator to pick their agents.
   * The landing page's call panel offers the same ones to visitors.
   */
  demoCallKinds: z
    .array(DemoDialerKind)
    .min(1, 'Choose at least one kind of demo call')
    .default(['inbound', 'outbound', 'info']),
  /**
   * The client's real website.
   *
   * Optional, and the centre is created identically without it — the vertical
   * template still provides queues, an agent, knowledge and a page. Supplied,
   * it queues an enrichment that reads the site and regenerates the landing
   * copy and the voice agent from what it actually says. See
   * packages/contracts/src/enrichment.ts for why that is not part of this
   * request.
   */
  websiteUrl: z
    .string()
    .trim()
    .url('Give a full URL, e.g. https://example.com')
    .max(300)
    .optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/, 'Use lowercase letters, numbers and hyphens')
    .optional(),
  timezone: z.string().default('Asia/Dubai'),
  admin: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    location: Location.default('DUBAI'),
  }),
});
export type CreateOrgInput = z.infer<typeof CreateOrgInput>;

export const UpdateOrgInput = z.object({
  name: z.string().min(2).max(80).optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
  themePreset: ThemePreset.optional(),
  /** A pasted tweakcn export. Null clears it and falls back to the preset. */
  themeTokens: ThemeTokens.nullable().optional(),
  /** Null clears the logo, which restores the monogram rather than blanking it. */
  logoUrl: LogoUrl.optional(),
  tagline: z.string().trim().max(120).nullable().optional(),
  /**
   * Turning this on for a centre that never had a page creates one from the
   * vertical template, so the section is never enabled and empty. Turning it
   * off leaves the page's content in the database untouched — it stops being
   * served, and comes back as it was if anyone changes their mind.
   */
  websiteEnabled: z.boolean().optional(),
  simulatorEnabled: z.boolean().optional(),
  demoCallsEnabled: z.boolean().optional(),
  /** Dograh organisation to import calls from. Null stops the import. */
  dograhOrgId: z.number().int().positive().nullable().optional(),
  /** Restrict the import to these workflows. Empty means all of them. */
  dograhWorkflowIds: z.array(z.number().int().positive()).optional(),
});
export type UpdateOrgInput = z.infer<typeof UpdateOrgInput>;

/**
 * Deleting a centre destroys everything in it, so the handle has to be typed
 * back. Suspension is the reversible action and the one a real client gets;
 * this exists because building demo tenants means discarding them.
 */
export const DeleteOrgInput = z.object({
  confirmSlug: z.string().min(1, 'Type the handle to confirm'),
});
export type DeleteOrgInput = z.infer<typeof DeleteOrgInput>;

/* ================================== users ================================= */

export const CreateUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // AssignableRole, not Role: an org admin creating users must not be able to
  // name SUPERADMIN and escalate out of their own tenant.
  role: AssignableRole.default('AGENT'),
  location: Location,
  skills: z.array(Skill).min(1),
  extension: z.string().regex(/^\d{3,6}$/).optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInput>;

export const UpdateUserInput = CreateUserInput.partial().omit({ password: true });
export type UpdateUserInput = z.infer<typeof UpdateUserInput>;

// Omits the org fields: this list is only ever read from inside one org, so
// repeating the tenant id on every agent row would be noise.
export const AgentSummary = SessionUser.omit({
  orgId: true,
  orgName: true,
  orgIndustry: true,
  orgThemePreset: true,
  orgThemeTokens: true,
  orgLogoUrl: true,
  orgTagline: true,
  orgWebsiteEnabled: true,
  orgSimulatorEnabled: true,
  orgDemoCallsEnabled: true,
  navAllowlist: true,
}).extend({
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
  /** Overall eval score, when the call has been scored. */
  evalScore: z.number().int().nullable(),
});
export type ConversationListItem = z.infer<typeof ConversationListItem>;

export const CallEvalDto = z.object({
  score: z.number().int(),
  accuracy: z.number().int(),
  policy: z.number().int(),
  escalation: z.number().int(),
  tone: z.number().int(),
  note: z.string().nullable(),
  reviewer: EvalReviewer,
  createdAt: z.coerce.date(),
});
export type CallEvalDto = z.infer<typeof CallEvalDto>;

export const ConversationDetail = ConversationListItem.extend({
  call: CallDto.nullable(),
  messages: z.array(MessageDto),
  recording: RecordingDto.nullable(),
  transcript: z.array(TranscriptSegmentDto),
  aiSession: AiSessionDto.nullable(),
  /** Quality score for this call, when it has been evaluated. */
  callEval: CallEvalDto.nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
});
export type ConversationDetail = z.infer<typeof ConversationDetail>;

export const ListConversationsQuery = Pagination.extend({
  channel: Channel.optional(),
  /** Inbound vs outbound. The inbox is unified across both; this narrows it. */
  direction: Direction.optional(),
  status: ConversationStatus.optional(),
  /** Outcome. `NONE` narrows to the rows with no outcome recorded. */
  disposition: DispositionFilter.optional(),
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

/** One value of a categorical field, with how many calls gave it. */
const InsightValue = z.object({ value: z.string(), label: z.string(), count: z.number().int() });

/**
 * What voice-agent workflows gathered on each call (`AiSession.gathered`),
 * aggregated. Generic over the workflow: fields are discovered from the data,
 * so a real-estate intake and a shipping enquiry both get sensible breakdowns.
 * `calls` is 0 when nothing in range carries gathered data.
 */
export const CallInsights = z.object({
  /** Calls in range that carry gathered data — the denominator for every rate. */
  calls: z.number().int(),
  avgDurationSeconds: z.number().int(),
  /** Did the caller leave a name / phone / email? Only kinds some workflow asks for. */
  capture: z.array(
    z.object({
      kind: z.enum(['name', 'phone', 'email']),
      label: z.string(),
      count: z.number().int(),
      pct: z.number(),
    }),
  ),
  /** How calls ended, from the workflow's disposition field. */
  outcomes: z.object({ field: z.string().nullable(), label: z.string(), values: z.array(InsightValue) }),
  /** Calls reaching each workflow node, in first-seen order. */
  journey: z.array(z.object({ node: z.string(), count: z.number().int(), pct: z.number() })),
  /** Per-field breakdowns, most-answered first. Free-text fields are left out. */
  fields: z.array(
    z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('category'),
        key: z.string(),
        label: z.string(),
        /** Calls that gave a usable value. */
        answered: z.number().int(),
        values: z.array(InsightValue),
        /** Answers outside the top values. */
        other: z.number().int(),
      }),
      z.object({
        kind: z.literal('boolean'),
        key: z.string(),
        label: z.string(),
        answered: z.number().int(),
        trueCount: z.number().int(),
        truePct: z.number(),
      }),
    ]),
  ),
});
export type CallInsights = z.infer<typeof CallInsights>;


/** The evals rollup on the analytics page. */
export const EvalSummary = z.object({
  scored: z.number().int(),
  /** AI-handled calls with no eval yet — the honest denominator. */
  unscored: z.number().int(),
  humanReviewed: z.number().int(),
  avgScore: z.number(),
  dimensions: z.array(z.object({ key: z.string(), label: z.string(), avg: z.number() })),
  bands: z.object({
    good: z.number().int(),
    watch: z.number().int(),
    poor: z.number().int(),
  }),
  /** Daily average, oldest first, for the trend line. */
  trend: z.array(z.object({ day: z.string(), avg: z.number(), calls: z.number().int() })),
  /** Worst-scoring calls, for the "listen to these" list. */
  worst: z.array(
    z.object({
      conversationId: Cuid,
      contactName: z.string().nullable(),
      score: z.number().int(),
      note: z.string().nullable(),
      startedAt: z.coerce.date(),
    }),
  ),
  cost: z.object({
    totalUsd: z.number(),
    perCallUsd: z.number(),
    inputTokens: z.number().int(),
    outputTokens: z.number().int(),
  }),
});
export type EvalSummary = z.infer<typeof EvalSummary>;

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

/* ----------------------------- manual dialling ---------------------------- */

/**
 * A telecaller placing a call themselves.
 *
 * Either an existing contact or a raw number — the second is allowed here and
 * deliberately not on campaigns: a person choosing to ring one customer is a
 * different act from loading a list into an automated dialer, and only the
 * latter needs a consent basis written down.
 */
export const ManualCallInput = z
  .object({
    contactId: Cuid.optional(),
    phoneE164: PhoneE164.optional(),
    /** Used when dialling a number this centre has never spoken to. */
    name: z.string().max(80).optional(),
    /** Why they are calling. Written onto the conversation before it starts. */
    note: z.string().max(500).optional(),
    /**
     * Put the agent's half of the call in the browser instead of on a handset.
     *
     * Sent by the client rather than read from a saved preference, because only
     * the browser knows whether its softphone actually finished registering.
     * A stored "prefers softphone" flag would go on being true in a tab that
     * had been closed, and the call would ring a device nobody was sitting at.
     */
    softphone: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.contactId ?? v.phoneE164), {
    message: 'Give a contact or a number to dial',
  });
export type ManualCallInput = z.infer<typeof ManualCallInput>;

export const ManualCallResult = z.object({
  callId: Cuid,
  conversationId: Cuid,
  contactId: Cuid,
  contactName: z.string().nullable(),
  phoneE164: z.string(),
});
export type ManualCallResult = z.infer<typeof ManualCallResult>;

/** One row of a telecaller's worklist. */
export const CallableContact = z.object({
  id: Cuid,
  name: z.string().nullable(),
  phoneE164: z.string().nullable(),
  interest: z.string().nullable(),
  totalConversations: z.number().int(),
  lastContactedAt: z.coerce.date().nullable(),
  /** Outcome of the last conversation, so a telecaller knows where they left off. */
  lastOutcome: z.string().nullable(),
  doNotCall: z.boolean(),
});
export type CallableContact = z.infer<typeof CallableContact>;

/* ------------------------------- outbound --------------------------------- */

export const CampaignSummary = z.object({
  id: Cuid,
  name: z.string(),
  status: CampaignStatus,
  opener: z.string(),
  consentBasis: z.string(),
  aiAgentId: Cuid,
  aiAgentName: z.string().nullable(),
  queueId: Cuid.nullable(),
  queueName: z.string().nullable(),
  fromNumber: z.string().nullable(),
  maxConcurrent: z.number().int(),
  windowStartHour: z.number().int(),
  windowEndHour: z.number().int(),
  daysOfWeek: z.array(z.number().int()),
  maxAttempts: z.number().int(),
  retryAfterMinutes: z.number().int(),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  /** Live counts, so the page can show progress without a second request. */
  counts: z.object({
    total: z.number().int(),
    pending: z.number().int(),
    calling: z.number().int(),
    answered: z.number().int(),
    noAnswer: z.number().int(),
    exhausted: z.number().int(),
    failed: z.number().int(),
    suppressed: z.number().int(),
  }),
  /** Why the dialer is not placing calls right now, if it isn't. */
  idleReason: z.string().nullable(),
});
export type CampaignSummary = z.infer<typeof CampaignSummary>;

export const CreateCampaignInput = z.object({
  name: z.string().min(2).max(80),
  opener: z.string().min(10, 'The opener is what the assistant says first'),
  /**
   * Required, and deliberately not defaulted. Cold-calling a list you happen to
   * have is what makes an outbound dialer a legal problem; writing down why you
   * may call these people is the cheapest possible guard against it.
   */
  consentBasis: z.string().min(10, 'State why this centre may call these people'),
  aiAgentId: Cuid,
  queueId: Cuid.optional(),
  fromNumberId: Cuid.optional(),
  maxConcurrent: z.coerce.number().int().min(1).max(20).default(2),
  windowStartHour: z.coerce.number().int().min(0).max(23).default(9),
  windowEndHour: z.coerce.number().int().min(1).max(24).default(18),
  daysOfWeek: z.array(z.coerce.number().int().min(1).max(7)).default([]),
  maxAttempts: z.coerce.number().int().min(1).max(5).default(2),
  retryAfterMinutes: z.coerce.number().int().min(5).max(10080).default(120),
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignInput>;

export const UpdateCampaignInput = CreateCampaignInput.partial().extend({
  status: CampaignStatus.optional(),
});
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignInput>;

/** Targets are chosen from contacts this centre already knows. */
export const AddCampaignTargetsInput = z.object({
  contactIds: z.array(Cuid).min(1).max(1000),
});
export type AddCampaignTargetsInput = z.infer<typeof AddCampaignTargetsInput>;

export const CampaignTargetRow = z.object({
  id: Cuid,
  contactId: Cuid,
  contactName: z.string().nullable(),
  phoneE164: z.string().nullable(),
  status: TargetStatus,
  attempts: z.number().int(),
  lastAttemptAt: z.coerce.date().nullable(),
  nextAttemptAt: z.coerce.date().nullable(),
  conversationId: Cuid.nullable(),
  lastError: z.string().nullable(),
});
export type CampaignTargetRow = z.infer<typeof CampaignTargetRow>;

/* ------------------------------ CRM config -------------------------------- */

/**
 * Per-centre CRM credentials.
 *
 * A discriminated union rather than a bag of optional fields: Bitrix needs one
 * webhook URL, Zoho needs an OAuth triple plus a region, and the two have no
 * overlap. Validating them together as `Partial<everything>` is how you end up
 * saving a Zoho client id with no refresh token and finding out at call time.
 */
export const BitrixCrmConfig = z.object({
  provider: z.literal('bitrix'),
  /** Bitrix24 → Developer resources → Inbound webhook. Contains its own secret. */
  webhookUrl: z
    .string()
    .url('Must be the full inbound webhook URL')
    .refine((u) => u.includes('/rest/'), 'A Bitrix inbound webhook URL contains /rest/'),
});
export type BitrixCrmConfig = z.infer<typeof BitrixCrmConfig>;

export const ZohoCrmConfig = z.object({
  provider: z.literal('zoho'),
  region: ZohoRegion.default('com'),
  clientId: z.string().min(10, 'Client ID looks too short'),
  clientSecret: z.string().min(10, 'Client secret looks too short'),
  /** Self-Client or Server-based app refresh token — it does not expire. */
  refreshToken: z.string().min(10, 'Refresh token looks too short'),
});
export type ZohoCrmConfig = z.infer<typeof ZohoCrmConfig>;

export const HubSpotCrmConfig = z.object({
  provider: z.literal('hubspot'),
  /** Private app token — Settings → Integrations → Private Apps in HubSpot. */
  accessToken: z
    .string()
    .min(20, 'A HubSpot private app token is longer than this')
    .refine((t) => t.startsWith('pat-'), 'Private app tokens start with "pat-"'),
});
export type HubSpotCrmConfig = z.infer<typeof HubSpotCrmConfig>;

export const WebhookCrmConfig = z.object({
  provider: z.literal('webhook'),
  targetUrl: z.string().url('Must be a full https:// URL'),
  /**
   * Optional but strongly advised: without it the receiver cannot tell our
   * posts from anyone else's.
   */
  signingSecret: z.string().min(16, 'Use at least 16 characters').optional(),
});
export type WebhookCrmConfig = z.infer<typeof WebhookCrmConfig>;

/** No external CRM: sync still runs against the in-memory mock. */
export const MockCrmConfig = z.object({ provider: z.literal('mock') });
export type MockCrmConfig = z.infer<typeof MockCrmConfig>;

export const CrmConfig = z.discriminatedUnion('provider', [
  MockCrmConfig,
  BitrixCrmConfig,
  ZohoCrmConfig,
  HubSpotCrmConfig,
  WebhookCrmConfig,
]);
export type CrmConfig = z.infer<typeof CrmConfig>;

/**
 * What a settings page may read back.
 *
 * Secrets are never returned — only whether each one is set. Anything else and
 * a centre's CRM credentials would be one GET away from every admin's browser
 * history and every proxy log in between.
 */
export const CrmConfigView = z.object({
  provider: CrmDriver,
  /** True when this centre has saved its own config rather than inheriting. */
  configured: z.boolean(),
  /** Safe to show: identifies the portal without granting access. */
  portalUrl: z.string().nullable(),
  region: ZohoRegion.nullable(),
  clientId: z.string().nullable(),
  /** Host only, for the webhook driver — enough to recognise, not to call. */
  targetHost: z.string().nullable(),
  /** Whether this driver can show a call while it is still ringing. */
  supportsLiveCall: z.boolean(),
  hasSecret: z.boolean(),
  hasRefreshToken: z.boolean(),
  hasWebhookUrl: z.boolean(),
  hasAccessToken: z.boolean(),
  hasSigningSecret: z.boolean(),
  updatedAt: z.coerce.date().nullable(),
});
export type CrmConfigView = z.infer<typeof CrmConfigView>;

export const CrmConnectionDto = z.object({
  driver: z.string(),
  connected: z.boolean(),
  portalUrl: z.string().nullable(),
  lastSyncAt: z.coerce.date().nullable(),
  pending: z.number().int(),
  failed: z.number().int(),
  succeeded24h: z.number().int(),
  /** Null when the centre has saved nothing and is inheriting the deployment default. */
  config: CrmConfigView.nullable(),
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

/* ============================ AI live operations ========================== */

/**
 * Live ops for a centre whose calls are answered by its voice workflow
 * (`Organization.dograhOrgId` set). `enabled: false` means "show the standard
 * board" — the centre has human queues instead.
 */
export const AiLiveCall = z.object({
  runId: z.number(),
  startedAt: z.coerce.date(),
  channel: z.enum(['phone', 'web']),
  caller: z.string().nullable(),
  workflow: z.string(),
  /** The workflow step it is on, when the voice platform has reported one. */
  step: z.string().nullable(),
});
export type AiLiveCall = z.infer<typeof AiLiveCall>;

export const AiRecentCall = z.object({
  conversationId: z.string(),
  startedAt: z.coerce.date(),
  durationMs: z.number(),
  callerName: z.string().nullable(),
  callerPhone: z.string().nullable(),
  outcome: z.string().nullable(),
  intent: z.string().nullable(),
  summary: z.string().nullable(),
});
export type AiRecentCall = z.infer<typeof AiRecentCall>;

export const AiLiveOps = z.object({
  enabled: z.boolean(),
  live: z.array(AiLiveCall),
  today: z.object({
    calls: z.number(),
    avgDurationSeconds: z.number(),
    /** Calls where the caller left a name, phone or email. */
    leadsCaptured: z.number(),
    topIntent: z.object({ value: z.string(), count: z.number() }).nullable(),
  }),
  recent: z.array(AiRecentCall),
});
export type AiLiveOps = z.infer<typeof AiLiveOps>;
