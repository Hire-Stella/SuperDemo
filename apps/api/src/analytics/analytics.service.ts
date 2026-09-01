import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ActiveCallRow,
  AgentScorecard,
  AnalyticsOverview,
  AnalyticsRangeQuery,
  ApiEnv,
  Disposition,
  EscalationReason,
  LiveOpsSnapshot,
  Location,
} from '@superdemo/contracts';
import { LIVE_CALL_STATES } from '@superdemo/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { ENV } from '../config/config.module';

/**
 * Analytics.
 *
 * Two rules keep this fast and honest:
 *
 *  · Historical figures come from `CallMetricsDaily`, which is incremented on
 *    call completion. `/analytics` never scans the calls table, so it stays fast
 *    as volume grows.
 *  · Live figures come from the calls table, because "right now" has to be
 *    exact.
 *
 * Bucketing is done in the institute's timezone (Asia/Dubai), so "calls by hour"
 * means something to the person reading it rather than being UTC-shifted.
 */
@Injectable()
export class AnalyticsService {
  private readonly log = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /** Increment the daily rollup. Subscribed to the outbox on module init. */
  registerHandlers(): void {
    this.outbox.on('call.completed', async (payload) => {
      await this.rollUp(payload as { callId: string });
    });
  }

  private async rollUp(payload: { callId: string }): Promise<void> {
    const call = await this.prisma.call.findUnique({
      where: { id: payload.callId },
      include: {
        conversation: { select: { queueId: true, handledById: true, aiContained: true } },
      },
    });
    if (!call) return;

    const day = new Date(call.ringingAt);
    day.setUTCHours(0, 0, 0, 0);

    const queueId = call.conversation.queueId ?? '';
    const agentId = call.conversation.handledById ?? '';
    const abandoned = call.hangupCause === 'ABANDONED_IN_QUEUE';
    const answered = Boolean(call.agentAnsweredAt);

    const queue = queueId
      ? await this.prisma.queue.findUnique({ where: { id: queueId }, select: { slaSeconds: true } })
      : null;
    const slaMs = (queue?.slaSeconds ?? this.env.DEFAULT_SLA_SECONDS) * 1000;
    const withinSla = answered && (call.queueWaitMs ?? Infinity) <= slaMs;

    await this.prisma.callMetricsDaily.upsert({
      // orgId comes off the call rather than the request context: this runs
      // from an outbox handler, which has no request and therefore no context.
      where: { orgId_day_queueId_agentId: { orgId: call.orgId, day, queueId, agentId } },
      create: {
        orgId: call.orgId,
        day,
        queueId,
        agentId,
        calls: 1,
        aiContained: call.conversation.aiContained ? 1 : 0,
        escalated: call.escalatedAt ? 1 : 0,
        abandoned: abandoned ? 1 : 0,
        answeredWithinSla: withinSla ? 1 : 0,
        answeredCount: answered ? 1 : 0,
        talkMsTotal: BigInt(call.agentTalkMs ?? 0),
        handleMsTotal: BigInt((call.agentTalkMs ?? 0) + (call.wrapMs ?? 0)),
        queueWaitMsTotal: BigInt(call.queueWaitMs ?? 0),
        wrapMsTotal: BigInt(call.wrapMs ?? 0),
      },
      update: {
        calls: { increment: 1 },
        aiContained: { increment: call.conversation.aiContained ? 1 : 0 },
        escalated: { increment: call.escalatedAt ? 1 : 0 },
        abandoned: { increment: abandoned ? 1 : 0 },
        answeredWithinSla: { increment: withinSla ? 1 : 0 },
        answeredCount: { increment: answered ? 1 : 0 },
        talkMsTotal: { increment: BigInt(call.agentTalkMs ?? 0) },
        handleMsTotal: { increment: BigInt((call.agentTalkMs ?? 0) + (call.wrapMs ?? 0)) },
        queueWaitMsTotal: { increment: BigInt(call.queueWaitMs ?? 0) },
        wrapMsTotal: { increment: BigInt(call.wrapMs ?? 0) },
      },
    });
  }

