import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { ApiEnv } from '@fit-ai/contracts';
import { ENV } from './config/config.module';
import { PrismaService } from './prisma/prisma.service';
import { PresenceService } from './presence/presence.service';
import { OutboxService } from './outbox/outbox.service';
import { CallsService } from './calls/calls.service';
import { AnalyticsService } from './analytics/analytics.service';
import { SimulatedTelephony } from './integrations/telephony/simulated.telephony';

/**
 * Background maintenance.
 *
 * Everything here is a safety net rather than a primary path: the primary paths
 * are event-driven, and these catch what falls through (a crashed browser tab, a
 * queued call nobody was free for, a recording past its retention date).
 */
@Injectable()
export class MaintenanceService implements OnApplicationBootstrap {
  private readonly log = new Logger(MaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
    private readonly calls: CallsService,
    private readonly analytics: AnalyticsService,
    private readonly outbox: OutboxService,
    private readonly simulated: SimulatedTelephony,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  onApplicationBootstrap(): void {
    this.analytics.registerHandlers();
    this.outbox.startPolling(5000);

    if (this.env.SIMULATOR_AUTOPILOT) {
      this.log.warn(
        `simulator autopilot ON — a scripted call every ${this.env.SIMULATOR_AUTOPILOT_INTERVAL_MS / 1000}s`,
      );
      setInterval(() => void this.autopilotCall(), this.env.SIMULATOR_AUTOPILOT_INTERVAL_MS).unref();
    }
  }

  /** Keeps the live board populated during an unattended demo. */
  private async autopilotCall(): Promise<void> {
    try {
      const scenarios = this.simulated.listScenarios();
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]!;
      const number = await this.prisma.phoneNumber.findFirst({
        where: { status: 'ASSIGNED' },
        select: { e164: true },
      });
      if (!number) return;
      await this.simulated.startScenario({ scenario, toNumber: number.e164, speed: 1 });
    } catch (error) {
      this.log.error(`autopilot failed: ${String(error)}`);
    }
  }

  /** A crashed browser tab must not keep receiving call offers. */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async reapStaleAgents(): Promise<void> {
    await this.presence.reapStaleAgents().catch((e) => this.log.error(String(e)));
  }

  /** Re-offer anything stuck in a queue — covers the "nobody was free" case. */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async retryQueued(): Promise<void> {
    await this.calls.retryQueuedCalls().catch((e) => this.log.error(String(e)));
  }

  /** Retention sweep. Deletes the file and the row together. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async sweepRecordings(): Promise<void> {
    const expired = await this.prisma.recording.findMany({
      where: { expiresAt: { lt: new Date() } },
      select: { id: true, storageKey: true },
    });
    if (expired.length === 0) return;

    this.log.log(`retention sweep: deleting ${expired.length} expired recording(s)`);
    await this.prisma.recording.deleteMany({ where: { id: { in: expired.map((r) => r.id) } } });
  }
}
