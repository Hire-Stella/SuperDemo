import {
  BadRequestException,
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
  AddCampaignTargetsInput,
  type CallableContact,
  type CampaignSummary,
  type CampaignTargetRow,
  CreateCampaignInput,
  UpdateCampaignInput,
  type TargetStatus,
} from '@fit-ai/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { DialerService } from './dialer.service';
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

    if (body.status === 'RUNNING') {
      const pending = await this.prisma.campaignTarget.count({
        where: { campaignId: id, status: { in: ['PENDING', 'CALLING'] } },
      });
      if (pending === 0) {
        throw new BadRequestException('Add someone to call before starting this campaign');
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
   * Add people to call.
   *
   * Contacts only — there is no "paste a list of numbers" path, and that is the
   * point. A contact exists in this centre because they called, messaged or were
   * imported deliberately; requiring one keeps the dialer on the right side of
   * consent rules instead of trusting whoever pastes the list.
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
