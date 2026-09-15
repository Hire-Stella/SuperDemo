import { z } from 'zod';

/**
 * Domain enums. These are the single source of truth — Prisma mirrors them,
 * the API validates against them, and the web app renders from them.
 * Keep the string values stable: they are persisted.
 */

export const Role = z.enum(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPERADMIN']);
export type Role = z.infer<typeof Role>;

/**
 * Roles an org's own admin may hand out. SUPERADMIN is absent by construction:
 * a tenant admin must not be able to mint a platform operator, and this is the
 * list the API validates against rather than a check someone has to remember.
 */
export const AssignableRole = z.enum(['AGENT', 'SUPERVISOR', 'ADMIN']);
export type AssignableRole = z.infer<typeof AssignableRole>;

export const ROLE_LABELS: Record<Role, string> = {
  AGENT: 'Agent',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Admin',
  SUPERADMIN: 'Platform operator',
};

export const Location = z.enum(['DUBAI', 'INDIA', 'EGYPT']);
export type Location = z.infer<typeof Location>;

/** Verticals the platform onboards. See industries.ts for what each provisions. */
export const Industry = z.enum([
  'EDUCATION',
  'CLINIC',
  'RESTAURANT',
  'RETAIL',
  'FITNESS',
  'PROFESSIONAL',
  'GENERIC',
]);
export type Industry = z.infer<typeof Industry>;

export const INDUSTRY_LABELS: Record<Industry, string> = {
  EDUCATION: 'Education / training',
  CLINIC: 'Clinic / healthcare',
  RESTAURANT: 'Restaurant / hospitality',
  RETAIL: 'Retail / e-commerce',
  FITNESS: 'Gym / fitness',
  PROFESSIONAL: 'Professional services',
  GENERIC: 'Other',
};

/** Course categories FIT actually teaches — these double as routing skills. */
export const Skill = z.enum(['MANAGEMENT', 'EDUCATION', 'FINANCE', 'LANGUAGE', 'GENERAL']);
export type Skill = z.infer<typeof Skill>;

export const AgentStatus = z.enum([
  'AVAILABLE',
  'ON_CALL',
  'WRAPUP',
  'BUSY',
  'BREAK',
  'OFFLINE',
]);
export type AgentStatus = z.infer<typeof AgentStatus>;

/** Statuses in which an agent may be offered a call. */
export const ROUTABLE_STATUSES: readonly AgentStatus[] = ['AVAILABLE'];

export const Channel = z.enum(['VOICE', 'WHATSAPP', 'WEBCHAT']);
export type Channel = z.infer<typeof Channel>;

export const Direction = z.enum(['INBOUND', 'OUTBOUND']);
export type Direction = z.infer<typeof Direction>;

export const ConversationStatus = z.enum(['ACTIVE', 'WAITING', 'CLOSED']);
export type ConversationStatus = z.infer<typeof ConversationStatus>;

/**
 * Call state machine. Transitions are enforced in CallsService — see
 * CALL_TRANSITIONS below. Terminal state is always COMPLETED.
 */
export const CallState = z.enum([
  'RINGING',
  'AI_HANDLING',
  'ESCALATING',
  'QUEUED',
  'AGENT_RINGING',
  'AGENT_TALKING',
  'WRAPUP',
  'COMPLETED',
]);
export type CallState = z.infer<typeof CallState>;

/**
 * Legal transitions. Anything absent here throws — no boolean soup, no
 * silently impossible states in the analytics tables.
 */
export const CALL_TRANSITIONS: Record<CallState, readonly CallState[]> = {
  // AGENT_TALKING direct from RINGING is the manual-dial case: a telecaller
  // placed the call themselves, so there is no AI leg to hand over from and no
  // queue to wait in — they are already on the line when it connects.
  RINGING: ['AI_HANDLING', 'AGENT_TALKING', 'QUEUED', 'COMPLETED'],
  AI_HANDLING: ['ESCALATING', 'COMPLETED'],
  ESCALATING: ['QUEUED', 'COMPLETED'],
  QUEUED: ['AGENT_RINGING', 'COMPLETED'],
  AGENT_RINGING: ['AGENT_TALKING', 'QUEUED', 'COMPLETED'],
  // AGENT_TALKING → QUEUED is a warm transfer: the agent hands the caller back
  // to a queue without dropping the call, so the transcript, recording and CRM
  // linkage all stay on one record.
  AGENT_TALKING: ['WRAPUP', 'QUEUED', 'COMPLETED'],
  WRAPUP: ['COMPLETED'],
  COMPLETED: [],
};

export function canTransition(from: CallState, to: CallState): boolean {
  return CALL_TRANSITIONS[from].includes(to);
}

/** States where the caller is still connected. */
export const LIVE_CALL_STATES: readonly CallState[] = [
  'RINGING',
  'AI_HANDLING',
  'ESCALATING',
  'QUEUED',
  'AGENT_RINGING',
  'AGENT_TALKING',
];

export const ParticipantKind = z.enum(['CALLER', 'AI_AGENT', 'HUMAN_AGENT']);
export type ParticipantKind = z.infer<typeof ParticipantKind>;

export const MessageRole = z.enum(['CALLER', 'AI', 'HUMAN_AGENT', 'SYSTEM']);
export type MessageRole = z.infer<typeof MessageRole>;

/** Why the AI handed off. Drives the escalation-reason breakdown in analytics. */
export const EscalationReason = z.enum([
  'CALLER_REQUESTED',
  'LOW_CONFIDENCE',
  'OUT_OF_SCOPE',
  'NEGATIVE_SENTIMENT',
  'MAX_TURNS',
  'HUMAN_ONLY_INTENT',
]);
export type EscalationReason = z.infer<typeof EscalationReason>;

export const HangupCause = z.enum([
  'CALLER_HANGUP',
  'AGENT_HANGUP',
  'AI_RESOLVED',
  'ABANDONED_IN_QUEUE',
  'NO_AGENT_AVAILABLE',
  'SYSTEM_ERROR',
]);
export type HangupCause = z.infer<typeof HangupCause>;

/** How the call ended, from a business standpoint. Set during wrap-up. */
export const Disposition = z.enum([
  'LEAD_QUALIFIED',
  'ENROLMENT_INTEREST',
  'INFO_PROVIDED',
  'CALLBACK_REQUESTED',
  'FEE_ENQUIRY',
  'EXISTING_STUDENT_SUPPORT',
  'NOT_INTERESTED',
  'WRONG_NUMBER',
  'SPAM',
]);
export type Disposition = z.infer<typeof Disposition>;

/**
 * What the inbox's outcome filter accepts: any disposition, plus `NONE` for the
 * rows that have no outcome recorded. Those are a real category — a call nobody
 * answered has nothing to record, and an unfilled wrap-up is a supervisor's
 * problem — so they need to be reachable, not only excluded.
 */
export const DispositionFilter = z.union([Disposition, z.literal('NONE')]);
export type DispositionFilter = z.infer<typeof DispositionFilter>;

export const EvalReviewer = z.enum(['AUTO', 'HUMAN']);
export type EvalReviewer = z.infer<typeof EvalReviewer>;

/** The four things a call is scored on. Order is the order they are shown in. */
export const EVAL_DIMENSIONS = [
  { key: 'accuracy', label: 'Accuracy', hint: 'Was what it said correct' },
  { key: 'policy', label: 'Policy', hint: 'Stayed inside what it may say' },
  { key: 'escalation', label: 'Escalation', hint: 'Handed over at the right moment' },
  { key: 'tone', label: 'Tone', hint: 'Sounded like this centre' },
] as const;
export type EvalDimension = (typeof EVAL_DIMENSIONS)[number]['key'];

/**
 * Bands, so a number becomes a judgement.
 *
 * 85 is the pass mark and 70 the floor: below that a supervisor should be
 * listening to the call, not reading a score.
 */
export function evalBand(score: number): 'good' | 'watch' | 'poor' {
  if (score >= 85) return 'good';
  if (score >= 70) return 'watch';
  return 'poor';
}

export const RoutingStrategy = z.enum(['LONGEST_IDLE', 'ROUND_ROBIN', 'SKILL_WEIGHTED']);
export type RoutingStrategy = z.infer<typeof RoutingStrategy>;

export const SyncDirection = z.enum(['OUTBOUND_TO_BITRIX', 'INBOUND_FROM_BITRIX']);
export type SyncDirection = z.infer<typeof SyncDirection>;

export const SyncStatus = z.enum(['PENDING', 'SUCCESS', 'FAILED', 'SKIPPED']);
export type SyncStatus = z.infer<typeof SyncStatus>;

export const CampaignStatus = z.enum(['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED']);
export type CampaignStatus = z.infer<typeof CampaignStatus>;

export const TargetStatus = z.enum([
  'PENDING',
  'CALLING',
  'ANSWERED',
  'NO_ANSWER',
  'EXHAUSTED',
  'FAILED',
  'SUPPRESSED',
]);
export type TargetStatus = z.infer<typeof TargetStatus>;

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Draft',
  RUNNING: 'Running',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const TARGET_STATUS_LABELS: Record<TargetStatus, string> = {
  PENDING: 'Waiting',
  CALLING: 'Calling',
  ANSWERED: 'Answered',
  NO_ANSWER: 'No answer',
  EXHAUSTED: 'Gave up',
  FAILED: 'Failed',
  SUPPRESSED: 'Suppressed',
};

export const NumberStatus = z.enum(['AVAILABLE', 'ASSIGNED', 'RELEASED']);
export type NumberStatus = z.infer<typeof NumberStatus>;

/** Driver names, so config and audit rows share one vocabulary. */
export const TelephonyDriver = z.enum(['simulated', 'browser', 'twilio', 'elevenlabs', 'livekit']);
export type TelephonyDriver = z.infer<typeof TelephonyDriver>;

export const MessagingDriver = z.enum(['mock', 'meta']);
export type MessagingDriver = z.infer<typeof MessagingDriver>;

export const LlmDriver = z.enum(['scripted', 'claude', 'ollama']);
export type LlmDriver = z.infer<typeof LlmDriver>;

export const CrmDriver = z.enum(['mock', 'bitrix', 'zoho', 'hubspot', 'webhook']);
export type CrmDriver = z.infer<typeof CrmDriver>;

export const CRM_DRIVER_LABELS: Record<CrmDriver, string> = {
  mock: 'None (simulated)',
  bitrix: 'Bitrix24',
  zoho: 'Zoho CRM',
  hubspot: 'HubSpot',
  webhook: 'Custom webhook',
};

/** Shown under the picker so an admin knows what they are choosing. */
export const CRM_DRIVER_NOTES: Record<CrmDriver, string> = {
  mock: 'No external CRM. Sync runs end to end against an in-process mock.',
  bitrix: 'One inbound webhook URL. Shows calls live on the agent’s timeline.',
  zoho: 'OAuth client plus refresh token. Calls appear when they end, not while ringing.',
  hubspot: 'A private app token. Calls, notes and recordings on the contact record.',
  webhook:
    'Signed JSON posted to your own endpoint — reaches Salesforce, Pipedrive, Dynamics or a booking system via Zapier, Make or your own code. Cannot look a caller up, so contacts get an id we generate.',
};

/**
 * Zoho hosts each region on its own domain and a token minted in one is
 * rejected by the others, so the region is part of the credentials rather than
 * something to guess.
 */
export const ZohoRegion = z.enum(['com', 'eu', 'in', 'au', 'jp', 'ca', 'sa']);
export type ZohoRegion = z.infer<typeof ZohoRegion>;

export const ZOHO_REGION_LABELS: Record<ZohoRegion, string> = {
  com: 'zoho.com (US / global)',
  eu: 'zoho.eu (Europe)',
  in: 'zoho.in (India)',
  au: 'zoho.com.au (Australia)',
  jp: 'zoho.jp (Japan)',
  ca: 'zohocloud.ca (Canada)',
  sa: 'zoho.sa (Saudi Arabia)',
};

/** API and OAuth hosts per region. */
export const ZOHO_HOSTS: Record<ZohoRegion, { api: string; accounts: string }> = {
  com: { api: 'https://www.zohoapis.com', accounts: 'https://accounts.zoho.com' },
  eu: { api: 'https://www.zohoapis.eu', accounts: 'https://accounts.zoho.eu' },
  in: { api: 'https://www.zohoapis.in', accounts: 'https://accounts.zoho.in' },
  au: { api: 'https://www.zohoapis.com.au', accounts: 'https://accounts.zoho.com.au' },
  jp: { api: 'https://www.zohoapis.jp', accounts: 'https://accounts.zoho.jp' },
  ca: { api: 'https://www.zohoapis.ca', accounts: 'https://accounts.zohocloud.ca' },
  sa: { api: 'https://www.zohoapis.sa', accounts: 'https://accounts.zoho.sa' },
};

/* ------------------------------ display maps ------------------------------ */

export const SKILL_LABELS: Record<Skill, string> = {
  MANAGEMENT: 'Management',
  EDUCATION: 'Education',
  FINANCE: 'Finance',
  LANGUAGE: 'Languages',
  GENERAL: 'General',
};

/**
 * Routing categories, named per vertical.
 *
 * `Skill` is five stable routing slots in the database. What a slot is *called*
 * is a per-tenant presentation concern: FINANCE is "Fees & payments" to a
 * training institute, "Billing & insurance" to a clinic, "Payments" to a
 * restaurant. Renaming the enum itself would mean relabelling every existing
 * tenant's rows to suit whichever vertical was onboarded most recently — so the
 * slots stay put and the labels move.
 *
 * Known ceiling: five categories per centre. A tenant needing a sixth needs
 * these to become per-org rows, which is a routing and analytics change rather
 * than a label change. Recorded in NOT-IMPLEMENTED.md.
 */
export const CATEGORY_LABELS: Record<Industry, Record<Skill, string>> = {
  EDUCATION: {
    EDUCATION: 'Courses & admissions',
    FINANCE: 'Fees & payments',
    MANAGEMENT: 'Corporate training',
    LANGUAGE: 'Language programmes',
    GENERAL: 'General enquiries',
  },
  CLINIC: {
    EDUCATION: 'Appointments',
    FINANCE: 'Billing & insurance',
    MANAGEMENT: 'Referrals & reports',
    LANGUAGE: 'Interpreter requests',
    GENERAL: 'General enquiries',
  },
  RESTAURANT: {
    EDUCATION: 'Reservations',
    FINANCE: 'Payments & invoices',
    MANAGEMENT: 'Events & catering',
    LANGUAGE: 'Delivery & takeaway',
    GENERAL: 'General enquiries',
  },
  RETAIL: {
    EDUCATION: 'Orders & tracking',
    FINANCE: 'Refunds & payments',
    MANAGEMENT: 'Wholesale & trade',
    LANGUAGE: 'Returns & exchanges',
    GENERAL: 'General enquiries',
  },
  FITNESS: {
    EDUCATION: 'Memberships & classes',
    FINANCE: 'Billing & renewals',
    MANAGEMENT: 'Personal training',
    LANGUAGE: 'Facilities & access',
    GENERAL: 'General enquiries',
  },
  PROFESSIONAL: {
    EDUCATION: 'New enquiries',
    FINANCE: 'Invoices & accounts',
    MANAGEMENT: 'Case & matter updates',
    LANGUAGE: 'Document requests',
    GENERAL: 'General enquiries',
  },
  GENERIC: {
    EDUCATION: 'Sales & enquiries',
    FINANCE: 'Billing',
    MANAGEMENT: 'Accounts',
    LANGUAGE: 'Support',
    GENERAL: 'General enquiries',
  },
};

/** What a routing category is called inside a given centre. */
export function categoryLabel(industry: Industry | null | undefined, skill: Skill): string {
  return CATEGORY_LABELS[industry ?? 'GENERIC'][skill];
}

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  CALLER_REQUESTED: 'Caller asked for a human',
  LOW_CONFIDENCE: 'AI confidence too low',
  OUT_OF_SCOPE: 'Outside knowledge base',
  NEGATIVE_SENTIMENT: 'Caller frustrated',
  MAX_TURNS: 'Conversation too long',
  HUMAN_ONLY_INTENT: 'Requires a human decision',
};

