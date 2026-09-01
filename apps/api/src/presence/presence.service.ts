import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { AgentStatus, AgentSummary } from '@superdemo/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

/**
 * Agent presence.
 *
 * Two representations, deliberately:
 *   · AgentState      — mutable current status. One row per agent, cheap reads
 *                       for the live board.
 *   · AgentStateEvent — append-only log with the duration of the state being
 *                       left. Every productivity, occupancy and adherence figure
 *                       comes from here. Deriving them from mutable rows gives
 *                       numbers that silently change when someone toggles state.
 */
@Injectable()
export class PresenceService {
  private readonly log = new Logger(PresenceService.name);

  /** States an agent may not leave by clicking a button in the UI. */
  private static readonly SYSTEM_OWNED: readonly AgentStatus[] = ['ON_CALL', 'WRAPUP'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Agent-initiated change. Refuses to interfere with a live call — an agent
   * cannot mark themselves on a break while talking to a student, which would
   * corrupt both routing and the occupancy figures.
   */
  async setByAgent(userId: string, status: AgentStatus, reason?: string): Promise<void> {
    const current = await this.prisma.agentState.findUnique({ where: { userId } });
    if (current && PresenceService.SYSTEM_OWNED.includes(current.status)) {
      throw new BadRequestException(
        `Cannot change status while ${current.status === 'ON_CALL' ? 'on a call' : 'in wrap-up'}. ` +
          `Finish the call first.`,
      );
    }
    if (PresenceService.SYSTEM_OWNED.includes(status)) {
      throw new BadRequestException(`${status} is set by the system, not manually.`);
    }
    await this.transition(userId, status, reason);
  }

  /** System-initiated change (routing, call lifecycle, heartbeat reaper). */
  async transition(
    userId: string,
    to: AgentStatus,
    reason?: string,
    currentCallId?: string | null,
  ): Promise<void> {
    const now = new Date();
    const prev = await this.prisma.agentState.findUnique({ where: { userId } });
    const prevMs = prev ? now.getTime() - prev.since.getTime() : null;

    // The state row and its audit event must land together, or the reports lie.
    await this.prisma.$transaction([
      this.prisma.agentState.upsert({
        where: { userId },
        create: {
          userId,
          status: to,
          since: now,
          reason: reason ?? null,
          lastSeenAt: now,
          currentCallId: currentCallId ?? null,
        },
        update: {
          status: to,
          since: now,
          reason: reason ?? null,
          lastSeenAt: now,
          // `undefined` leaves the column untouched; `null` clears it.
          currentCallId: currentCallId === undefined ? undefined : currentCallId,
        },
      }),
      this.prisma.agentStateEvent.create({
        data: {
          userId,
          from: prev?.status ?? null,
          to,
          at: now,
          reason: reason ?? null,
          prevMs: prevMs && prevMs > 0 ? prevMs : null,
        },
      }),
    ]);

    const payload = {
      userId,
      status: to,
      since: now.toISOString(),
      currentCallId: currentCallId ?? prev?.currentCallId ?? null,
    };
    this.realtime.toUser(userId, 'presence.changed', payload);
    this.realtime.toSupervisors('presence.changed', payload);
  }

  /** Agents eligible to be offered a call from a queue, longest-idle first. */
  async availableForQueue(queueId: string, requiredSkill: string): Promise<string[]> {
    const rows = await this.prisma.agentState.findMany({
      where: {
        status: 'AVAILABLE',
        user: {
          isActive: true,
          skills: { has: requiredSkill as never },
          queues: { some: { queueId } },
        },
      },
      // Longest idle first: the fairest default and it spreads load evenly.
      orderBy: { since: 'asc' },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async roster(): Promise<AgentSummary[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      include: { presence: true },
      orderBy: [{ location: 'asc' }, { name: 'asc' }],
    });

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const metrics = await this.prisma.callMetricsDaily.groupBy({
      by: ['agentId'],
      where: { day: { gte: startOfDay }, agentId: { not: '' } },
      _sum: { calls: true, talkMsTotal: true, handleMsTotal: true, answeredCount: true },
    });
    const byAgent = new Map(metrics.map((m) => [m.agentId, m]));

    return users.map((u) => {
      const m = byAgent.get(u.id);
      const handled = m?._sum.answeredCount ?? 0;
      const talkMs = Number(m?._sum.talkMsTotal ?? 0n);
      const handleMs = Number(m?._sum.handleMsTotal ?? 0n);
      const elapsedToday = Date.now() - startOfDay.getTime();

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        location: u.location,
        timezone: u.timezone,
        skills: u.skills,
        avatarColor: u.avatarColor,
        extension: u.extension,
        status: u.presence?.status ?? 'OFFLINE',
        statusSince: u.presence?.since ?? new Date(),
        currentCallId: u.presence?.currentCallId ?? null,
        today: {
          callsHandled: handled,
          talkSeconds: Math.round(talkMs / 1000),
          avgHandleSeconds: handled ? Math.round(handleMs / handled / 1000) : 0,
          // Occupancy = productive time / elapsed shift time. Approximated here
          // against the calendar day; the analytics module computes it properly
          // from AgentStateEvent for reports.
          occupancyPct: elapsedToday > 0 ? Math.min(100, (handleMs / elapsedToday) * 100) : 0,
        },
      } satisfies AgentSummary;
    });
  }

  /**
   * Mark agents offline when their browser has stopped sending heartbeats.
   * Without this a crashed tab keeps receiving call offers that nobody answers.
   */
  async reapStaleAgents(staleAfterMs = 90_000): Promise<number> {
    const cutoff = new Date(Date.now() - staleAfterMs);
    const stale = await this.prisma.agentState.findMany({
      where: {
        lastSeenAt: { lt: cutoff },
        status: { notIn: ['OFFLINE', 'ON_CALL', 'WRAPUP'] },
      },
      select: { userId: true },
    });
    for (const { userId } of stale) {
      await this.transition(userId, 'OFFLINE', 'heartbeat timeout');
      this.log.warn(`agent ${userId} marked offline — no heartbeat`);
    }
    return stale.length;
  }
}
