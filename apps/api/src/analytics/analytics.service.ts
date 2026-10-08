import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  EvalSummary,
  ActiveCallRow,
  AgentScorecard,
  AnalyticsOverview,
  AnalyticsRangeQuery,
  ApiEnv,
  CallInsights,
  Disposition,
  EscalationReason,
  LiveOpsSnapshot,
  Location,
} from '@superdemo/contracts';
import { EVAL_DIMENSIONS, LIVE_CALL_STATES, evalBand } from '@superdemo/contracts';
import { Prisma } from '@superdemo/db';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { ENV } from '../config/config.module';
import { TenantContext } from '../tenancy/tenant-context.service';

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
    private readonly tenants: TenantContext,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /** Increment the daily rollup. Subscribed to the outbox on module init. */
  registerHandlers(): void {
    this.outbox.on('call.completed', async (payload) => {
      await this.rollUp(payload as { callId: string });
    });
  }

  /** Public for DograhSyncService, which imports finished calls without the outbox. */
  async rollUp(payload: { callId: string }): Promise<void> {
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
    // Raw SQL bypasses the tenant extension, so the org is filtered by hand —
    // without it every centre's heatmap counted every centre's calls.
    const orgId = this.tenants.requireOrgId();
    const rows = await this.prisma.$queryRaw<
      { weekday: number; hour: number; calls: bigint }[]
    >`
      SELECT
        EXTRACT(DOW  FROM "ringingAt" AT TIME ZONE ${tz})::int AS weekday,
        EXTRACT(HOUR FROM "ringingAt" AT TIME ZONE ${tz})::int AS hour,
        COUNT(*)                                               AS calls
      FROM "Call"
      WHERE "orgId" = ${orgId} AND "ringingAt" >= ${from} AND "ringingAt" <= ${to}
      GROUP BY 1, 2
      ORDER BY 1, 2
    `;
    return rows.map((r) => ({ weekday: r.weekday, hour: r.hour, calls: Number(r.calls) }));
  }

  /* ============================ call insights ============================ */

  /**
   * What voice workflows gathered on each call, aggregated per field.
   *
   * Nothing here knows any workflow's schema: fields are typed from the values
   * seen (booleans → a rate; short, low-cardinality strings → top values;
   * long or near-unique strings → free text, skipped), so a new workflow gets
   * a breakdown without code. Loads only the gathered JSON and call length for
   * the range, which stays small next to the calls table.
   */
  async insights(query: AnalyticsRangeQuery): Promise<CallInsights> {
    const from = new Date(query.from);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(query.to);
    to.setUTCHours(23, 59, 59, 999);

    const rows = await this.prisma.aiSession.findMany({
      where: {
        gathered: { not: Prisma.DbNull },
        conversation: {
          startedAt: { gte: from, lte: to },
          ...(query.queueId ? { queueId: query.queueId } : {}),
          ...(query.agentId ? { handledById: query.agentId } : {}),
        },
      },
      select: { gathered: true, conversation: { select: { call: { select: { totalMs: true } } } } },
      orderBy: { conversation: { startedAt: 'asc' } },
    });

    const calls = rows
      .map((r) => r.gathered as unknown)
      .filter((g): g is Record<string, unknown> => !!g && typeof g === 'object' && !Array.isArray(g));
    const n = calls.length;
    const rate = (count: number, of = n) => (of ? Math.round((count / of) * 1000) / 10 : 0);
    const totalMs = rows.reduce((s, r) => s + (r.conversation.call?.totalMs ?? 0), 0);

    /* --- lead capture: any non-empty value in a name / phone / email field --- */
    const allKeys = new Set(calls.flatMap((g) => Object.keys(g)));
    const captureKinds = [
      { kind: 'name' as const, label: 'Name given', test: /name/ },
      { kind: 'phone' as const, label: 'Phone given', test: /phone|mobile/ },
      { kind: 'email' as const, label: 'Email given', test: /e_?mail/ },
    ];
    const captureKeys = new Set<string>();
    const capture = captureKinds.flatMap(({ kind, label, test }) => {
      const keys = [...allKeys].filter((k) => test.test(k));
      if (keys.length === 0) return [];
      keys.forEach((k) => captureKeys.add(k));
      const count = calls.filter((g) => keys.some((k) => usable(g[k]) !== null)).length;
      return [{ kind, label, count, pct: rate(count) }];
    });

    /* --- outcome: the workflow's disposition field --- */
    const outcomeKey =
      ['mapped_call_disposition', 'call_disposition'].find((k) => allKeys.has(k)) ??
      [...allKeys].find((k) => /disposition|outcome/.test(k)) ??
      null;
    const outcomeCounts = new Map<string, number>();
    if (outcomeKey) {
      for (const g of calls) {
        const v = usable(g[outcomeKey]);
        if (v !== null) outcomeCounts.set(v, (outcomeCounts.get(v) ?? 0) + 1);
      }
    }

    /* --- journey: calls reaching each node, nodes in first-seen order --- */
    const journey = new Map<string, number>();
    for (const g of calls) {
      const nodes: unknown[] = Array.isArray(g.nodes_visited) ? g.nodes_visited : [];
      for (const node of new Set(nodes.filter((x): x is string => typeof x === 'string' && !!x.trim()))) {
        journey.set(node, (journey.get(node) ?? 0) + 1);
      }
    }

    /* --- per-field breakdowns --- */
    const skip = new Set([...captureKeys, 'nodes_visited', ...(outcomeKey ? [outcomeKey] : [])]);
    const fields: CallInsights['fields'] = [];
    for (const key of allKeys) {
      // Dispositions are the outcome card; prose-named keys are free text.
      if (skip.has(key) || /disposition/.test(key) || FREE_TEXT_KEY.test(key)) continue;
      const present = calls.map((g) => g[key]).filter((v) => v !== undefined && v !== null);
      if (present.length === 0) continue;

      if (present.every((v) => typeof v === 'boolean')) {
        const trueCount = present.filter(Boolean).length;
        fields.push({
          kind: 'boolean',
          key,
          label: humanize(key),
          answered: present.length,
          trueCount,
          truePct: rate(trueCount, present.length),
        });
        continue;
      }

      // Strings and numbers become categories; a string array counts each item.
      if (present.some((v) => typeof v === 'object' && !Array.isArray(v))) continue;
      const answers = present.map((v) => (Array.isArray(v) ? v.map(usable) : [usable(v)]));
      const flat = answers.flat().filter((v): v is string => v !== null);
      if (flat.length === 0) continue;

      const counts = new Map<string, { value: string; count: number }>();
      for (const v of flat) {
        const id = v.toLowerCase();
        const cur = counts.get(id) ?? { value: v, count: 0 };
        cur.count += 1;
        counts.set(id, cur);
      }
      const avgLen = flat.reduce((s, v) => s + v.length, 0) / flat.length;
      const avgWords = flat.reduce((s, v) => s + v.split(/\s+/).length, 0) / flat.length;
      const maxLen = Math.max(...flat.map((v) => v.length));
      const nearUnique = flat.length >= 10 && counts.size > 12 && counts.size / flat.length > 0.5;
      if (avgLen > 40 || avgWords > 4 || maxLen > 80 || nearUnique) continue; // free text

      const sorted = [...counts.values()].sort((a, b) => b.count - a.count);
      const top = sorted.slice(0, 8);
      fields.push({
        kind: 'category',
        key,
        label: humanize(key),
        answered: answers.filter((a) => a.some((v) => v !== null)).length,
        values: top.map((v) => ({ value: v.value, label: humanizeValue(v.value), count: v.count })),
        other: sorted.slice(8).reduce((s, v) => s + v.count, 0),
      });
    }
    fields.sort((a, b) => b.answered - a.answered || a.label.localeCompare(b.label));

    return {
      calls: n,
      avgDurationSeconds: n ? Math.round(totalMs / n / 1000) : 0,
      capture,
      outcomes: {
        field: outcomeKey,
        label: 'Call outcome',
        values: [...outcomeCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([value, count]) => ({ value, label: humanizeValue(value), count })),
      },
      journey: [...journey.entries()].map(([node, count]) => ({ node, count, pct: rate(count) })),
      fields,
    };
  }

  /* ============================= scorecards ============================== */

  /**
   * How well the assistant is doing, and what it is costing.
   *
   * Deliberately reports `unscored` alongside `scored`. An average over the
   * calls that happen to have been evaluated is a number that flatters itself —
   * it silently excludes anything the scorer skipped — and a supervisor reading
   * 91% needs to know whether that is 91% of everything or of a third of it.
   */
  async evals(query: AnalyticsRangeQuery): Promise<EvalSummary> {
    const from = new Date(query.from);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(query.to);
    to.setUTCHours(23, 59, 59, 999);

    const inRange = { conversation: { startedAt: { gte: from, lte: to } } };

    const [rows, unscored, agg, costAgg] = await Promise.all([
      this.prisma.callEval.findMany({
        where: inRange,
        select: {
          score: true,
          accuracy: true,
          policy: true,
          escalation: true,
          tone: true,
          note: true,
          reviewer: true,
          conversationId: true,
          conversation: {
            select: { startedAt: true, contact: { select: { name: true } } },
          },
        },
        orderBy: { conversation: { startedAt: 'asc' } },
      }),
      // AI-handled calls in range with no eval attached. The denominator.
      this.prisma.aiSession.count({
        where: { conversation: { startedAt: { gte: from, lte: to }, callEval: null } },
      }),
      this.prisma.callEval.aggregate({
        where: inRange,
        _avg: { score: true, accuracy: true, policy: true, escalation: true, tone: true },
      }),
      this.prisma.aiSession.aggregate({
        where: { conversation: { startedAt: { gte: from, lte: to } } },
        _sum: { costUsd: true, inputTokens: true, outputTokens: true },
        _count: { _all: true },
      }),
    ]);

    const avg = (v: number | null) => Math.round((v ?? 0) * 10) / 10;

    const bands = { good: 0, watch: 0, poor: 0 };
    for (const r of rows) bands[evalBand(r.score)] += 1;

    // Averaged per day rather than per call, so one busy afternoon does not
    // drown a week of quieter days in the trend line.
    const byDay = new Map<string, { total: number; calls: number }>();
    for (const r of rows) {
      const day = r.conversation.startedAt.toISOString().slice(0, 10);
      const cur = byDay.get(day) ?? { total: 0, calls: 0 };
      cur.total += r.score;
      cur.calls += 1;
      byDay.set(day, cur);
    }

    const totalUsd = Number(costAgg._sum.costUsd ?? 0);
    const calls = costAgg._count._all;

    return {
      scored: rows.length,
      unscored,
      humanReviewed: rows.filter((r) => r.reviewer === 'HUMAN').length,
      avgScore: avg(agg._avg.score),
      dimensions: EVAL_DIMENSIONS.map((d) => ({
        key: d.key,
        label: d.label,
        avg: avg(agg._avg[d.key]),
      })),
      bands,
      trend: [...byDay.entries()].map(([day, v]) => ({
        day,
        avg: Math.round((v.total / v.calls) * 10) / 10,
        calls: v.calls,
      })),
      worst: [...rows]
        .sort((a, b) => a.score - b.score)
        .slice(0, 8)
        .map((r) => ({
          conversationId: r.conversationId,
          contactName: r.conversation.contact?.name ?? null,
          score: r.score,
          note: r.note,
          startedAt: r.conversation.startedAt,
        })),
      cost: {
        totalUsd: Math.round(totalUsd * 10000) / 10000,
        perCallUsd: calls > 0 ? Math.round((totalUsd / calls) * 100000) / 100000 : 0,
        inputTokens: costAgg._sum.inputTokens ?? 0,
        outputTokens: costAgg._sum.outputTokens ?? 0,
      },
    };
  }

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

