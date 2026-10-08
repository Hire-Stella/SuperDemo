import { Controller, Get } from '@nestjs/common';
import type { AiLiveOps } from '@superdemo/contracts';
import { zonedParts, zonedTimeToUtc } from '@superdemo/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../tenancy/tenant-context.service';
import { DograhSyncService } from './dograh-sync.service';

const RECENT_LIMIT = 10;
/** Values a workflow writes when it never got an answer. */
const EMPTY = new Set(['', 'not_stated', 'not_applicable', 'unknown', 'none', 'n/a', 'null']);

/**
 * Live ops for a centre answered by its voice workflow.
 *
 * One request for the whole board — calls in progress (held in memory by the
 * sync's live poll), today's figures and the latest finished calls — because
 * the page polls it every few seconds and three round trips would triple that.
 * Everything below runs in the caller's tenant context, so the Prisma reads
 * are scoped to their centre without filtering by hand.
 */
@Controller('ai-live')
export class AiLiveController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly sync: DograhSyncService,
  ) {}

  @Get()
  async board(): Promise<AiLiveOps> {
    const orgId = this.tenants.requireOrgId();
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { dograhOrgId: true, timezone: true },
    });
    if (!org?.dograhOrgId) {
      return {
        enabled: false,
        live: [],
        today: { calls: 0, avgDurationSeconds: 0, leadsCaptured: 0, topIntent: null },
        recent: [],
      };
    }

    // "Today" on the centre's own clock, not the server's.
    const startOfDay = zonedTimeToUtc(
      zonedParts(new Date(), org.timezone).date,
      '00:00',
      org.timezone,
    );

    const [todayCalls, recent] = await Promise.all([
      this.prisma.call.findMany({
        where: { driver: 'dograh', ringingAt: { gte: startOfDay } },
        select: {
          totalMs: true,
          conversation: {
            select: { aiSession: { select: { detectedIntent: true, gathered: true } } },
          },
        },
      }),
      this.prisma.conversation.findMany({
        where: { call: { driver: 'dograh' } },
        orderBy: { startedAt: 'desc' },
        take: RECENT_LIMIT,
        select: {
          id: true,
          startedAt: true,
          disposition: true,
          contact: { select: { name: true, phoneE164: true } },
          call: { select: { totalMs: true } },
          aiSession: { select: { detectedIntent: true, summary: true, gathered: true } },
        },
      }),
    ]);

    const intents = new Map<string, number>();
    let leads = 0;
    let totalMs = 0;
    for (const call of todayCalls) {
      totalMs += call.totalMs ?? 0;
      const session = call.conversation.aiSession;
      if (session?.detectedIntent && !EMPTY.has(session.detectedIntent.toLowerCase())) {
        intents.set(session.detectedIntent, (intents.get(session.detectedIntent) ?? 0) + 1);
      }
      if (leftContact(session?.gathered)) leads++;
    }
    const top = [...intents.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      enabled: true,
      live: this.sync.liveFor(orgId),
      today: {
        calls: todayCalls.length,
        avgDurationSeconds: todayCalls.length ? Math.round(totalMs / todayCalls.length / 1000) : 0,
        leadsCaptured: leads,
        topIntent: top ? { value: top[0], count: top[1] } : null,
      },
      recent: recent.map((c) => {
        const gathered = asRecord(c.aiSession?.gathered);
        return {
          conversationId: c.id,
          startedAt: c.startedAt,
          durationMs: c.call?.totalMs ?? 0,
          callerName: c.contact?.name ?? null,
          callerPhone: c.contact?.phoneE164 ?? null,
          outcome:
            text(gathered.mapped_call_disposition) ??
            text(gathered.call_disposition) ??
            c.disposition ??
            null,
          intent: c.aiSession?.detectedIntent ?? null,
          summary: c.aiSession?.summary ?? null,
        };
      }),
    };
  }
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function text(v: unknown): string | null {
  return typeof v === 'string' && !EMPTY.has(v.trim().toLowerCase()) ? v.trim() : null;
}

/** Did the caller leave a way to reach them? Any name, phone or email field with a real value. */
function leftContact(gathered: unknown): boolean {
  return Object.entries(asRecord(gathered)).some(
    ([key, value]) =>
      /name|phone|mobile|email/i.test(key) &&
      !/company|business/i.test(key) &&
      text(value) !== null,
  );
}
