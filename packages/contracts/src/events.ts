import type {
  ActiveCallRow,
  AgentSummary,
  ConversationListItem,
  LiveOpsSnapshot,
  MessageDto,
  ScreenPopPayload,
} from './dto';
import type { AgentStatus, CallState, EscalationReason, HangupCause } from './enums';

/**
 * Typed socket.io contract. Both sides import these — a renamed event or a
 * changed payload becomes a compile error rather than a silent dead listener.
 */

/** Rooms. Keep the helpers rather than inlining template strings at call sites. */
export const Rooms = {
  /** Per-user: screen-pop, softphone commands, personal presence. */
  user: (userId: string) => `user:${userId}`,
  /** Supervisors + admins: live ops board, queue depth, agent grid. */
  supervisors: 'role:supervisor',
  /** Everyone authenticated: global counters. */
  all: 'all',
  /** Live transcript stream for one call. */
  call: (callId: string) => `call:${callId}`,
  /** One conversation thread (WhatsApp/web chat live messages). */
  conversation: (id: string) => `conversation:${id}`,
} as const;

export interface ServerToClientEvents {
  /* ── call lifecycle ───────────────────────────────────────────────────── */
  'call.ringing': (p: ActiveCallRow) => void;
  'call.ai_answered': (p: { callId: string; conversationId: string }) => void;
  'call.state_changed': (p: {
    callId: string;
    conversationId: string;
    from: CallState;
    to: CallState;
    at: string;
  }) => void;
  'call.escalating': (p: {
    callId: string;
    conversationId: string;
    queueId: string | null;
    queueName: string | null;
    reason: EscalationReason;
  }) => void;
  'call.queued': (p: { callId: string; queueId: string; position: number }) => void;
  'call.completed': (p: {
    callId: string;
    conversationId: string;
    hangupCause: HangupCause;
    aiContained: boolean;
    durationMs: number;
  }) => void;
  'call.updated': (p: ActiveCallRow) => void;

  /* ── the differentiator: context-rich handoff ─────────────────────────── */
  'agent.screen_pop': (p: ScreenPopPayload) => void;
  /** Offer withdrawn — someone else took it, or the caller hung up. */
  'agent.offer_revoked': (p: { callId: string; reason: string }) => void;
  'agent.call_assigned': (p: { callId: string; conversationId: string }) => void;
  'agent.wrapup_started': (p: { callId: string; secondsRemaining: number }) => void;
  'agent.wrapup_ended': (p: { callId: string }) => void;

  /* ── presence ─────────────────────────────────────────────────────────── */
  'presence.changed': (p: {
    userId: string;
    status: AgentStatus;
    since: string;
    currentCallId: string | null;
  }) => void;
  'presence.roster': (p: AgentSummary[]) => void;

  /* ── live transcript / messaging ──────────────────────────────────────── */
  'message.created': (p: { conversationId: string; message: MessageDto }) => void;
  'transcript.partial': (p: {
    callId: string;
    speaker: 'CALLER' | 'AI_AGENT' | 'HUMAN_AGENT';
    text: string;
  }) => void;
  'conversation.updated': (p: ConversationListItem) => void;
  'conversation.assigned': (p: { conversationId: string; userId: string; userName: string }) => void;

  /* ── dashboards ───────────────────────────────────────────────────────── */
  'liveops.snapshot': (p: LiveOpsSnapshot) => void;
  'queue.updated': (p: {
    queueId: string;
    waiting: number;
    longestWaitMs: number;
    agentsAvailable: number;
  }) => void;

  /* ── integrations ─────────────────────────────────────────────────────── */
  'crm.sync': (p: {
    conversationId: string | null;
    status: 'SUCCESS' | 'FAILED';
    method: string;
    bitrixId: string | null;
    error?: string;
  }) => void;

  /* ── transport ────────────────────────────────────────────────────────── */
  'system.notice': (p: { level: 'info' | 'warn' | 'error'; message: string }) => void;
}

export interface ClientToServerEvents {
  /** Subscribe to a call's live transcript (supervisor listen-in, agent view). */
  'call.subscribe': (p: { callId: string }) => void;
  'call.unsubscribe': (p: { callId: string }) => void;
  'conversation.subscribe': (p: { conversationId: string }) => void;
  'conversation.unsubscribe': (p: { conversationId: string }) => void;
  /** Agent is typing in a chat thread. */
  'conversation.typing': (p: { conversationId: string; typing: boolean }) => void;
  /** Keepalive so we can detect a hung browser and mark the agent offline. */
  'agent.heartbeat': () => void;
}

export interface SocketAuthPayload {
  token: string;
}

/** Data attached to each authenticated socket. */
export interface SocketData {
  userId: string;
  role: string;
  name: string;
}
