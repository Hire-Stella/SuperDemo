import { Injectable, NotFoundException } from '@nestjs/common';
import type { AnalyticsRangeQuery, ListConversationsQuery } from '@fit-ai/contracts';
import { DISPOSITION_LABELS, ESCALATION_REASON_LABELS } from '@fit-ai/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ConversationsService } from '../conversations/conversations.service';

/**
 * Exports: transcripts, per-call reports, and CSV.
 *
 * CSV is generated here rather than pulled in as a dependency — it is a dozen
 * lines, and the escaping has to be right for reasons a library wouldn't know
 * about anyway (see `csvCell`).
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
    private readonly conversations: ConversationsService,
  ) {}

  /* ------------------------------ transcripts ----------------------------- */

  /** Plain-text transcript, timestamped — the format people actually forward. */
  async transcriptText(conversationId: string): Promise<{ filename: string; body: string }> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        handledBy: { select: { name: true } },
        queue: { select: { name: true } },
        aiSession: true,
        call: { include: { segments: { orderBy: { startMs: 'asc' } } } },
        messages: { orderBy: { createdAt: 'asc' }, include: { author: { select: { name: true } } } },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const tz = 'Asia/Dubai';
    const fmt = (d: Date) =>
      d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: tz });

    const lines: string[] = [
      'FIT INSTITUTE — CALL TRANSCRIPT',
      '='.repeat(60),
      `Contact      : ${conv.contact?.name ?? 'Unknown'} (${conv.contact?.phoneE164 ?? 'no number'})`,
      `Channel      : ${conv.channel}`,
      `Started      : ${fmt(conv.startedAt)} (${tz})`,
      conv.endedAt ? `Ended        : ${fmt(conv.endedAt)}` : '',
      `Handled by   : ${conv.aiContained ? 'AI assistant (no human involved)' : (conv.handledBy?.name ?? 'agent')}`,
      conv.queue ? `Queue        : ${conv.queue.name}` : '',
      conv.disposition ? `Outcome      : ${DISPOSITION_LABELS[conv.disposition]}` : '',
      conv.aiSession?.escalationReason
        ? `Handoff      : ${ESCALATION_REASON_LABELS[conv.aiSession.escalationReason]}`
        : '',
      conv.aiSession?.courseOfInterest ? `Course       : ${conv.aiSession.courseOfInterest}` : '',
      '',
      'SUMMARY',
      '-'.repeat(60),
      conv.aiSession?.summary ?? '(no summary available)',
      '',
      conv.notes ? `AGENT NOTES\n${'-'.repeat(60)}\n${conv.notes}\n` : '',
      'TRANSCRIPT',
      '-'.repeat(60),
    ].filter((l) => l !== '');

    // Voice calls have timestamped segments; chat threads only have messages.
    const segments = conv.call?.segments ?? [];
    if (segments.length > 0) {
      for (const s of segments) {
        const who =
          s.speaker === 'CALLER' ? 'Caller' : s.speaker === 'AI_AGENT' ? 'AI  ' : 'Agent';
        lines.push(`[${mmss(s.startMs)}] ${who}: ${s.text}`);
      }
    } else {
      for (const m of conv.messages) {
        const who =
          m.role === 'CALLER'
            ? (conv.contact?.name ?? 'Customer')
            : m.role === 'AI'
              ? 'AI assistant'
              : (m.author?.name ?? 'Agent');
        lines.push(`[${fmt(m.createdAt)}] ${who}: ${m.text}`);
      }
    }

    lines.push('', '-'.repeat(60), `Generated ${fmt(new Date())} · FIT-AI contact centre`);

    const who = (conv.contact?.name ?? 'unknown').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return {
      filename: `transcript-${who}-${conv.startedAt.toISOString().slice(0, 10)}.txt`,
      body: lines.join('\n'),
    };
  }

  /* ---------------------------- CSV: conversations ------------------------ */

  /**
   * The conversation log as CSV, honouring the inbox's filters so what you
   * export is what you were looking at.
   */
  async conversationsCsv(query: ListConversationsQuery): Promise<{ filename: string; body: string }> {
    // Export means the whole filtered set, not one page.
    const rows: Awaited<ReturnType<ConversationsService['list']>>['items'] = [];
    let cursor: string | null = null;
    do {
      const page = await this.conversations.list({
        ...query,
        limit: 100,
        cursor: cursor ?? undefined,
      });
      rows.push(...page.items);
      cursor = page.nextCursor;
      // Hard ceiling: a runaway export shouldn't be able to exhaust memory.
    } while (cursor && rows.length < 5000);

    const header = [
      'Started (Asia/Dubai)',
      'Channel',
      'Direction',
      'Contact',
      'Phone',
      'Course interest',
      'Handled by',
      'AI contained',
      'Handoff reason',
      'Queue',
      'Outcome',
      'Duration (s)',
      'Messages',
      'Recording',
      'In CRM',
    ];

    const body = rows.map((c) => [
      c.startedAt.toLocaleString('en-GB', { timeZone: 'Asia/Dubai' }),
      c.channel,
      c.direction,
      c.contact?.name ?? '',
      c.contact?.phoneE164 ?? '',
      c.contact?.courseInterest ?? '',
      c.handledByName ?? 'AI assistant',
      c.aiContained ? 'yes' : 'no',
      c.escalationReason ? ESCALATION_REASON_LABELS[c.escalationReason] : '',
      c.queueName ?? '',
      c.disposition ? DISPOSITION_LABELS[c.disposition] : '',
      c.durationMs ? Math.round(c.durationMs / 1000) : '',
      c.messageCount,
      c.hasRecording ? 'yes' : 'no',
      c.crmSynced ? 'yes' : 'no',
    ]);

    return {
      filename: `fit-conversations-${new Date().toISOString().slice(0, 10)}.csv`,
      body: toCsv(header, body),
    };
  }

  /* ----------------------------- CSV: analytics --------------------------- */

  /**
   * The management report. One file, several sections — a supervisor asked for
   * "the numbers", not four downloads to reconcile by hand.
   */
  async analyticsCsv(query: AnalyticsRangeQuery): Promise<{ filename: string; body: string }> {
    const d = await this.analytics.overview(query);
    const t = d.totals;
    const from = new Date(query.from).toISOString().slice(0, 10);
    const to = new Date(query.to).toISOString().slice(0, 10);

    const parts: string[] = [];

    parts.push(`FIT Institute — contact centre report,${from} to ${to}`, '');

    parts.push('HEADLINE');
    parts.push(
      toCsv(
        ['Metric', 'Value'],
        [
          ['Total calls', t.calls],
          ['Resolved by AI alone', t.aiContained],
          ['AI containment %', t.containmentPct.toFixed(1)],
          ['Escalated to a human', t.escalated],
          ['Abandoned while waiting', t.abandoned],
          ['Abandonment %', t.abandonmentPct.toFixed(1)],
          ['Answered within SLA %', t.answeredWithinSlaPct.toFixed(1)],
          ['Average handle time (s)', t.avgHandleSeconds],
          ['Average speed of answer (s)', t.avgSpeedOfAnswerSeconds],
          ['Total agent talk time (h)', t.totalTalkHours],
          ['WhatsApp conversations', t.whatsappConversations],
        ],
      ),
    );

    parts.push('', 'COST AVOIDED (assumption-based — see note)');
    parts.push(
      toCsv(
        ['Metric', 'Value'],
        [
          ['Calls contained by AI', d.savings.containedCalls],
          ['Agent hours saved', d.savings.agentHoursSaved],
          ['Estimated saving (USD)', d.savings.estimatedCostSavedUsd],
          ['Assumed agent cost (USD/hour)', d.savings.assumedAgentHourlyUsd],
          [
            'Note',
            'Contained calls valued at the average handle time of calls that did reach an agent. ' +
              'Replace the hourly rate with FIT actual figures before quoting.',
          ],
        ],
      ),
    );

    parts.push('', 'DAILY');
    parts.push(
      toCsv(
        ['Date', 'Calls', 'AI resolved', 'Escalated', 'Abandoned'],
        d.daily.map((x) => [x.day, x.calls, x.aiContained, x.escalated, x.abandoned]),
      ),
    );

    parts.push('', 'BY QUEUE');
    parts.push(
      toCsv(
        ['Queue', 'Calls', 'Containment %', 'Avg answer (s)', 'SLA %'],
        d.byQueue.map((q) => [
          q.queueName,
          q.calls,
          q.containmentPct.toFixed(1),
          q.avgSpeedOfAnswerSeconds,
          q.slaPct.toFixed(1),
        ]),
      ),
    );

    parts.push('', 'BY LOCATION');
    parts.push(
      toCsv(
        ['Site', 'Agents', 'Calls handled', 'Avg handle (s)', 'Occupancy %'],
        d.byLocation.map((l) => [
          l.location,
          l.agents,
          l.callsHandled,
          l.avgHandleSeconds,
          l.occupancyPct.toFixed(1),
        ]),
      ),
    );

    parts.push('', 'WHY THE AI HANDED OFF');
    parts.push(
      toCsv(
        ['Reason', 'Calls'],
        d.escalationReasons.map((r) => [ESCALATION_REASON_LABELS[r.reason], r.count]),
      ),
    );

    parts.push('', 'CALL OUTCOMES');
    parts.push(
      toCsv(
        ['Disposition', 'Calls'],
        d.dispositions.map((x) => [DISPOSITION_LABELS[x.disposition], x.count]),
      ),
    );

    parts.push('', 'MOST-ASKED-ABOUT COURSES');
    parts.push(toCsv(['Course', 'Enquiries'], d.topCourses.map((c) => [c.course, c.enquiries])));

    return { filename: `fit-report-${from}-to-${to}.csv`, body: parts.join('\n') };
  }

  /* ---------------------------- CSV: agent scorecards --------------------- */

  async agentsCsv(query: AnalyticsRangeQuery): Promise<{ filename: string; body: string }> {
    const rows = await this.analytics.agentScorecards(query);
    const from = new Date(query.from).toISOString().slice(0, 10);
    const to = new Date(query.to).toISOString().slice(0, 10);

    return {
      filename: `fit-agents-${from}-to-${to}.csv`,
      body: toCsv(
        [
          'Agent',
          'Location',
          'Calls handled',
          'Talk time (s)',
          'Avg handle (s)',
          'Avg wrap (s)',
          'Occupancy %',
          'Logged in (s)',
          'Break (s)',
          'Missing dispositions',
        ],
        rows.map((a) => [
          a.name,
          a.location,
          a.callsHandled,
          a.talkSeconds,
          a.avgHandleSeconds,
          a.avgWrapSeconds,
          a.occupancyPct.toFixed(1),
          a.loggedInSeconds,
          a.breakSeconds,
          a.dispositionsMissing,
        ]),
      ),
    };
  }
}

/* -------------------------------- helpers -------------------------------- */

function mmss(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Escape one CSV cell.
 *
 * Two separate concerns:
 *  1. CSV correctness — quote anything containing a comma, quote or newline, and
 *     double any embedded quotes. Caller names and agent notes are free text, so
 *     this is not hypothetical.
 *  2. Spreadsheet formula injection — Excel and Sheets execute a cell beginning
 *     `=`, `+`, `-`, `@`, tab or CR. A caller could set their contact name to
 *     `=HYPERLINK(...)` and have it run when a supervisor opens the export. The
 *     fix is to prefix a single quote so it's read as text.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
}
