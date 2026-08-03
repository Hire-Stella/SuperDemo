import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type OutboxHandler = (payload: Record<string, unknown>) => Promise<void>;

/**
 * Transactional outbox.
 *
 * Domain writes and event publication commit in the same transaction, then this
 * drains the table. That makes "the call is recorded locally but missing in
 * Bitrix" structurally impossible rather than merely unlikely — which matters,
 * because a CRM integration is exactly the thing that will be unreachable at
 * some point and nobody notices for a week.
 *
 * Failures back off exponentially and stay in the table, so a Bitrix outage is
 * a delay rather than data loss.
 */
@Injectable()
export class OutboxService implements OnModuleDestroy {
  private readonly log = new Logger(OutboxService.name);
  private readonly handlers = new Map<string, OutboxHandler[]>();
  private draining = false;
  private timer?: NodeJS.Timeout;

  private static readonly MAX_ATTEMPTS = 8;
  private static readonly BATCH = 20;

  constructor(private readonly prisma: PrismaService) {}

  /** Subscribe to an event type. Multiple handlers per type are allowed. */
  on(type: string, handler: OutboxHandler): void {
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  /** Nudge the drainer — called right after a producing transaction commits. */
  async notify(): Promise<void> {
    if (this.draining) return;
    // Defer so the caller's request isn't blocked on CRM latency.
    setImmediate(() => void this.drain());
  }

  /** Periodic drain, as a safety net for anything `notify()` missed. */
  startPolling(intervalMs = 5000): void {
    this.timer = setInterval(() => void this.drain(), intervalMs);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;

    try {
      const events = await this.prisma.outboxEvent.findMany({
        where: { publishedAt: null, nextAttemptAt: { lte: new Date() } },
        orderBy: { id: 'asc' },
        take: OutboxService.BATCH,
      });

      for (const event of events) {
        const handlers = this.handlers.get(event.type) ?? [];
        if (handlers.length === 0) {
          // No subscriber — mark handled rather than retrying forever.
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { publishedAt: new Date(), lastError: 'no handler registered' },
          });
          continue;
        }

        try {
          for (const handler of handlers) {
            await handler(event.payload as Record<string, unknown>);
          }
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { publishedAt: new Date(), lastError: null },
          });
        } catch (error) {
          const attempts = event.attempts + 1;
          const giveUp = attempts >= OutboxService.MAX_ATTEMPTS;
          // 5s, 10s, 20s … capped at 10 minutes.
          const backoffMs = Math.min(600_000, 5000 * 2 ** (attempts - 1));

          this.log.error(
            `outbox ${event.type}#${event.id} attempt ${attempts} failed: ${String(error)}` +
              (giveUp ? ' — giving up (dead-lettered)' : ` — retrying in ${backoffMs / 1000}s`),
          );

          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              attempts,
              lastError: String(error).slice(0, 1000),
              nextAttemptAt: new Date(Date.now() + backoffMs),
              // Dead-lettered rows are marked published so they stop being
              // retried but remain in the table for inspection.
              publishedAt: giveUp ? new Date() : null,
            },
          });
        }
      }
    } catch (error) {
      this.log.error(`outbox drain failed: ${String(error)}`);
    } finally {
      this.draining = false;
    }
  }

  /** Dead letters, for the settings page. */
  async deadLetters(limit = 50) {
    return this.prisma.outboxEvent.findMany({
      where: { attempts: { gte: OutboxService.MAX_ATTEMPTS } },
      orderBy: { id: 'desc' },
      take: limit,
    });
  }

  async retry(id: bigint): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { publishedAt: null, attempts: 0, nextAttemptAt: new Date(), lastError: null },
    });
    await this.notify();
  }
}
