import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import type { ApiEnv } from '@fit-ai/contracts';
import { ENV } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { CallsService } from './calls.service';
import { TELEPHONY_PROVIDER } from '../integrations/telephony/telephony.module';
import type { TelephonyProvider } from '@fit-ai/contracts';

/** How often the dialer looks for work. */
const TICK_MS = 5_000;

/**
 * A call that has been placed but whose outcome has not landed yet is stuck if
 * the carrier never calls back. Anything older than this is released.
 */
const CALLING_TIMEOUT_MS = 3 * 60_000;

/**
 * The outbound dialer.
 *
 * Ticks every few seconds, and for each running campaign asks a narrow question:
 * may I place another call right now? The answer depends on the call window in
 * the centre's own timezone, the campaign's concurrency, and whether the target
 * is eligible — never on how many calls are left to make, because a dialer that
 * paces off its backlog is how a list gets hammered at 3am.
 *
 * Three things here are deliberate and worth defending:
 *
 *  * **Targets are claimed atomically.** `updateMany` with a status guard means
 *    two API instances ticking simultaneously cannot both take the same person.
 *    Without it, the failure mode is calling someone twice at once, which is
 *    exactly the thing a client will never forgive.
 *  * **Consent is checked per call, not per import.** A contact who opts out
 *    after being added to a list must stop being called, so `doNotCall` is read
 *    at dial time. Checking it only at import would leave a window measured in
 *    days.
 *  * **The dialer never invents a phone number.** Targets are contacts this
 *    centre already has, and a contact exists because they made contact first.
 *    That, plus the recorded consent basis, is what keeps this defensible under
 *    UAE marketing rules.
 */
@Injectable()
export class DialerService implements OnModuleInit {
  private readonly log = new Logger(DialerService.name);
  /** Guards against a slow tick overlapping the next one. */
  private ticking = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly calls: CallsService,
    @Inject(TELEPHONY_PROVIDER) private readonly telephony: TelephonyProvider,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  onModuleInit(): void {
    if (!this.telephony.supportsOutbound) {
      this.log.warn(
        `Telephony driver "${this.telephony.name}" cannot dial out — campaigns can be built but will not run`,
      );
    }
  }

  @Interval(TICK_MS)
  async tick(): Promise<void> {
    if (this.ticking || !this.telephony.supportsOutbound) return;
    this.ticking = true;
    try {
      await this.reconcileFinishedCalls();
      await this.releaseStuckTargets();

      // Unscoped on purpose: the dialer serves every centre, and each campaign
      // is then processed inside its own tenant context.
      const campaigns = await this.prisma.campaign.findMany({
        where: { status: 'RUNNING' },
        select: {
          id: true,
          orgId: true,
          name: true,
          opener: true,
          consentBasis: true,
          aiAgentId: true,
          queueId: true,
          fromNumberId: true,
          maxConcurrent: true,
          windowStartHour: true,
          windowEndHour: true,
          daysOfWeek: true,
          maxAttempts: true,
          retryAfterMinutes: true,
        },
      });

      for (const campaign of campaigns) {
        try {
          await this.runCampaign(campaign);
        } catch (error) {
          this.log.error(`campaign ${campaign.id} tick failed: ${String(error)}`);
        }
      }
    } finally {
      this.ticking = false;
    }
  }

  private async runCampaign(campaign: {
    id: string;
    orgId: string;
    name: string;
    opener: string;
    consentBasis: string;
    aiAgentId: string;
    queueId: string | null;
    fromNumberId: string | null;
    maxConcurrent: number;
    windowStartHour: number;
    windowEndHour: number;
    daysOfWeek: number[];
    maxAttempts: number;
    retryAfterMinutes: number;
  }): Promise<void> {
    await this.tenants.runAs(campaign.orgId, null, async () => {
      const org = await this.prisma.organization.findUnique({
        where: { id: campaign.orgId },
        select: { timezone: true, isActive: true },
      });
      // A suspended centre must not keep dialling on its own.
      if (!org?.isActive) return;

      const idle = this.outsideWindow(campaign, org.timezone);
      if (idle) return;

      const inFlight = await this.prisma.campaignTarget.count({
        where: { campaignId: campaign.id, status: 'CALLING' },
      });
      const slots = campaign.maxConcurrent - inFlight;
      if (slots <= 0) return;

      const fromNumber = campaign.fromNumberId
        ? await this.prisma.phoneNumber.findUnique({
            where: { id: campaign.fromNumberId },
            select: { e164: true },
          })
        : await this.prisma.phoneNumber.findFirst({
            where: { status: 'ASSIGNED' },
            select: { e164: true },
          });

      if (!fromNumber) {
        this.log.warn(`campaign ${campaign.name} has no number to call from — pausing it`);
        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'PAUSED' },
        });
        return;
      }

