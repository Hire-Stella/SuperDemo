import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import {
  type AiAgentDto,
  CrmConfig,
  CreateUserInput,
  EscalationRules,
  type QueueDto,
  UpdateUserInput,
  UpsertAiAgentInput,
  UpsertQueueInput,
  defaultStyleForIndustry,
  defaultTemplateForIndustry,
  siteContentForIndustry,
  type Skill,
} from '@superdemo/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { RoutingService } from '../calls/routing.service';
import { CrmSyncService } from '../crm/crm-sync.service';
import { CrmResolver } from '../integrations/crm/crm.resolver';
import { OutboxService } from '../outbox/outbox.service';
import { Roles } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';
import { ENV } from '../config/config.module';
import type { ApiEnv } from '@superdemo/contracts';

/**
 * Configuration surfaces: queues, users, AI agents, CRM connection, settings.
 *
 * Grouped in one controller because they share a single audience — the client's
 * admin — and each is a handful of endpoints. Splitting them into six modules
 * would add ceremony without adding clarity.
 */
@Controller()
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly routing: RoutingService,
    private readonly crmSync: CrmSyncService,
    private readonly outbox: OutboxService,
    private readonly tenants: TenantContext,
    private readonly crmResolver: CrmResolver,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /* ================================ queues =============================== */

  @Get('queues')
  async queues(): Promise<QueueDto[]> {
    const queues = await this.prisma.queue.findMany({ orderBy: { name: 'asc' } });
    return Promise.all(
      queues.map(async (q) => ({
        id: q.id,
        name: q.name,
        requiredSkill: q.requiredSkill as Skill,
        slaSeconds: q.slaSeconds,
        strategy: q.strategy,
        isActive: q.isActive,
        live: await this.routing.liveQueueStats(q.id),
      })),
    );
  }

  @Roles('ADMIN')
  @Post('queues')
  @HttpCode(201)
  async createQueue(@ZodBody(UpsertQueueInput) body: UpsertQueueInput) {
    const queue = await this.prisma.queue.create({ data: body });
    // Auto-enrol every agent who holds the required skill, so a new queue is
    // immediately staffed rather than silently unreachable.
    const eligible = await this.prisma.user.findMany({
      where: { isActive: true, skills: { has: body.requiredSkill } },
      select: { id: true },
    });
    await this.prisma.queueMembership.createMany({
      data: eligible.map((u) => ({ queueId: queue.id, userId: u.id })),
      skipDuplicates: true,
    });
    return queue;
  }

  @Roles('ADMIN')
  @Put('queues/:id')
  async updateQueue(@Param('id') id: string, @ZodBody(UpsertQueueInput) body: UpsertQueueInput) {
    return this.prisma.queue.update({ where: { id }, data: body });
  }

  /* ================================ users ================================ */

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('users')
  async users() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        location: true,
        timezone: true,
        skills: true,
        extension: true,
        avatarColor: true,
        isActive: true,
        lastLoginAt: true,
        bitrixUserId: true,
      },
      orderBy: [{ location: 'asc' }, { name: 'asc' }],
    });
  }

  @Roles('ADMIN')
  @Post('users')
  @HttpCode(201)
  async createUser(@ZodBody(CreateUserInput) body: CreateUserInput) {
    const TIMEZONES: Record<string, string> = {
      DUBAI: 'Asia/Dubai',
      INDIA: 'Asia/Kolkata',
      EGYPT: 'Africa/Cairo',
    };

    const user = await this.prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        name: body.name,
        passwordHash: await this.auth.hashPassword(body.password),
        role: body.role,
        location: body.location,
        timezone: TIMEZONES[body.location] ?? 'Asia/Dubai',
        skills: body.skills,
        extension: body.extension,
        // Nested creates are invisible to the tenant extension, so the org is
        // named explicitly here. packages/db/src/tenant.ts explains why.
        presence: { create: { orgId: this.tenants.requireOrgId(), status: 'OFFLINE' } },
      },
      select: { id: true, email: true, name: true, role: true, location: true },
    });

    // Membership follows skills, same rule as the seed.
    const queues = await this.prisma.queue.findMany({
      where: { requiredSkill: { in: body.skills } },
      select: { id: true },
    });
    await this.prisma.queueMembership.createMany({
      data: queues.map((q) => ({ queueId: q.id, userId: user.id })),
      skipDuplicates: true,
    });

    return user;
  }

  @Roles('ADMIN')
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @ZodBody(UpdateUserInput) body: UpdateUserInput) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        location: body.location,
        skills: body.skills,
        extension: body.extension,
      },
      select: { id: true, name: true, role: true, location: true, skills: true },
    });

    if (body.skills) {
      // Re-derive queue membership so a skill change takes effect immediately.
      await this.prisma.queueMembership.deleteMany({ where: { userId: id } });
      const queues = await this.prisma.queue.findMany({
        where: { requiredSkill: { in: body.skills } },
        select: { id: true },
      });
      await this.prisma.queueMembership.createMany({
        data: queues.map((q) => ({ queueId: q.id, userId: id })),
        skipDuplicates: true,
      });
    }

    return user;
  }

  @Roles('ADMIN')
  @Delete('users/:id')
  @HttpCode(204)
  async deactivateUser(@Param('id') id: string): Promise<void> {
    // Deactivate rather than delete — their historical calls must stay attributed.
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    await this.prisma.agentState
      .update({ where: { userId: id }, data: { status: 'OFFLINE' } })
      .catch(() => undefined);
  }

  /* ============================== AI agents ============================== */

  @Get('ai-agents')
  async aiAgents(): Promise<AiAgentDto[]> {
    const agents = await this.prisma.aiAgent.findMany({ orderBy: { createdAt: 'asc' } });
    const since = new Date(Date.now() - 30 * 864e5);

    return Promise.all(
      agents.map(async (a) => {
        const sessions = await this.prisma.aiSession.findMany({
          where: { aiAgentId: a.id, createdAt: { gte: since } },
          select: { escalated: true, turns: true },
        });
        const total = sessions.length;
        const contained = sessions.filter((s) => !s.escalated).length;

        return {
          id: a.id,
          name: a.name,
          greeting: a.greeting,
          systemPrompt: a.systemPrompt,
          voice: a.voice,
          language: a.language,
          escalationRules: EscalationRules.parse(a.escalationRules),
          defaultQueueId: a.defaultQueueId,
          isActive: a.isActive,
          stats: {
            calls30d: total,
            containmentPct: total ? (contained / total) * 100 : 0,
            avgTurns: total ? sessions.reduce((s, x) => s + x.turns, 0) / total : 0,
          },
        };
      }),
    );
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Put('ai-agents/:id')
  async updateAiAgent(
    @Param('id') id: string,
    @ZodBody(UpsertAiAgentInput) body: UpsertAiAgentInput,
  ) {
    const existing = await this.prisma.aiAgent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('AI agent not found');

    return this.prisma.aiAgent.update({
      where: { id },
      data: {
        name: body.name,
        greeting: body.greeting,
        systemPrompt: body.systemPrompt,
        voice: body.voice,
        language: body.language,
        escalationRules: body.escalationRules,
        defaultQueueId: body.defaultQueueId ?? null,
        isActive: body.isActive,
      },
    });
  }

  /* ================================= CRM ================================= */

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('crm/connection')
  crmConnection() {
    return this.crmSync.connection();
  }

  @Roles('ADMIN')
  @Post('crm/test')
  @HttpCode(200)
  crmTest() {
    return this.crmSync.testConnection();
  }

  /**
   * Choose this centre's CRM.
   *
   * ADMIN only, and never returns what it stored: the response is the same
   * has-it-or-not view as the GET, so a credential cannot be read back out of
   * the API once saved.
   */
  @Roles('ADMIN')
  @Put('crm/config')
  async saveCrmConfig(@ZodBody(CrmConfig) body: CrmConfig) {
    const orgId = this.tenants.requireOrgId();
    await this.crmResolver.save(orgId, body);
    return this.crmResolver.view(orgId);
  }

  /** Revert to the deployment default, clearing stored credentials. */
  @Roles('ADMIN')
  @Delete('crm/config')
  @HttpCode(200)
  async clearCrmConfig() {
    const orgId = this.tenants.requireOrgId();
    await this.crmResolver.clear(orgId);
    return this.crmResolver.view(orgId);
  }

  @Roles('ADMIN', 'SUPERVISOR')
  @Get('crm/sync-log')
  crmSyncLog() {
    return this.crmSync.syncLog(100);
  }

  @Roles('ADMIN')
  @Post('crm/retry/:id')
  @HttpCode(200)
  async crmRetry(@Param('id') id: string) {
    await this.outbox.retry(BigInt(id));
    return { ok: true };
  }

  @Roles('ADMIN')
  @Get('crm/dead-letters')
  async deadLetters() {
    const rows = await this.outbox.deadLetters();
    return rows.map((r) => ({
      id: String(r.id),
      type: r.type,
      aggregateId: r.aggregateId,
      attempts: r.attempts,
      lastError: r.lastError,
      createdAt: r.createdAt,
    }));
  }

  /* =============================== settings ============================== */

  @Get('settings')
  async settings() {
    const s = await this.prisma.setting.findFirst();
    // Lives on Organization rather than Setting because the session carries it
    // — the shell needs it to decide whether to draw the Website nav item, and
    // a second round trip on every page load to answer that would be silly.
    const org = await this.prisma.organization.findUnique({
      where: { id: this.tenants.requireOrgId() },
      select: { websiteEnabled: true, slug: true },
    });
    return {
      ...s,
      websiteEnabled: org?.websiteEnabled ?? true,
      slug: org?.slug ?? null,
      agentHourlyCostUsd: s ? Number(s.agentHourlyCostUsd) : 12,
      // Surfacing the active drivers is how the demo stays honest: anyone
      // looking at settings can see which parts are mocked.
      drivers: {
        telephony: this.env.TELEPHONY_DRIVER,
        messaging: this.env.MESSAGING_DRIVER,
        stt: this.env.STT_DRIVER,
        tts: this.env.TTS_DRIVER,
        llm: this.env.LLM_DRIVER,
        crm: this.env.CRM_DRIVER,
        storage: this.env.STORAGE_DRIVER,
      },
    };
  }

  @Roles('ADMIN')
  @Put('settings')
  async updateSettings(
    @ZodBody(
      z.object({
        instituteName: z.string().min(2).optional(),
        recordingConsentText: z.string().min(10).optional(),
        recordingConsentOn: z.boolean().optional(),
        recordingRetentionDays: z.coerce.number().int().min(1).max(3650).optional(),
        wrapupSeconds: z.coerce.number().int().min(0).max(600).optional(),
        agentRingTimeoutSec: z.coerce.number().int().min(5).max(120).optional(),
        agentHourlyCostUsd: z.coerce.number().min(0).max(1000).optional(),
        bitrixPortalUrl: z.string().url().nullable().optional(),
        /**
         * Whether this centre uses the landing page.
         *
         * An admin's own switch rather than a superadmin-only one: deciding a
         * client does not want a public page is the client's call, and routing
         * it through the operator makes a one-click choice a support request.
         */
        websiteEnabled: z.boolean().optional(),
      }),
    )
    body: Record<string, unknown>,
  ) {
    const { websiteEnabled, ...settingFields } = body;
    const data: Record<string, unknown> = { ...settingFields };
    if (typeof body.agentHourlyCostUsd === 'number') {
      data.agentHourlyCostUsd = String(body.agentHourlyCostUsd);
    }

    if (typeof websiteEnabled === 'boolean') {
      const orgId = this.tenants.requireOrgId();
      const org = await this.prisma.organization.update({
        where: { id: orgId },
        data: { websiteEnabled },
        select: { industry: true, name: true, tagline: true },
      });
      // Same reason as the platform route: enabling must leave a page behind
      // it, or the section opens onto nothing. Disabling never deletes content.
      if (websiteEnabled) {
        const site = await this.prisma.site.findUnique({
          where: { orgId },
          select: { id: true },
        });
        if (!site) {
          await this.prisma.site.create({
            data: {
              orgId,
              template: defaultTemplateForIndustry(org.industry),
              style: defaultStyleForIndustry(org.industry),
              content: siteContentForIndustry(org.industry, org.name),
              metaTitle: `${org.name}${org.tagline ? ` · ${org.tagline}` : ''}`,
            },
          });
        }
      }
    }
    // orgId is unique, so it is a valid identifier here — and naming it keeps
    // this a single-row update rather than an updateMany the extension filters.
    return this.prisma.setting.update({
      where: { orgId: this.tenants.requireOrgId() },
      data,
    });
  }
}
