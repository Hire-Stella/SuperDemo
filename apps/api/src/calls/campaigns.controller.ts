import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  AddCampaignPeopleInput,
  type AddCampaignPeopleResult,
  AddCampaignTargetsInput,
  type CallableContact,
  type CampaignSummary,
  type CampaignTargetRow,
  CreateCampaignInput,
  DograhDialers,
  UpdateCampaignInput,
  type TargetStatus,
  countryByCode,
  readPhoneNumber,
} from '@superdemo/contracts';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { DograhService } from '../integrations/dograh/dograh.service';
import { AGENT_DIAL_GAP_MS, DialerService, voiceAgentContext } from './dialer.service';
import { Roles } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';

/**
 * Outbound campaigns.
 *
 * Everything here is tenant-scoped by the Prisma extension, so a centre can only
 * ever see and dial its own lists — including the contact ids it may add, which
 * is what stops one client using another's customers as a calling list.
 */
@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly dialer: DialerService,
    private readonly dograh: DograhService,
  ) {}

  @Roles('ADMIN', 'SUPERVISOR')
  @Get()
  async list(): Promise<CampaignSummary[]> {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        targets: { select: { status: true } },
      },
    });

    // Names come from a second pass rather than a relation: Campaign points at
    // an AiAgent and a Queue by id without a relation field, because a campaign
    // outliving the agent it used should stay readable rather than fail to load.
    const [agents, queues, numbers, org] = await Promise.all([
      this.prisma.aiAgent.findMany({ select: { id: true, name: true } }),
      this.prisma.queue.findMany({ select: { id: true, name: true } }),
      this.prisma.phoneNumber.findMany({ select: { id: true, e164: true } }),
      this.prisma.organization.findUnique({
        where: { id: this.tenants.requireOrgId() },
        select: { timezone: true },
      }),
    ]);

    return campaigns.map((c) => {
      const counts = tally(c.targets.map((t) => t.status as TargetStatus));
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        opener: c.opener,
        consentBasis: c.consentBasis,
        aiAgentId: c.aiAgentId,
        aiAgentName: agents.find((a) => a.id === c.aiAgentId)?.name ?? null,
        queueId: c.queueId,
        queueName: queues.find((q) => q.id === c.queueId)?.name ?? null,
        fromNumber: numbers.find((n) => n.id === c.fromNumberId)?.e164 ?? null,
        maxConcurrent: c.maxConcurrent,
        windowStartHour: c.windowStartHour,
        windowEndHour: c.windowEndHour,
        daysOfWeek: c.daysOfWeek,
        maxAttempts: c.maxAttempts,
        retryAfterMinutes: c.retryAfterMinutes,
        voiceAgent: c.voiceAgent,
        startedAt: c.startedAt,
        completedAt: c.completedAt,
        createdAt: c.createdAt,
        counts,
        // Only meaningful while running — "Running" beside a row of zeros with
        // no explanation is how an outbound tool wastes someone's afternoon.
        idleReason:
          c.status === 'RUNNING'
            ? this.dialer.outsideWindow(c, org?.timezone ?? 'Asia/Dubai')
            : null,
      };
    });
  }

  /**
   * People this centre could call.
   *
   * Lives here rather than in a general contacts controller because this is the
   * only thing that needs it, and because the filtering is dialer-specific:
   * someone with no phone number or an opt-out is not a candidate, so they are
   * excluded at the source instead of being offered and then silently skipped.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Get('candidates')
  async candidates(@Query('search') search?: string, @Query('limit') limit?: string) {
    const take = Math.min(Number(limit) || 100, 500);

    const contacts = await this.prisma.contact.findMany({
      where: {
        phoneE164: { not: null },
        doNotCall: false,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { phoneE164: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take,
      select: {
        id: true,
        name: true,
        phoneE164: true,
        email: true,
        courseInterest: true,
        _count: { select: { conversations: true } },
      },
    });

    return {
      items: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        phoneE164: c.phoneE164,
        email: c.email,
        courseInterest: c.courseInterest,
        // Shown in the picker: someone who has spoken to this centre before is
        // a defensible person to call back, and the count is the evidence.
        totalConversations: c._count.conversations,
      })),
    };
  }

  /**
   * A telecaller's worklist.
   *
   * Richer than `candidates`: it carries when each person was last spoken to and
   * how that call ended, because the first thing a telecaller needs is "where
   * did I leave off with this one" — without it they open every record to find
   * out, or worse, ring someone twice in a day.
   */
  @Roles('ADMIN', 'SUPERVISOR', 'AGENT')
  @Get('worklist')
  async worklist(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<CallableContact[]> {
    const take = Math.min(Number(limit) || 60, 200);

    const contacts = await this.prisma.contact.findMany({
      where: {
        phoneE164: { not: null },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { phoneE164: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take,
      select: {
        id: true,
        name: true,
        phoneE164: true,
        courseInterest: true,
        doNotCall: true,
        _count: { select: { conversations: true } },
        conversations: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { startedAt: true, disposition: true, aiContained: true },
        },
      },
    });

    return contacts.map((c) => {
      const last = c.conversations[0];
      return {
        id: c.id,
        name: c.name,
        phoneE164: c.phoneE164,
        interest: c.courseInterest,
        totalConversations: c._count.conversations,
        lastContactedAt: last?.startedAt ?? null,
        lastOutcome: last?.disposition ?? (last ? (last.aiContained ? 'AI resolved' : 'Escalated') : null),
        doNotCall: c.doNotCall,
      };
    });
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Get(':id/targets')
  async targets(@Param('id') id: string): Promise<CampaignTargetRow[]> {
    const rows = await this.prisma.campaignTarget.findMany({
      where: { campaignId: id },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      take: 500,
      include: { contact: { select: { name: true, phoneE164: true } } },
    });

    return rows.map((t) => ({
      id: t.id,
      contactId: t.contactId,
      contactName: t.contact.name,
      phoneE164: t.contact.phoneE164,
      status: t.status,
      attempts: t.attempts,
      lastAttemptAt: t.lastAttemptAt,
      nextAttemptAt: t.nextAttemptAt,
      conversationId: t.conversationId,
      lastError: t.lastError,
    }));
  }

  @Roles('ADMIN')
  @Post()
  @HttpCode(201)
  async create(@ZodBody(CreateCampaignInput) body: CreateCampaignInput) {
    if (body.windowEndHour <= body.windowStartHour) {
      throw new BadRequestException('The calling window must end after it starts');
    }

    // The agent must be this centre's — the read is scoped, so a borrowed id
    // from another tenant simply does not resolve.
    const agent = await this.prisma.aiAgent.findUnique({ where: { id: body.aiAgentId } });
    if (!agent) throw new NotFoundException('AI agent not found');

    return this.prisma.campaign.create({
      data: {
        name: body.name,
        opener: body.opener,
        consentBasis: body.consentBasis,
        aiAgentId: body.aiAgentId,
        queueId: body.queueId ?? null,
        fromNumberId: body.fromNumberId ?? null,
        maxConcurrent: body.maxConcurrent,
        windowStartHour: body.windowStartHour,
        windowEndHour: body.windowEndHour,
        daysOfWeek: body.daysOfWeek,
        maxAttempts: body.maxAttempts,
        retryAfterMinutes: body.retryAfterMinutes,
        voiceAgent: body.voiceAgent,
      },
      select: { id: true, name: true, status: true },
    });
  }

  /**
   * Edit or start/stop a campaign.
   *
   * Starting is just a status change — the dialer notices on its next tick, so
   * there is no separate "start" path that could disagree with what the dialer
   * actually looks at.
   */
  @Roles('ADMIN')
  @Put(':id')
  async update(@Param('id') id: string, @ZodBody(UpdateCampaignInput) body: UpdateCampaignInput) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campaign not found');

    if (
      body.windowStartHour !== undefined &&
      body.windowEndHour !== undefined &&
      body.windowEndHour <= body.windowStartHour
    ) {
      throw new BadRequestException('The calling window must end after it starts');
    }

    if (body.status === 'RUNNING' && (body.voiceAgent ?? existing.voiceAgent)) {
      // Said here, where someone pressed Start; the dialer would only pause it.
      const setting = await this.prisma.setting.findFirst({ select: { dograhDialers: true } });
      const dialers = DograhDialers.safeParse(setting?.dograhDialers ?? {});
      if (!dialers.success || !dialers.data.outbound.enabled || !dialers.data.outbound.workflowUuid) {
        throw new BadRequestException('This centre has no outbound voice agent to call with yet');
      }
    }

    if (body.status === 'RUNNING') {
      const pending = await this.prisma.campaignTarget.count({
        where: { campaignId: id, status: { in: ['PENDING', 'CALLING'] } },
      });
      if (pending === 0) {
        /**
         * One campaign legitimately starts empty: the one the centre's landing
         * page feeds.
         *
         * Its targets arrive from visitors after it is running — and the site
         * only queues into a RUNNING campaign, precisely so a visitor is never
         * told "we will call you shortly" and then parked behind a paused list.
         * Those two rules together make a web-lead campaign impossible to start
         * unless this check knows about the exception.
         */
        const fedByWebsite = await this.prisma.site.count({ where: { leadCampaignId: id } });
        if (fedByWebsite === 0) {
          throw new BadRequestException('Add someone to call before starting this campaign');
        }
      }
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...body,
        // Stamped on the first start only, so a pause/resume does not rewrite
        // when the campaign actually began.
        startedAt:
          body.status === 'RUNNING' && !existing.startedAt ? new Date() : existing.startedAt,
        completedAt: body.status === 'RUNNING' ? null : existing.completedAt,
      },
      select: { id: true, name: true, status: true, startedAt: true },
    });
  }

  /**
   * Add people to call, from contacts this centre already has.
   *
   * The other way in is `people` below, which imports a typed or uploaded list
   * first. Either way the dialer only ever sees contacts, and the campaign's
   * consent basis is written onto every call it places.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Post(':id/targets')
  @HttpCode(201)
  async addTargets(
    @Param('id') id: string,
    @ZodBody(AddCampaignTargetsInput) body: AddCampaignTargetsInput,
  ) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const contacts = await this.prisma.contact.findMany({
      where: { id: { in: body.contactIds } },
      select: { id: true, phoneE164: true, doNotCall: true },
    });

    const callable = contacts.filter((c) => c.phoneE164 && !c.doNotCall);
    const skipped = contacts.length - callable.length;
    const unknown = body.contactIds.length - contacts.length;

    const created = await this.prisma.campaignTarget.createMany({
      data: callable.map((c) => ({ campaignId: id, contactId: c.id })),
      // Re-adding a list must not double-call anyone already on it.
      skipDuplicates: true,
    });

    return {
      added: created.count,
      skippedNoPhoneOrOptedOut: skipped,
      notFoundInThisCentre: unknown,
    };
  }

  /**
   * Import people by name and number — typed in, or rows of a CSV — and queue
   * them on this campaign.
   *
   * Each number becomes (or matches) a contact, so a person uploaded twice, or
   * who already called in, stays one record. A contact who opted out keeps their
   * opt-out: re-uploading them does not make them callable again.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Post(':id/people')
  @HttpCode(201)
  async addPeople(
    @Param('id') id: string,
    @ZodBody(AddCampaignPeopleInput) body: AddCampaignPeopleInput,
  ): Promise<AddCampaignPeopleResult> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const country = countryByCode(body.country);
    const invalid: AddCampaignPeopleResult['invalid'] = [];
    // Keyed by number: the last name given for a number wins within one upload.
    const byPhone = new Map<string, string | undefined>();
    body.people.forEach((p, i) => {
      const e164 = readPhoneNumber(country, p.phone);
      if (!e164) {
        invalid.push({ row: i + 1, phone: p.phone, reason: p.phone ? 'Not a phone number' : 'No phone number' });
        return;
      }
      byPhone.set(e164, p.name || undefined);
    });

    const phones = [...byPhone.keys()];
    if (phones.length > 0) {
      await this.prisma.contact.createMany({
        data: phones.map((phoneE164) => ({ phoneE164, name: byPhone.get(phoneE164) ?? null })),
        // Existing contacts keep their record; a name is only filled in below.
        skipDuplicates: true,
      });
    }
    const contacts = await this.prisma.contact.findMany({
      where: { phoneE164: { in: phones } },
      select: { id: true, name: true, phoneE164: true, doNotCall: true },
    });

    // A contact we only knew by number gets the name from the list.
    await Promise.all(
      contacts
        .filter((c) => !c.name && byPhone.get(c.phoneE164!))
        .map((c) =>
          this.prisma.contact.update({
            where: { id: c.id },
            data: { name: byPhone.get(c.phoneE164!) },
          }),
        ),
    );

    const callable = contacts.filter((c) => !c.doNotCall);
    const created = await this.prisma.campaignTarget.createMany({
      data: callable.map((c) => ({ campaignId: id, contactId: c.id })),
      skipDuplicates: true,
    });

    return {
      added: created.count,
      alreadyOnList: callable.length - created.count,
      optedOut: contacts.length - callable.length,
      invalid,
    };
  }

  /**
   * Ring one person on the list now, with the centre's outbound voice agent.
   *
   * This is the centre's Dograh outbound slot rather than the dialer: the
   * dialer paces through the telephony driver, which only simulates, while this
   * places a real call. Opt-outs are still honoured, and each press counts as
   * an attempt so the list shows who has been rung and when.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':id/targets/:targetId/call')
  @HttpCode(200)
  async callNow(@Param('id') id: string, @Param('targetId') targetId: string) {
    const target = await this.prisma.campaignTarget.findFirst({
      where: { id: targetId, campaignId: id },
      include: { contact: { select: { name: true, phoneE164: true, doNotCall: true } } },
    });
    if (!target) throw new NotFoundException('That person is not on this campaign');
    const { name, phoneE164, doNotCall } = target.contact;
    if (!phoneE164) throw new BadRequestException('This person has no phone number');
    if (doNotCall || target.status === 'SUPPRESSED') {
      throw new BadRequestException('This person asked not to be called');
    }

    // Waits its turn behind any call started in the last AGENT_DIAL_GAP_MS.
    await this.dialer.agentDialTurn(this.tenants.requireOrgId());

    // Claimed the way the dialer claims, so a running campaign does not ring
    // them again while this call is out; the dialer settles it from the import.
    const claimed = await this.prisma.campaignTarget.updateMany({
      where: { id: target.id, status: { not: 'CALLING' } },
      data: {
        status: 'CALLING',
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
        nextAttemptAt: null,
        dograhRunId: null,
        lastError: null,
      },
    });
    if (claimed.count === 0) throw new ConflictException('A call to this person is already in progress');

    const result = await this.dograh.placeDialerCall(
      this.tenants.requireOrgId(),
      'outbound',
      phoneE164,
      undefined,
      voiceAgentContext(name, phoneE164),
    );

    await this.prisma.campaignTarget.update({
      where: { id: target.id },
      data: result.ok
        ? { dograhRunId: result.workflowRunId }
        : {
            status: target.status,
            attempts: { decrement: 1 },
            nextAttemptAt: target.nextAttemptAt,
            lastError: result.detail.slice(0, 300),
          },
    });
    if (!result.ok) throw new BadGatewayException(result.detail);
    return result;
  }

  /**
   * Ring everyone on the list, now.
   *
   * The opposite of the dialer's pacing, on purpose: someone pressed a button
   * to call these people now, so neither the calling window nor maxConcurrent
   * applies. CALL_ALL_MAX is the guard instead — a phone system has a fixed
   * number of lines, and the rest are simply left for the next press. Calls
   * start AGENT_DIAL_GAP_MS apart and then run side by side.
   * Everyone means everyone not already on a call and not opted out, answered
   * or not: this is "call my list", not "finish my list".
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post(':id/call-all')
  @HttpCode(200)
  async callAll(@Param('id') id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const waiting = await this.prisma.campaignTarget.findMany({
      where: { campaignId: id, status: { notIn: ['CALLING', 'SUPPRESSED'] } },
      orderBy: { createdAt: 'asc' },
      take: CALL_ALL_MAX,
      include: { contact: { select: { name: true, phoneE164: true, doNotCall: true } } },
    });
    const remaining =
      (await this.prisma.campaignTarget.count({
        where: { campaignId: id, status: { notIn: ['CALLING', 'SUPPRESSED'] } },
      })) - waiting.length;

    const optedOut = waiting.filter((t) => t.contact.doNotCall || !t.contact.phoneE164);
    if (optedOut.length) {
      await this.prisma.campaignTarget.updateMany({
        where: { id: { in: optedOut.map((t) => t.id) } },
        data: { status: 'SUPPRESSED', lastError: 'Contact is marked do-not-call' },
      });
    }

    const callable = waiting.filter((t) => !optedOut.includes(t));
    const gapSeconds = AGENT_DIAL_GAP_MS / 1000;
    const summary = { optedOut: optedOut.length, remaining, gapSeconds };
    const [first, ...rest] = callable;
    if (!first) return { placed: 0, queued: 0, failed: [], ...summary };

    // The first call now, so whoever pressed sees a phone ring — or hears at
    // once why not, before anyone else is queued behind a broken setup. The
    // rest start one every AGENT_DIAL_GAP_MS in the background: see there for
    // why they are no longer all dialled in the same second.
    const orgId = this.tenants.requireOrgId();
    await this.dialer.agentDialTurn(orgId);
    const result = await this.dialer.dialAgentTarget(orgId, first);
    if (result && !result.ok) {
      return {
        placed: 0,
        queued: 0,
        failed: [{ name: first.contact.name, detail: result.detail }],
        ...summary,
        remaining: remaining + rest.length,
      };
    }
    this.dialer.callInTurn(
      orgId,
      id,
      rest.map((t) => t.id),
    );
    return { placed: result ? 1 : 0, queued: rest.length, failed: [], ...summary };
  }

  /**
   * Take one person off the list.
   *
   * Only the campaign entry goes: the contact, and every call and conversation
   * with them, stay in the Inbox. Refused while they are on a call, because the
   * dialer settles a voice-agent call against this row when the run is
   * imported, and a row deleted mid-call would leave that call unaccounted for.
   */
  @Roles('ADMIN', 'SUPERVISOR')
  @Delete(':id/targets/:targetId')
  @HttpCode(204)
  async removeTarget(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ): Promise<void> {
    const removed = await this.prisma.campaignTarget.deleteMany({
      where: { id: targetId, campaignId: id, status: { not: 'CALLING' } },
    });
    if (removed.count === 0) {
      const onCall = await this.prisma.campaignTarget.count({ where: { id: targetId, campaignId: id } });
      if (onCall) throw new ConflictException('This person is on a call — remove them once it ends');
      throw new NotFoundException('That person is not on this campaign');
    }
    // A landing-page lead keeps its consent record, but stops pointing at a
    // campaign entry that no longer exists.
    await this.prisma.siteLead.updateMany({ where: { targetId }, data: { targetId: null } });
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(204)
  async cancel(@Param('id') id: string): Promise<void> {
    // Cancelled rather than deleted: the calls it placed stay attributable, the
    // same rule as deactivating a user instead of removing them.
    await this.prisma.campaign.update({
      where: { id },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });
  }

  /**
   * Mark a contact as never-call-again. Honoured at dial time.
   *
   * AGENT included deliberately: the telecaller on the call is the person who
   * hears "take me off your list", and making them ask an admin to record it is
   * how an opt-out gets lost.
   */
  @Roles('ADMIN', 'SUPERVISOR', 'AGENT')
  @Post('contacts/:contactId/do-not-call')
  @HttpCode(200)
  async doNotCall(@Param('contactId') contactId: string) {
    const contact = await this.prisma.contact.update({
      where: { id: contactId },
      data: { doNotCall: true },
      select: { id: true, name: true, phoneE164: true, doNotCall: true },
    });

    // Suppress them everywhere they are queued, not just on future imports.
    const suppressed = await this.prisma.campaignTarget.updateMany({
      where: { contactId, status: { in: ['PENDING', 'CALLING'] } },
      data: { status: 'SUPPRESSED', lastError: 'Contact asked not to be called' },
    });

    return { contact, suppressedTargets: suppressed.count };
  }
}

/** Most calls one "Call all now" press places; the rest wait for the next press. */
const CALL_ALL_MAX = 50;

function tally(statuses: TargetStatus[]) {
  const count = (s: TargetStatus) => statuses.filter((x) => x === s).length;
  return {
    total: statuses.length,
    pending: count('PENDING'),
    calling: count('CALLING'),
    answered: count('ANSWERED'),
    noAnswer: count('NO_ANSWER'),
    exhausted: count('EXHAUSTED'),
    failed: count('FAILED'),
    suppressed: count('SUPPRESSED'),
  };
}