      for (let i = 0; i < slots; i++) {
        const placed = await this.placeNext(campaign, fromNumber.e164);
        if (!placed) break; // nothing eligible right now
      }

      await this.completeIfDone(campaign.id);
    });
  }

  /**
   * Claim one eligible target and dial it.
   *
   * Returns false when there is nothing to do, which is how the caller knows to
   * stop filling slots.
   */
  private async placeNext(
    campaign: {
      id: string;
      orgId: string;
      name: string;
      opener: string;
      consentBasis: string;
      aiAgentId: string;
      queueId: string | null;
      maxAttempts: number;
      retryAfterMinutes: number;
    },
    fromNumber: string,
  ): Promise<boolean> {
    const now = new Date();

    const candidate = await this.prisma.campaignTarget.findFirst({
      where: {
        campaignId: campaign.id,
        status: 'PENDING',
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      include: { contact: { select: { id: true, phoneE164: true, doNotCall: true } } },
    });
    if (!candidate) return false;

    // Atomic claim. If another instance took it between the read and here, the
    // count is 0 and we simply try again on the next tick.
    const claimed = await this.prisma.campaignTarget.updateMany({
      where: { id: candidate.id, status: 'PENDING' },
      data: { status: 'CALLING', lastAttemptAt: now, attempts: { increment: 1 } },
    });
    if (claimed.count === 0) return true;

    // Read at dial time, not at import: an opt-out recorded five minutes ago
    // must take effect on this call.
    if (candidate.contact.doNotCall || !candidate.contact.phoneE164) {
      await this.prisma.campaignTarget.update({
        where: { id: candidate.id },
        data: {
          status: 'SUPPRESSED',
          lastError: candidate.contact.doNotCall
            ? 'Contact is marked do-not-call'
            : 'Contact has no phone number',
        },
      });
      return true;
    }

    try {
      const result = await this.calls.placeOutboundCall({
        orgId: campaign.orgId,
        contactId: candidate.contact.id,
        aiAgentId: campaign.aiAgentId,
        fromNumber,
        toNumber: candidate.contact.phoneE164,
        opener: campaign.opener,
        consentBasis: campaign.consentBasis,
        campaignName: campaign.name,
        queueId: campaign.queueId,
      });

      if (!result) {
        await this.fail(candidate.id, 'Telephony driver refused the call');
        return true;
      }

      await this.prisma.campaignTarget.update({
        where: { id: candidate.id },
        data: { conversationId: result.conversationId },
      });
      return true;
    } catch (error) {
      await this.fail(candidate.id, String(error instanceof Error ? error.message : error));
      return true;
    }
  }

  /**
   * Settle targets whose call has finished.
   *
   * Derived from the call's own end state rather than pushed here by
   * CallsService, for two reasons: it keeps the dependency one-way (the dialer
   * knows about calls, calls know nothing about campaigns), and it is
   * self-healing — a callback lost to a restart is picked up on the next tick
   * instead of leaving a target stuck forever.
   */
  private async reconcileFinishedCalls(): Promise<void> {
    const inFlight = await this.prisma.campaignTarget.findMany({
      where: { status: 'CALLING', conversationId: { not: null } },
      include: { campaign: { select: { maxAttempts: true, retryAfterMinutes: true } } },
    });

    for (const target of inFlight) {
      const call = await this.prisma.call.findFirst({
        where: { conversationId: target.conversationId! },
        select: { state: true, aiAnsweredAt: true, agentAnsweredAt: true, hangupCause: true },
      });
      if (!call || call.state !== 'COMPLETED') continue;

      // "Answered" means a human picked up and heard something — the AI leg
      // starting is the evidence, since that only happens after an answer.
      const answered = Boolean(call.aiAnsweredAt ?? call.agentAnsweredAt);

      if (answered) {
        await this.prisma.campaignTarget.update({
          where: { id: target.id },
          data: { status: 'ANSWERED', lastError: null },
        });
        continue;
      }

      const exhausted = target.attempts >= target.campaign.maxAttempts;
      await this.prisma.campaignTarget.update({
        where: { id: target.id },
        data: {
          status: exhausted ? 'EXHAUSTED' : 'PENDING',
          nextAttemptAt: exhausted
            ? null
            : new Date(Date.now() + target.campaign.retryAfterMinutes * 60_000),
          lastError: call.hangupCause ? `Not answered (${call.hangupCause})` : 'Not answered',
        },
      });
    }
  }

  private async fail(targetId: string, error: string): Promise<void> {
    await this.prisma.campaignTarget.update({
      where: { id: targetId },
      data: { status: 'FAILED', lastError: error.slice(0, 500) },
    });
  }

  /**
   * Why a campaign is not dialling, in words an admin can act on.
   *
   * Returned to the UI as well as used internally — "Running" next to a column
   * of zeros with no explanation is the most common way an outbound tool wastes
   * someone's afternoon.
   */
  outsideWindow(
    campaign: { windowStartHour: number; windowEndHour: number; daysOfWeek: number[] },
    timezone: string,
  ): string | null {
    const now = new Date();

    // Read the wall-clock hour and weekday in the centre's own timezone: a
    // Dubai campaign must not start dialling at 09:00 UTC.
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
      weekday: 'short',
    }).formatToParts(now);

    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const weekdayName = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const isoDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekdayName) + 1;

    if (campaign.daysOfWeek.length && !campaign.daysOfWeek.includes(isoDay)) {
      return `Outside the campaign's calling days (today is ${weekdayName} in ${timezone})`;
    }
    if (hour < campaign.windowStartHour || hour >= campaign.windowEndHour) {
      return `Outside the calling window ${pad(campaign.windowStartHour)}:00–${pad(
        campaign.windowEndHour,
      )}:00 (it is ${pad(hour)}:00 in ${timezone})`;
    }
    return null;
  }

  /**
   * Release targets whose call never materialised.
   *
   * Only those: a target whose call is still live is *not* stuck, it is on the
   * phone. An earlier version released purely on age, which would have dialled
   * someone a second time while they were still talking to an agent — a queued
   * caller waiting for a free agent passes three minutes easily.
   */
  private async releaseStuckTargets(): Promise<void> {
    const cutoff = new Date(Date.now() - CALLING_TIMEOUT_MS);
    const stale = await this.prisma.campaignTarget.findMany({
      where: { status: 'CALLING', lastAttemptAt: { lt: cutoff } },
      select: { id: true, conversationId: true },
    });

    let released = 0;
    for (const target of stale) {
      if (target.conversationId) {
        const call = await this.prisma.call.findFirst({
          where: { conversationId: target.conversationId },
          select: { id: true, state: true, aiAnsweredAt: true },
        });

        // Someone answered and the call is still going. Long calls are normal;
        // leave it alone and let reconcileFinishedCalls settle it at the end.
        if (call?.aiAnsweredAt && call.state !== 'COMPLETED') continue;

        // Still pre-answer after the timeout means nothing is coming: the
        // driver's ring timer died with a restart, or a carrier dropped the
        // webhook. Close the call so the next tick can retry the person —
        // without this the slot is held forever.
        if (call && call.state !== 'COMPLETED') {
          await this.calls.abandonStalledCall(call.id);
          continue;
        }

        // Completed: reconcileFinishedCalls, which runs first in this tick, owns it.
        if (call) continue;
      }
      await this.prisma.campaignTarget.update({
        where: { id: target.id },
        data: { status: 'PENDING', lastError: 'Call was never placed — released for retry' },
      });
      released++;
    }
    if (released) this.log.warn(`released ${released} outbound target(s) with no call`);
  }

  private async completeIfDone(campaignId: string): Promise<void> {
    const remaining = await this.prisma.campaignTarget.count({
      where: { campaignId, status: { in: ['PENDING', 'CALLING'] } },
    });
    if (remaining > 0) return;

    const total = await this.prisma.campaignTarget.count({ where: { campaignId } });
    if (total === 0) return; // an empty campaign is not a finished one

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    this.log.log(`campaign ${campaignId} completed`);
  }
}

const pad = (n: number) => String(n).padStart(2, '0');