  /* ============================== live ops =============================== */

  async liveSnapshot(): Promise<LiveOpsSnapshot> {
    const startOfDay = this.startOfInstituteDay();

    const [liveCalls, presence, openWhatsApp, today] = await Promise.all([
      this.prisma.call.findMany({
        where: { state: { in: [...LIVE_CALL_STATES] } },
        select: { state: true, queuedAt: true },
      }),
      this.prisma.agentState.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.conversation.count({
        where: { channel: 'WHATSAPP', status: { in: ['ACTIVE', 'WAITING'] } },
      }),
      this.prisma.callMetricsDaily.aggregate({
        where: { day: { gte: startOfDay } },
        _sum: {
          calls: true,
          aiContained: true,
          escalated: true,
          abandoned: true,
          answeredWithinSla: true,
          answeredCount: true,
          handleMsTotal: true,
          queueWaitMsTotal: true,
        },
      }),
    ]);

    const byStatus = new Map(presence.map((p) => [p.status, p._count._all]));
    const now = Date.now();
    const waiting = liveCalls.filter((c) => c.state === 'QUEUED' || c.state === 'AGENT_RINGING');
    const longestWaitMs = waiting.reduce(
      (max, c) => Math.max(max, c.queuedAt ? now - c.queuedAt.getTime() : 0),
      0,
    );

    const s = today._sum;
    const calls = s.calls ?? 0;
    const answered = s.answeredCount ?? 0;
    const escalated = s.escalated ?? 0;

    return {
      activeCalls: liveCalls.length,
      aiHandling: liveCalls.filter((c) => c.state === 'AI_HANDLING' || c.state === 'RINGING').length,
      withAgents: liveCalls.filter((c) => c.state === 'AGENT_TALKING').length,
      waitingInQueue: waiting.length,
      longestWaitMs,
      agentsAvailable: byStatus.get('AVAILABLE') ?? 0,
      agentsOnCall: (byStatus.get('ON_CALL') ?? 0) + (byStatus.get('WRAPUP') ?? 0),
      agentsOnBreak: byStatus.get('BREAK') ?? 0,
      agentsOffline: byStatus.get('OFFLINE') ?? 0,
      openWhatsApp,
      today: {
        calls,
        aiContained: s.aiContained ?? 0,
        escalated,
        abandoned: s.abandoned ?? 0,
        containmentPct: calls ? ((s.aiContained ?? 0) / calls) * 100 : 0,
        answeredWithinSlaPct: answered ? ((s.answeredWithinSla ?? 0) / answered) * 100 : 0,
        avgHandleSeconds: answered ? Math.round(Number(s.handleMsTotal ?? 0n) / answered / 1000) : 0,
        avgSpeedOfAnswerSeconds: answered
          ? Math.round(Number(s.queueWaitMsTotal ?? 0n) / answered / 1000)
          : 0,
      },
    };
  }