export const DISPOSITION_LABELS: Record<Disposition, string> = {
  LEAD_QUALIFIED: 'Lead qualified',
  ENROLMENT_INTEREST: 'Enrolment interest',
  INFO_PROVIDED: 'Information provided',
  CALLBACK_REQUESTED: 'Callback requested',
  FEE_ENQUIRY: 'Fee enquiry',
  EXISTING_STUDENT_SUPPORT: 'Existing student support',
  NOT_INTERESTED: 'Not interested',
  WRONG_NUMBER: 'Wrong number',
  SPAM: 'Spam',
};

/**
 * Call outcomes, named per vertical.
 *
 * `Disposition` is a fixed set of slots in the database, and its values were
 * written for a training institute — so a grocery's inbox showed "Existing
 * student support" against a damaged-delivery call. Same treatment as the
 * routing categories: the slots stay, the words move.
 */
export const DISPOSITION_LABELS_BY_INDUSTRY: Partial<
  Record<Industry, Partial<Record<Disposition, string>>>
> = {
  RETAIL: {
    ENROLMENT_INTEREST: 'Sales interest',
    FEE_ENQUIRY: 'Price enquiry',
    EXISTING_STUDENT_SUPPORT: 'Existing customer',
  },
  CLINIC: {
    ENROLMENT_INTEREST: 'New patient',
    FEE_ENQUIRY: 'Cost enquiry',
    EXISTING_STUDENT_SUPPORT: 'Existing patient',
  },
  RESTAURANT: {
    ENROLMENT_INTEREST: 'Booking interest',
    FEE_ENQUIRY: 'Price enquiry',
    EXISTING_STUDENT_SUPPORT: 'Existing booking',
  },
  FITNESS: {
    ENROLMENT_INTEREST: 'Membership interest',
    FEE_ENQUIRY: 'Price enquiry',
    EXISTING_STUDENT_SUPPORT: 'Existing member',
  },
  PROFESSIONAL: {
    ENROLMENT_INTEREST: 'New enquiry',
    FEE_ENQUIRY: 'Fee enquiry',
    EXISTING_STUDENT_SUPPORT: 'Existing client',
  },
  GENERIC: {
    ENROLMENT_INTEREST: 'Sales interest',
    FEE_ENQUIRY: 'Price enquiry',
    EXISTING_STUDENT_SUPPORT: 'Existing customer',
  },
};

