import { z } from 'zod';

/**
 * Domain enums. These are the single source of truth — Prisma mirrors them,
 * the API validates against them, and the web app renders from them.
 * Keep the string values stable: they are persisted.
 */

export const Role = z.enum(['AGENT', 'SUPERVISOR', 'ADMIN']);
export type Role = z.infer<typeof Role>;

export const Location = z.enum(['DUBAI', 'INDIA', 'EGYPT']);
export type Location = z.infer<typeof Location>;

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
  RINGING: ['AI_HANDLING', 'QUEUED', 'COMPLETED'],
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

export const RoutingStrategy = z.enum(['LONGEST_IDLE', 'ROUND_ROBIN', 'SKILL_WEIGHTED']);
export type RoutingStrategy = z.infer<typeof RoutingStrategy>;

export const SyncDirection = z.enum(['OUTBOUND_TO_BITRIX', 'INBOUND_FROM_BITRIX']);
export type SyncDirection = z.infer<typeof SyncDirection>;

export const SyncStatus = z.enum(['PENDING', 'SUCCESS', 'FAILED', 'SKIPPED']);
export type SyncStatus = z.infer<typeof SyncStatus>;

export const NumberStatus = z.enum(['AVAILABLE', 'ASSIGNED', 'RELEASED']);
export type NumberStatus = z.infer<typeof NumberStatus>;

/** Driver names, so config and audit rows share one vocabulary. */
export const TelephonyDriver = z.enum(['simulated', 'browser', 'livekit']);
export type TelephonyDriver = z.infer<typeof TelephonyDriver>;

export const MessagingDriver = z.enum(['mock', 'meta']);
export type MessagingDriver = z.infer<typeof MessagingDriver>;

export const LlmDriver = z.enum(['scripted', 'claude', 'ollama']);
export type LlmDriver = z.infer<typeof LlmDriver>;

export const CrmDriver = z.enum(['mock', 'bitrix']);
export type CrmDriver = z.infer<typeof CrmDriver>;

/* ------------------------------ display maps ------------------------------ */

export const SKILL_LABELS: Record<Skill, string> = {
  MANAGEMENT: 'Management',
  EDUCATION: 'Education',
  FINANCE: 'Finance',
  LANGUAGE: 'Languages',
  GENERAL: 'General',
};

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  CALLER_REQUESTED: 'Caller asked for a human',
  LOW_CONFIDENCE: 'AI confidence too low',
  OUT_OF_SCOPE: 'Outside knowledge base',
  NEGATIVE_SENTIMENT: 'Caller frustrated',
  MAX_TURNS: 'Conversation too long',
  HUMAN_ONLY_INTENT: 'Requires a human decision',
};

export const DISPOSITION_LABELS: Record<Disposition, string> = {
  ENROLMENT_INTEREST: 'Enrolment interest',
  INFO_PROVIDED: 'Information provided',
  CALLBACK_REQUESTED: 'Callback requested',
  FEE_ENQUIRY: 'Fee enquiry',
  EXISTING_STUDENT_SUPPORT: 'Existing student support',
  NOT_INTERESTED: 'Not interested',
  WRONG_NUMBER: 'Wrong number',
  SPAM: 'Spam',
};

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