/** Placeholder answers a workflow writes when the caller said nothing useful. */
const EMPTY_ANSWERS = new Set(['', 'not_stated', 'not_applicable', 'n/a', 'na', 'none', 'unknown', 'null']);

/** A gathered value as a trimmed string, or null when it carries no answer. */
function usable(v: unknown): string | null {
  if (typeof v === 'number') return String(v);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return EMPTY_ANSWERS.has(t.toLowerCase()) ? null : t;
}

/** Keys whose values are prose by name: the caller's own words, notes, summaries. */
const FREE_TEXT_KEY = /(^|_)(raw|questions?|notes?|details|summary|comments?|description|message|feedback|transcript)(_|$)/;

/** Words that read wrong in sentence case. */
const WORD_CASE: Record<string, string> = {
  crm: 'CRM', uae: 'UAE', usa: 'USA', uk: 'UK', id: 'ID', url: 'URL', sms: 'SMS', ai: 'AI',
  whatsapp: 'WhatsApp', faq: 'FAQ', eta: 'ETA', vip: 'VIP',
};

/** `golden_visa_interest` → "Golden visa interest"; `crm_match_found` → "CRM match found". */
function humanize(key: string): string {
  const words = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => WORD_CASE[w] ?? w)
    .join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Machine-looking values (`live_in`, `user_hangup`) get the same treatment; prose stays as typed. */
function humanizeValue(value: string): string {
  return /^[a-z0-9_]+$/.test(value) ? humanize(value) : value;
}
