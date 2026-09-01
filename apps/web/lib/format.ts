import type { AgentStatus, CallState, Channel, EscalationReason } from '@superdemo/contracts';

/** m:ss for durations under an hour, h:mm:ss above. */
export function duration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export function seconds(sec: number | null | undefined): string {
  if (sec === null || sec === undefined) return '—';
  return duration(sec * 1000);
}

export function pct(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

export function money(usd: number | null | undefined): string {
  if (usd === null || usd === undefined) return '—';
  return usd.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/**
 * All times render in the institute's timezone rather than the viewer's.
 *
 * With agents in Dubai, India and Egypt, a shared reference frame is the only
 * way a supervisor and a remote agent can talk about "the 3pm call" and mean the
 * same thing.
 */
export const INSTITUTE_TZ = 'Asia/Dubai';

export function time(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: INSTITUTE_TZ,
  });
}

export function dateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: INSTITUTE_TZ,
  });
}

export function relative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** E.164 → readable, keeping the country code visible. */
export function phone(e164: string | null | undefined): string {
  if (!e164) return 'Unknown';
  if (e164.startsWith('+971') && e164.length >= 12) {
    return `+971 ${e164.slice(4, 6)} ${e164.slice(6, 9)} ${e164.slice(9)}`;
  }
  return e164;
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/* ------------------------------ state styling ------------------------------ */

export const CALL_STATE_STYLE: Record<CallState, { label: string; className: string }> = {
  RINGING: { label: 'Ringing', className: 'bg-warn-soft text-warn' },
  AI_HANDLING: { label: 'AI handling', className: 'bg-ai-soft text-ai' },
  ESCALATING: { label: 'Escalating', className: 'bg-warn-soft text-warn' },
  QUEUED: { label: 'In queue', className: 'bg-warn-soft text-warn' },
  AGENT_RINGING: { label: 'Ringing agent', className: 'bg-warn-soft text-warn' },
  AGENT_TALKING: { label: 'With agent', className: 'bg-live-soft text-live' },
  WRAPUP: { label: 'Wrap-up', className: 'bg-muted text-muted-foreground' },
  COMPLETED: { label: 'Completed', className: 'bg-muted text-muted-foreground' },
};

export const AGENT_STATUS_STYLE: Record<AgentStatus, { label: string; dot: string; text: string }> = {
  AVAILABLE: { label: 'Available', dot: 'bg-live', text: 'text-live' },
  ON_CALL: { label: 'On a call', dot: 'bg-primary', text: 'text-primary' },
  WRAPUP: { label: 'Wrap-up', dot: 'bg-ai', text: 'text-ai' },
  BUSY: { label: 'Busy', dot: 'bg-warn', text: 'text-warn' },
  BREAK: { label: 'On break', dot: 'bg-warn', text: 'text-warn' },
  OFFLINE: { label: 'Offline', dot: 'bg-muted-foreground/50', text: 'text-muted-foreground/70' },
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  VOICE: 'Voice',
  WHATSAPP: 'WhatsApp',
  WEBCHAT: 'Web chat',
};

export const ESCALATION_LABEL: Record<EscalationReason, string> = {
  CALLER_REQUESTED: 'Asked for a human',
  LOW_CONFIDENCE: 'AI unsure',
  OUT_OF_SCOPE: 'Outside knowledge base',
  NEGATIVE_SENTIMENT: 'Caller frustrated',
  MAX_TURNS: 'Conversation too long',
  HUMAN_ONLY_INTENT: 'Human-only topic',
};

/** Today and N days ago, as YYYY-MM-DD, for analytics range pickers. */
export function dateRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
