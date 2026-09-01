import { Injectable, Logger } from '@nestjs/common';
import type { Skill } from '@superdemo/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from '../presence/presence.service';

/**
 * Skills-based routing.
 *
 * Queues map to FIT's four published course categories plus a general
 * admissions queue, so an ABA enquiry reaches someone who knows the education
 * portfolio rather than the next free body.
 */
@Injectable()
export class RoutingService {
  private readonly log = new Logger(RoutingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
  ) {}

  /** Pick the queue for a detected skill, falling back to general admissions. */
  async queueForSkill(
    skill: Skill,
  ): Promise<{ id: string; name: string; slaSeconds: number; requiredSkill: Skill } | null> {
    const select = { id: true, name: true, slaSeconds: true, requiredSkill: true } as const;

    const exact = await this.prisma.queue.findFirst({
      where: { requiredSkill: skill, isActive: true },
      select,
    });
    if (exact) return exact as { id: string; name: string; slaSeconds: number; requiredSkill: Skill };

    const fallback = await this.prisma.queue.findFirst({
      where: { requiredSkill: 'GENERAL', isActive: true },
      select,
    });
    return fallback as { id: string; name: string; slaSeconds: number; requiredSkill: Skill } | null;
  }

  /** Map an AI intent label onto a routing skill. */
  skillForIntent(intent: string | null, courseCategory?: Skill | null): Skill {
    if (courseCategory && courseCategory !== 'GENERAL') return courseCategory;
    if (!intent) return 'GENERAL';

    if (/refund|complaint|visa|residency|attestation|legal/i.test(intent)) return 'GENERAL';
    if (/tax|vat|aml|cpa|cma|ifrs|bank|finance/i.test(intent)) return 'FINANCE';
    if (/aba|sen|montessori|phonics|early_?child|education|teacher|behaviour/i.test(intent))
      return 'EDUCATION';
    if (/language|arabic|english|french|spanish|ielts/i.test(intent)) return 'LANGUAGE';
    if (/hr|marketing|hospital|hospitality|fashion|management|corporate/i.test(intent))
      return 'MANAGEMENT';
    return 'GENERAL';
  }

  /**
   * Choose the next agent to offer a queued call to.
   *
   * Longest-idle-available among agents who hold the queue's required skill and
   * are members of the queue. `excludeUserIds` carries agents who already
   * rejected or timed out on this call, so it is never re-offered to them.
   */
  async selectAgent(params: {
    queueId: string;
    excludeUserIds?: string[];
  }): Promise<string | null> {
    const queue = await this.prisma.queue.findUnique({
      where: { id: params.queueId },
      select: { requiredSkill: true, strategy: true },
    });
    if (!queue) return null;

    const candidates = await this.presence.availableForQueue(params.queueId, queue.requiredSkill);
    const excluded = new Set(params.excludeUserIds ?? []);
    const eligible = candidates.filter((id) => !excluded.has(id));

    if (eligible.length === 0) return null;

    if (queue.strategy === 'SKILL_WEIGHTED') {
      // Highest queue priority wins; presence order (longest idle) breaks ties
      // because `eligible` is already sorted that way.
      const memberships = await this.prisma.queueMembership.findMany({
        where: { queueId: params.queueId, userId: { in: eligible } },
        select: { userId: true, priority: true },
      });
      const priority = new Map(memberships.map((m) => [m.userId, m.priority]));
      return [...eligible].sort(
        (a, b) => (priority.get(b) ?? 0) - (priority.get(a) ?? 0),
      )[0]!;
    }

    if (queue.strategy === 'ROUND_ROBIN') {
      // Fewest calls handled today, so load evens out across a shift.
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const counts = await this.prisma.callParticipant.groupBy({
        by: ['userId'],
        where: { userId: { in: eligible }, kind: 'HUMAN_AGENT', joinedAt: { gte: startOfDay } },
        _count: { _all: true },
      });
      const handled = new Map(counts.map((c) => [c.userId!, c._count._all]));
      return [...eligible].sort((a, b) => (handled.get(a) ?? 0) - (handled.get(b) ?? 0))[0]!;
    }

    // LONGEST_IDLE — presence already returns oldest `since` first.
    return eligible[0]!;
  }

  /** Live queue depth for the board. */
  async liveQueueStats(queueId: string): Promise<{
    waiting: number;
    longestWaitMs: number;
    agentsAvailable: number;
    agentsOnCall: number;
  }> {
    const queue = await this.prisma.queue.findUnique({
      where: { id: queueId },
      select: { requiredSkill: true },
    });

    const waitingCalls = await this.prisma.call.findMany({
      where: {
        state: { in: ['QUEUED', 'AGENT_RINGING'] },
        conversation: { queueId },
      },
      select: { queuedAt: true },
    });

    const now = Date.now();
    const longestWaitMs = waitingCalls.reduce((max, c) => {
      const waited = c.queuedAt ? now - c.queuedAt.getTime() : 0;
      return Math.max(max, waited);
    }, 0);

    const [agentsAvailable, agentsOnCall] = await Promise.all([
      this.prisma.agentState.count({
        where: {
          status: 'AVAILABLE',
          user: {
            isActive: true,
            queues: { some: { queueId } },
            ...(queue ? { skills: { has: queue.requiredSkill } } : {}),
          },
        },
      }),
      this.prisma.agentState.count({
        where: { status: 'ON_CALL', user: { queues: { some: { queueId } } } },
      }),
    ]);

    return { waiting: waitingCalls.length, longestWaitMs, agentsAvailable, agentsOnCall };
  }
}