  async activeCalls(): Promise<ActiveCallRow[]> {
    const calls = await this.prisma.call.findMany({
      where: { state: { in: [...LIVE_CALL_STATES] } },
      include: {
        conversation: {
          include: {
            contact: { select: { name: true } },
            queue: { select: { name: true } },
            handledBy: { select: { name: true } },
            aiSession: { select: { detectedIntent: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { text: true, role: true } },
          },
        },
      },
      orderBy: { ringingAt: 'asc' },
    });

    const now = Date.now();
    return calls.map((c) => ({
      callId: c.id,
      conversationId: c.conversationId,
      state: c.state,
      fromNumber: c.fromNumber,
      contactName: c.conversation.contact?.name ?? null,
      queueName: c.conversation.queue?.name ?? null,
      agentName: c.conversation.handledBy?.name ?? null,
      startedAt: c.ringingAt,
      elapsedMs: now - c.ringingAt.getTime(),
      lastUtterance: c.conversation.messages[0]?.text ?? null,
      detectedIntent: c.conversation.aiSession?.detectedIntent ?? null,
    }));
  }

  /* ============================== overview =============================== */

  async overview(query: AnalyticsRangeQuery): Promise<AnalyticsOverview> {
    const from = new Date(query.from);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(query.to);
    to.setUTCHours(23, 59, 59, 999);

    const where = {
      day: { gte: from, lte: to },
      ...(query.queueId ? { queueId: query.queueId } : {}),
      ...(query.agentId ? { agentId: query.agentId } : {}),
    };

    const rows = await this.prisma.callMetricsDaily.findMany({ where });

    const sum = rows.reduce(
      (acc, r) => ({
        calls: acc.calls + r.calls,
        aiContained: acc.aiContained + r.aiContained,
        escalated: acc.escalated + r.escalated,
        abandoned: acc.abandoned + r.abandoned,
        answeredWithinSla: acc.answeredWithinSla + r.answeredWithinSla,
        answered: acc.answered + r.answeredCount,
        talkMs: acc.talkMs + Number(r.talkMsTotal),
        handleMs: acc.handleMs + Number(r.handleMsTotal),
        queueWaitMs: acc.queueWaitMs + Number(r.queueWaitMsTotal),
      }),
      {
        calls: 0,
        aiContained: 0,
        escalated: 0,
        abandoned: 0,
        answeredWithinSla: 0,
        answered: 0,
        talkMs: 0,
        handleMs: 0,
        queueWaitMs: 0,
      },
    );

    const settings = await this.prisma.setting.findFirst();
    const hourlyUsd = Number(settings?.agentHourlyCostUsd ?? 12);

    // Cost avoided: an AI-contained call consumed no agent time. Valued at the
    // average handle time of calls that *did* reach an agent, which is the
    // defensible comparison.
    const avgHandleSeconds = sum.answered ? sum.handleMs / sum.answered / 1000 : 0;
    const agentHoursSaved = (sum.aiContained * avgHandleSeconds) / 3600;

    /* --- daily series --- */
    const byDay = new Map<string, { calls: number; aiContained: number; escalated: number; abandoned: number }>();
    for (const r of rows) {
      const key = r.day.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { calls: 0, aiContained: 0, escalated: 0, abandoned: 0 };
      cur.calls += r.calls;
      cur.aiContained += r.aiContained;
      cur.escalated += r.escalated;
      cur.abandoned += r.abandoned;
      byDay.set(key, cur);
    }

    /* --- the breakdowns that need the detail tables --- */
    const convWhere = {
      startedAt: { gte: from, lte: to },
      ...(query.queueId ? { queueId: query.queueId } : {}),
      ...(query.agentId ? { handledById: query.agentId } : {}),
    };

    const [escalationReasons, dispositions, whatsappConversations, queues, locations, hourly, courses] =
      await Promise.all([
        this.prisma.aiSession.groupBy({
          by: ['escalationReason'],
          where: { escalated: true, conversation: convWhere },
          _count: { _all: true },
        }),
        this.prisma.conversation.groupBy({
          by: ['disposition'],
          where: { ...convWhere, disposition: { not: null } },
          _count: { _all: true },
        }),
        this.prisma.conversation.count({ where: { ...convWhere, channel: 'WHATSAPP' } }),
        this.prisma.queue.findMany({ select: { id: true, name: true, slaSeconds: true } }),
        this.prisma.user.groupBy({ by: ['location'], where: { isActive: true }, _count: { _all: true } }),
        this.hourlyHeatmap(from, to),
        // Course interest lives on Contact, so it can't be grouped directly from
        // Conversation. Selecting just the one column keeps this cheap.
        this.prisma.conversation.findMany({
          where: { ...convWhere, contact: { courseInterest: { not: null } } },
          select: { contact: { select: { courseInterest: true } } },
        }),
      ]);

    /* --- per-queue --- */
    const byQueue = queues.map((q) => {
      const qr = rows.filter((r) => r.queueId === q.id);
      const calls = qr.reduce((s, r) => s + r.calls, 0);
      const contained = qr.reduce((s, r) => s + r.aiContained, 0);
      const answered = qr.reduce((s, r) => s + r.answeredCount, 0);
      const sla = qr.reduce((s, r) => s + r.answeredWithinSla, 0);
      const wait = qr.reduce((s, r) => s + Number(r.queueWaitMsTotal), 0);
      return {
        queueId: q.id,
        queueName: q.name,
        calls,
        containmentPct: calls ? (contained / calls) * 100 : 0,
        avgSpeedOfAnswerSeconds: answered ? Math.round(wait / answered / 1000) : 0,
        slaPct: answered ? (sla / answered) * 100 : 0,
      };
    });

    /* --- per-location --- */
    const agentRows = rows.filter((r) => r.agentId !== '');
    const agentIds = [...new Set(agentRows.map((r) => r.agentId))];
    const agents = await this.prisma.user.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, location: true },
    });
    const locationOf = new Map(agents.map((a) => [a.id, a.location]));

    const byLocation = locations.map((l) => {
      const lr = agentRows.filter((r) => locationOf.get(r.agentId) === l.location);
      const handled = lr.reduce((s, r) => s + r.answeredCount, 0);
      const handleMs = lr.reduce((s, r) => s + Number(r.handleMsTotal), 0);
      const days = new Set(lr.map((r) => r.day.toISOString().slice(0, 10))).size || 1;
      // Occupancy against a nominal 8-hour shift per agent per day.
      const availableMs = l._count._all * days * 8 * 3600 * 1000;
      return {
        location: l.location as Location,
        agents: l._count._all,
        callsHandled: handled,
        avgHandleSeconds: handled ? Math.round(handleMs / handled / 1000) : 0,
        occupancyPct: availableMs ? Math.min(100, (handleMs / availableMs) * 100) : 0,
      };
    });

    /* --- top courses --- */
    const courseCount = new Map<string, number>();
    for (const row of courses) {
      const course = row.contact?.courseInterest;
      if (!course) continue;
      courseCount.set(course, (courseCount.get(course) ?? 0) + 1);
    }

    return {
      totals: {
        calls: sum.calls,
        aiContained: sum.aiContained,
        escalated: sum.escalated,
        abandoned: sum.abandoned,
        whatsappConversations,
        containmentPct: sum.calls ? (sum.aiContained / sum.calls) * 100 : 0,
        abandonmentPct: sum.calls ? (sum.abandoned / sum.calls) * 100 : 0,
        answeredWithinSlaPct: sum.answered ? (sum.answeredWithinSla / sum.answered) * 100 : 0,
        avgHandleSeconds: Math.round(avgHandleSeconds),
        avgSpeedOfAnswerSeconds: sum.answered
          ? Math.round(sum.queueWaitMs / sum.answered / 1000)
          : 0,
        totalTalkHours: Number((sum.talkMs / 3_600_000).toFixed(1)),
      },
      savings: {
        containedCalls: sum.aiContained,
        agentHoursSaved: Number(agentHoursSaved.toFixed(1)),
        estimatedCostSavedUsd: Number((agentHoursSaved * hourlyUsd).toFixed(2)),
        assumedAgentHourlyUsd: hourlyUsd,
      },
      daily: [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, v]) => ({ day, ...v })),
      escalationReasons: escalationReasons
        .filter((e) => e.escalationReason)
        .map((e) => ({ reason: e.escalationReason as EscalationReason, count: e._count._all })),
      dispositions: dispositions
        .filter((d) => d.disposition)
        .map((d) => ({ disposition: d.disposition as Disposition, count: d._count._all })),
      byQueue: byQueue.filter((q) => q.calls > 0),
      byLocation,
      hourlyHeatmap: hourly,
      topCourses: [...courseCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([course, enquiries]) => ({ course, enquiries })),
    };
  }

  /**
   * hour × weekday heatmap, bucketed in the institute's timezone.
   *
   * Done in SQL because doing it in JS would mean loading every call in the
   * range; `AT TIME ZONE` gets Postgres to do the shift, including DST.
   */
  private async hourlyHeatmap(
    from: Date,
    to: Date,
  ): Promise<{ weekday: number; hour: number; calls: number }[]> {
    const tz = this.env.INSTITUTE_TIMEZONE;
    const rows = await this.prisma.$queryRaw<
      { weekday: number; hour: number; calls: bigint }[]
    >`
      SELECT
        EXTRACT(DOW  FROM "ringingAt" AT TIME ZONE ${tz})::int AS weekday,
        EXTRACT(HOUR FROM "ringingAt" AT TIME ZONE ${tz})::int AS hour,
        COUNT(*)                                               AS calls
      FROM "Call"
      WHERE "ringingAt" >= ${from} AND "ringingAt" <= ${to}
      GROUP BY 1, 2
      ORDER BY 1, 2
    `;
    return rows.map((r) => ({ weekday: r.weekday, hour: r.hour, calls: Number(r.calls) }));
  }

  /* ============================= scorecards ============================== */

  async agentScorecards(query: AnalyticsRangeQuery): Promise<AgentScorecard[]> {
    const from = new Date(query.from);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(query.to);
    to.setUTCHours(23, 59, 59, 999);

    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, location: true },
      orderBy: { name: 'asc' },
    });

    const rows = await this.prisma.callMetricsDaily.findMany({
      where: { day: { gte: from, lte: to }, agentId: { not: '' } },
    });

    // Occupancy and adherence come from the append-only state log, never from
    // the mutable current-state row.
    const stateEvents = await this.prisma.agentStateEvent.findMany({
      where: { at: { gte: from, lte: to }, prevMs: { not: null } },
      select: { userId: true, from: true, prevMs: true },
    });

    const transfers = await this.prisma.callParticipant.groupBy({
      by: ['userId'],
      where: { kind: 'HUMAN_AGENT', joinedAt: { gte: from, lte: to }, leftAt: { not: null } },
      _count: { _all: true },
    });
    void transfers;

    const missing = await this.prisma.conversation.groupBy({
      by: ['handledById'],
      where: {
        startedAt: { gte: from, lte: to },
        handledById: { not: null },
        disposition: null,
        status: 'CLOSED',
      },
      _count: { _all: true },
    });
    const missingByAgent = new Map(missing.map((m) => [m.handledById!, m._count._all]));

    return users.map((u) => {
      const ar = rows.filter((r) => r.agentId === u.id);
      const handled = ar.reduce((s, r) => s + r.answeredCount, 0);
      const talkMs = ar.reduce((s, r) => s + Number(r.talkMsTotal), 0);
      const handleMs = ar.reduce((s, r) => s + Number(r.handleMsTotal), 0);
      const wrapMs = ar.reduce((s, r) => s + Number(r.wrapMsTotal), 0);

      const events = stateEvents.filter((e) => e.userId === u.id);
      const loggedInMs = events
        .filter((e) => e.from && e.from !== 'OFFLINE')
        .reduce((s, e) => s + (e.prevMs ?? 0), 0);
      const breakMs = events
        .filter((e) => e.from === 'BREAK')
        .reduce((s, e) => s + (e.prevMs ?? 0), 0);

      return {
        userId: u.id,
        name: u.name,
        location: u.location as Location,
        callsHandled: handled,
        talkSeconds: Math.round(talkMs / 1000),
        avgHandleSeconds: handled ? Math.round(handleMs / handled / 1000) : 0,
        avgWrapSeconds: handled ? Math.round(wrapMs / handled / 1000) : 0,
        occupancyPct: loggedInMs ? Math.min(100, (handleMs / loggedInMs) * 100) : 0,
        loggedInSeconds: Math.round(loggedInMs / 1000),
        breakSeconds: Math.round(breakMs / 1000),
        transfersOut: 0,
        dispositionsMissing: missingByAgent.get(u.id) ?? 0,
      };
    });
  }

  private startOfInstituteDay(): Date {
    // The rollup keys days by UTC midnight of the call's date, so "today" must
    // use the same basis to line up.
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}