/**
 * What the "what are people ringing about" breakdown is called.
 *
 * The underlying column is `Contact.courseInterest`, named when the only tenant
 * was a training institute. Renaming it is a migration; renaming what the chart
 * says is a string, and a car rental desk reading "Most-asked-about courses"
 * over a list of SUVs is the kind of detail that loses a demo.
 */
export const INTEREST_LABELS: Record<Industry, { title: string; empty: string }> = {
  EDUCATION: { title: 'Most-asked-about courses', empty: 'No course interest recorded in this range.' },
  CLINIC: { title: 'Most-asked-about treatments', empty: 'No treatment interest recorded in this range.' },
  RESTAURANT: { title: 'Most-asked-about dishes', empty: 'No menu interest recorded in this range.' },
  RETAIL: { title: 'Most-asked-about products', empty: 'No product interest recorded in this range.' },
  FITNESS: { title: 'Most-asked-about classes', empty: 'No class interest recorded in this range.' },
  PROFESSIONAL: { title: 'Most-asked-about services', empty: 'No service interest recorded in this range.' },
  GENERIC: { title: 'What people ask about', empty: 'Nothing recorded in this range.' },
};

/** What the interest breakdown is called inside a given centre. */
export function interestLabel(industry: Industry | null | undefined): { title: string; empty: string } {
  return INTEREST_LABELS[industry ?? 'GENERIC'];
}

/** What an outcome is called inside a given centre. */
export function dispositionLabel(
  industry: Industry | null | undefined,
  disposition: Disposition,
): string {
  return (
    DISPOSITION_LABELS_BY_INDUSTRY[industry ?? 'GENERIC']?.[disposition] ??
    DISPOSITION_LABELS[disposition]
  );
}

export const CALL_STATE_LABELS: Record<CallState, string> = {
  RINGING: 'Ringing',
  AI_HANDLING: 'AI handling',
  ESCALATING: 'Escalating',
  QUEUED: 'In queue',
  AGENT_RINGING: 'Ringing agent',
  AGENT_TALKING: 'With agent',
  WRAPUP: 'Wrap-up',
  COMPLETED: 'Completed',
};

export const LOCATION_TIMEZONES: Record<Location, string> = {
  DUBAI: 'Asia/Dubai',
  INDIA: 'Asia/Kolkata',
  EGYPT: 'Africa/Cairo',
};
