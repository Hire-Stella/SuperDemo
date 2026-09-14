import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  CreateOrgInput,
  DeleteOrgInput,
  DEFAULT_PRESET_FOR_INDUSTRY,
  INDUSTRY_TEMPLATES,
  LOCATION_TIMEZONES,
  type OrgSummary,
  UpdateOrgInput,
  defaultStyleForIndustry,
  defaultTemplateForIndustry,
  isReservedSlug,
  siteContentForIndustry,
} from '@superdemo/contracts';
import { Prisma, chunk, embed, keywordsOf } from '@superdemo/db';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { EnrichmentService } from '../integrations/enrichment/enrichment.service';
import { ScraperService } from '../integrations/enrichment/scraper.service';
import { OutboxService } from '../outbox/outbox.service';
import { CurrentUser, Platform, Roles } from '../auth/guards';
import { ZodBody } from '../shared/zod.pipe';
import type { Industry, SessionUser, ThemePreset } from '@superdemo/contracts';

/**
 * The superadmin's entire surface — deliberately one controller for one page.
 *
 * @Platform marks every route here as the only place a SUPERADMIN may write;
 * the guard refuses their non-GET requests anywhere else. @Roles keeps tenant
 * admins out, so the two decorators together are the whole access rule.
 */
@Platform()
@Roles('SUPERADMIN')
@Controller('platform')
export class PlatformController {
  private readonly log = new Logger(PlatformController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly tenants: TenantContext,
    private readonly knowledge: KnowledgeService,
    private readonly enrichment: EnrichmentService,
    private readonly scraper: ScraperService,
    private readonly outbox: OutboxService,
  ) {}

  /* ============================ organisations ============================= */

  @Get('orgs')
  async orgs(): Promise<OrgSummary[]> {
    // Platform scope (orgId null in context) so these counts span every centre
    // — including while the operator is viewing one of them, when the request
    // would otherwise carry an X-Org-Id and scope itself.
    return this.tenants.runAs(null, null, async () => {
      const orgs = await this.prisma.organization.findMany({
        orderBy: { createdAt: 'asc' },
        include: { site: { select: { template: true, isPublished: true } } },
      });

      // Group-bys instead of N×per-org round trips: this page grows with the
      // number of tenants, and a query per org is how it would get slow first.
      const [users, queues, conversations, numbers, lastLogins, siteLeads] = await Promise.all([
        this.prisma.user.groupBy({ by: ['orgId', 'role'], _count: { _all: true } }),
        this.prisma.queue.groupBy({ by: ['orgId'], _count: { _all: true } }),
        this.prisma.conversation.groupBy({ by: ['orgId'], _count: { _all: true } }),
        this.prisma.phoneNumber.groupBy({ by: ['orgId'], _count: { _all: true } }),
        this.prisma.user.groupBy({ by: ['orgId'], _max: { lastLoginAt: true } }),
        this.prisma.siteLead.groupBy({ by: ['orgId'], _count: { _all: true } }),
      ]);

      const sum = (
        rows: { orgId: string | null; _count: { _all: number } }[],
        orgId: string,
      ): number =>
        rows.filter((r) => r.orgId === orgId).reduce((n, r) => n + r._count._all, 0);

      return orgs.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        industry: org.industry,
        themePreset: org.themePreset as ThemePreset,
        themeTokens: (org.themeTokens as OrgSummary['themeTokens']) ?? null,
        logoUrl: org.logoUrl,
        tagline: org.tagline,
        timezone: org.timezone,
        isActive: org.isActive,
        createdAt: org.createdAt,
        site: org.site
          ? {
              template: org.site.template,
              isPublished: org.site.isPublished,
              leads: sum(siteLeads, org.id),
            }
          : null,
        counts: {
          users: sum(users, org.id),
          admins: users
            .filter((u) => u.orgId === org.id && u.role === 'ADMIN')
            .reduce((n, u) => n + u._count._all, 0),
          queues: sum(queues, org.id),
          conversations: sum(conversations, org.id),
          numbers: sum(numbers, org.id),
        },
        lastLoginAt: lastLogins.find((l) => l.orgId === org.id)?._max.lastLoginAt ?? null,
      }));
    });
  }

  /**
   * Create a centre and its first admin together.
   *
   * One transaction: an org with no admin is unreachable, so a half-finished
   * create would leave a tenant nobody — not even the superadmin, who cannot
   * write inside a tenant — could ever set up.
   */
  @Post('orgs')
  @HttpCode(201)
  async createOrg(
    @ZodBody(CreateOrgInput) body: CreateOrgInput,
    @CurrentUser() actor: SessionUser,
  ) {
    const slug = body.slug ?? slugify(body.name);
    if (!slug) throw new BadRequestException('Could not derive a handle from that name');
    // The handle is also the landing page's path, so it cannot collide with one
    // of the dashboard's own routes — see RESERVED_SLUGS.
    if (isReservedSlug(slug)) {
      throw new BadRequestException(
        `"${slug}" is reserved by the platform. Choose a different handle.`,
      );
    }

    // Before anything is written: a URL that cannot be read should fail the form
    // the operator is looking at, not a status field on a centre that now exists.
    if (body.websiteUrl) await this.scraper.assertReadable(body.websiteUrl);

    return this.tenants.runAs(null, actor.id, async () => {
      const [slugTaken, emailTaken] = await Promise.all([
        this.prisma.organization.findUnique({ where: { slug }, select: { id: true } }),
        this.prisma.user.findUnique({
          where: { email: body.admin.email.toLowerCase() },
          select: { id: true },
        }),
      ]);
      if (slugTaken) throw new ConflictException(`The handle "${slug}" is already in use`);
      // Checked before the transaction for a clear message; the unique index is
      // still what guarantees it.
      if (emailTaken) throw new ConflictException(`${body.admin.email} already has an account`);

      const passwordHash = await this.auth.hashPassword(body.admin.password);

      const org = await this.prisma.$transaction(async (tx) => {
        const created = await tx.organization.create({
          data: {
            name: body.name,
            slug,
            industry: body.industry,
            // An unspecified theme follows the vertical rather than defaulting to
            // the platform's own red, so a new clinic does not arrive looking
            // like HireStella's marketing site.
            themePreset: body.themePreset ?? DEFAULT_PRESET_FOR_INDUSTRY[body.industry] ?? 'default',
            timezone: body.timezone,
            // Both optional. A null logo is drawn as a monogram everywhere it
            // appears, which is what makes a name the only thing this form
            // truly needs — see packages/contracts/src/brand.ts.
            logoUrl: body.logoUrl ?? null,
            tagline: body.tagline ?? null,
            websiteUrl: body.websiteUrl ?? null,
            websiteEnabled: body.websiteEnabled,
          },
        });

        const template = INDUSTRY_TEMPLATES[body.industry];

        const admin = await tx.user.create({
          data: {
            orgId: created.id,
            email: body.admin.email.toLowerCase(),
            name: body.admin.name,
            passwordHash,
            role: 'ADMIN',
            location: body.admin.location,
            timezone: LOCATION_TIMEZONES[body.admin.location],
            // Every category, so the first admin can take any call until they
            // hire a team. A one-person centre that routes to nobody is the
            // most likely way a new tenant looks broken on day one.
            skills: ['GENERAL', 'EDUCATION', 'FINANCE', 'MANAGEMENT', 'LANGUAGE'],
            // Nested create, so the tenant extension does not reach it — orgId
            // is passed by hand. See the caveats in packages/db/src/tenant.ts.
            presence: { create: { orgId: created.id, status: 'OFFLINE' } },
          },
        });

        /* ------------------------- provisioning ------------------------- */
        // All of it inside the same transaction as the org: a centre that
        // exists but cannot answer a call is not a centre, and half-provisioned
        // is the state nobody would think to check for.

        const queues = await Promise.all(
          template.queues.map((q) =>
            tx.queue.create({
              data: {
                orgId: created.id,
                name: q.name,
                requiredSkill: q.requiredSkill,
                slaSeconds: q.slaSeconds,
                // The admin staffs every queue for the same reason as above.
                memberships: { create: { orgId: created.id, userId: admin.id } },
              },
            }),
          ),
        );

        const defaultQueue =
          queues.find((q) => q.requiredSkill === template.aiAgent.defaultQueueSkill) ?? queues[0];

        // {{ORG}} rather than a hardcoded name: the greeting and the briefing
        // both have to say who is speaking, and the client will rename itself.
        const withName = (text: string) => text.replaceAll('{{ORG}}', body.name);

        const aiAgent = await tx.aiAgent.create({
          data: {
            orgId: created.id,
            name: template.aiAgent.name,
            greeting: withName(template.aiAgent.greeting),
            systemPrompt: withName(template.aiAgent.systemPrompt),
            escalationRules: template.aiAgent.escalationRules,
            defaultQueueId: defaultQueue?.id ?? null,
          },
        });

        // Starter knowledge, chunked and embedded the same way the knowledge
        // page does it — otherwise the docs exist but the AI cannot retrieve
        // them, which looks identical to the AI being broken.
        for (const doc of template.knowledge) {
          const created_doc = await tx.knowledgeDoc.create({
            data: {
              orgId: created.id,
              title: doc.title,
              category: doc.category,
              source: 'template',
              content: doc.content,
            },
          });
          const pieces = chunk(doc.content);
          await tx.knowledgeChunk.createMany({
            data: pieces.map((piece, ordinal) => {
              const embedText = `${doc.title}\n${piece}`;
              return {
                orgId: created.id,
                docId: created_doc.id,
                ordinal,
                content: piece,
                embedding: embed(embedText),
                keywords: keywordsOf(embedText),
              };
            }),
          });
        }

        // A DID so a test call routes end to end. Mock provider, hence the
        // generated number — real provisioning needs a licensed carrier.
        await tx.phoneNumber.create({
          data: {
            orgId: created.id,
            e164: await this.freeMockNumber(tx),
            label: template.numberLabel,
            provider: 'mock',
            status: 'ASSIGNED',
            inboundQueueId: defaultQueue?.id ?? null,
            aiAgentId: aiAgent.id,
            purchasedAt: new Date(),
          },
        });

        // Every centre needs its own settings row; the admin's settings page
        // reads it on first load and would 404 without this.
        await tx.setting.create({
          data: {
            orgId: created.id,
            instituteName: body.name,
            instituteTimezone: body.timezone,
          },
        });

        // A published landing page, in the same breath as the queues and the
        // number. The page's call button dials the DID created above and its
        // callback form writes into this centre's contacts, so a tenant that is
        // thirty seconds old already demonstrates the whole loop — which is the
        // only reason to ship a landing page from a contact-centre platform.
        //
        // Unless the operator said this client does not want one. Then no row
        // is written at all: an empty Site would still serve a page at the
        // centre's handle, which is the thing being declined.
        const siteTemplate = body.siteTemplate ?? defaultTemplateForIndustry(body.industry);
        if (body.websiteEnabled) {
          await tx.site.create({
            data: {
              orgId: created.id,
              template: siteTemplate,
              style: defaultStyleForIndustry(body.industry),
              content: siteContentForIndustry(body.industry, body.name),
              metaTitle: `${body.name}${body.tagline ? ` · ${body.tagline}` : ''}`,
            },
          });
        }

        /*
         * Enrichment is queued, not run.
         *
         * Reading the client's website, writing copy with an LLM and building a
         * workflow on their Dograh is tens of seconds of somebody else's
         * infrastructure. Doing it here would make creating a centre slow and
         * make it fail when any of those three is having a bad day — and the
         * centre above is already complete and usable without it. The outbox
         * commits the job with the tenant, so it cannot be lost between the two
         * writes, and retries it if Dograh or Anthropic is briefly down.
         */
        if (body.websiteUrl && body.websiteEnabled) {
          /*
           * Overwrite, because there is nothing yet to protect.
           *
           * enqueue defaults to leaving existing copy alone, which is right for
           * a re-run months later and wrong here: the only copy this centre has
           * is the vertical template written milliseconds ago. Defaulting to
           * false meant a brand-new tenant kept "Call us and speak to someone
           * who can help" while the generated page it asked for was discarded.
           */
          await this.enrichment.enqueue(tx, created.id, body.websiteUrl, true);
        }

        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: 'org.create',
            target: created.id,
            metadata: {
              name: body.name,
              slug,
              industry: body.industry,
              adminEmail: body.admin.email.toLowerCase(),
              provisioned: {
                queues: queues.length,
                aiAgent: aiAgent.name,
                knowledgeDocs: template.knowledge.length,
                siteTemplate: body.websiteEnabled ? siteTemplate : null,
                websiteEnabled: body.websiteEnabled,
                websiteUrl: body.websiteUrl ?? null,
              },
            },
          },
        });

        return {
          org: created,
          provisioned: {
            queues: queues.map((q) => q.name),
            aiAgent: aiAgent.name,
            knowledgeDocs: template.knowledge.length,
            siteTemplate,
            /** Relative on purpose: the API does not know the web app's host. */
            sitePath: `/${slug}`,
          },
        };
      });

      // The knowledge index is in memory and per-centre, so the new corpus has
      // to be admitted to it before the AI can retrieve anything.
      await this.tenants.runAs(org.org.id, actor.id, () => this.knowledge.rebuild());

      // Nudge the drainer so a website-backed centre starts enriching now
      // rather than on the next five-second poll. Awaited only far enough to
      // schedule it — notify() defers the work off the request.
      if (body.websiteUrl) await this.outbox.notify();

      return {
        id: org.org.id,
        name: org.org.name,
        slug: org.org.slug,
        industry: org.org.industry,
        provisioned: org.provisioned,
      };
    });
  }

  /**
   * An unused number from the mock range.
   *
   * e164 is globally unique, so this has to check across every centre — hence
   * the unscoped `tx` read rather than a per-org one.
   */
  private async freeMockNumber(tx: Prisma.TransactionClient): Promise<string> {
    for (let attempt = 0; attempt < 50; attempt++) {
      // +9714 is the Dubai landline range; 8xx keeps template numbers visually
      // distinct from the seeded FIT ones.
      const candidate = `+97148${String(100000 + Math.floor(Math.random() * 899999))}`;
      const taken = await tx.phoneNumber.findUnique({
        where: { e164: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
    }
    throw new ConflictException('Could not allocate a number from the mock range');
  }

  @Put('orgs/:id')
  async updateOrg(
    @Param('id') id: string,
    @ZodBody(UpdateOrgInput) body: UpdateOrgInput,
    @CurrentUser() actor: SessionUser,
  ) {
    return this.tenants.runAs(null, actor.id, async () => {
      const existing = await this.prisma.organization.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Organisation not found');

      const org = await this.prisma.organization.update({
        where: { id },
        data: {
          name: body.name,
          timezone: body.timezone,
          isActive: body.isActive,
          themePreset: body.themePreset,
          logoUrl: body.logoUrl,
          tagline: body.tagline,
          websiteEnabled: body.websiteEnabled,
          // undefined leaves it alone; null clears a pasted export so the
          // preset takes over again.
          themeTokens:
            body.themeTokens === undefined
              ? undefined
              : (body.themeTokens ?? Prisma.DbNull),
        },
      });

      /*
       * Switching the website on for a centre created without one has to build
       * the page, or the section appears in their sidebar with nothing behind
       * it and the first thing they see is an empty state they cannot fix.
       *
       * Only when there is no Site at all. A centre that had one, turned it off
       * and turned it back on keeps every word it had written — the flag never
       * deletes content, it only stops it being served.
       */
      if (body.websiteEnabled === true) {
        const site = await this.prisma.site.findUnique({
          where: { orgId: id },
          select: { id: true },
        });
        if (!site) {
          await this.prisma.site.create({
            data: {
              orgId: id,
              template: defaultTemplateForIndustry(existing.industry),
              style: defaultStyleForIndustry(existing.industry),
              content: siteContentForIndustry(existing.industry, org.name),
              metaTitle: `${org.name}${org.tagline ? ` · ${org.tagline}` : ''}`,
            },
          });
        }
      }

      // Deactivating is the destructive-looking action, so record what changed
      // rather than just that something did.
      await this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: body.isActive === false ? 'org.deactivate' : 'org.update',
          target: id,
          metadata: { from: { name: existing.name, isActive: existing.isActive }, to: body },
        },
      });

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        isActive: org.isActive,
        themePreset: org.themePreset as ThemePreset,
      };
    });
  }

  /**
   * Delete a centre and everything in it.
   *
   * Suspending is the right answer for a real client — their history is
   * evidence, and a mis-click must not be able to destroy it. This exists for
   * the other case: building six demo tenants before a meeting means throwing
   * five of them away afterwards, and without a delete they accumulate in the
   * operator's list forever.
   *
   * The slug has to be typed back to confirm, so the destructive path cannot be
   * reached by clicking one button.
   *
   * Deletion is explicit rather than relying on the database: only Setting and
   * Site cascade from Organization. Every other tenant model carries a bare
   * `orgId` column with no foreign key — deliberately, because a relation per
   * model on a 25-model schema buys nothing the tenant extension does not
   * already enforce — so dropping the org row alone would orphan all of it.
   */
  @Delete('orgs/:id')
  async deleteOrg(
    @Param('id') id: string,
    @ZodBody(DeleteOrgInput) body: DeleteOrgInput,
    @CurrentUser() actor: SessionUser,
  ) {
    return this.tenants.runAs(null, actor.id, async () => {
      const org = await this.prisma.organization.findUnique({ where: { id } });
      if (!org) throw new NotFoundException('Organisation not found');
      if (body.confirmSlug !== org.slug) {
        throw new BadRequestException(
          `Type the centre's handle (${org.slug}) to confirm deletion`,
        );
      }

      // Recorded before the deletion, because afterwards there is nothing left
      // to say what was removed. Written at platform scope with no orgId, so it
      // survives the org it describes.
      await this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'org.delete',
          target: id,
          metadata: {
            name: org.name,
            slug: org.slug,
            industry: org.industry,
            createdAt: org.createdAt.toISOString(),
          },
        },
      });

      const counts = await this.prisma.$transaction(async (tx) => {
        const users = await tx.user.findMany({ where: { orgId: id }, select: { id: true } });
        const userIds = users.map((u) => u.id);

        // Children first. Most of these would cascade from their own parent, but
        // listing them keeps the order independent of which cascades exist —
        // and a missing row here shows up as a foreign-key error at once rather
        // than as an orphan nobody notices.
        const removed: Record<string, number> = {};
        const del = async (label: string, run: () => Promise<{ count: number }>) => {
          removed[label] = (await run()).count;
        };

        await del('transcriptSegments', () => tx.transcriptSegment.deleteMany({ where: { orgId: id } }));
        await del('recordings', () => tx.recording.deleteMany({ where: { orgId: id } }));
        await del('messages', () => tx.message.deleteMany({ where: { orgId: id } }));
        await del('callParticipants', () => tx.callParticipant.deleteMany({ where: { orgId: id } }));
        await del('aiSessions', () => tx.aiSession.deleteMany({ where: { orgId: id } }));
        await del('calls', () => tx.call.deleteMany({ where: { orgId: id } }));
        await del('conversations', () => tx.conversation.deleteMany({ where: { orgId: id } }));
        await del('siteLeads', () => tx.siteLead.deleteMany({ where: { orgId: id } }));
        await del('campaignTargets', () => tx.campaignTarget.deleteMany({ where: { orgId: id } }));
        await del('campaigns', () => tx.campaign.deleteMany({ where: { orgId: id } }));
        await del('knowledgeChunks', () => tx.knowledgeChunk.deleteMany({ where: { orgId: id } }));
        await del('knowledgeDocs', () => tx.knowledgeDoc.deleteMany({ where: { orgId: id } }));
        // Before Queue and AiAgent, which it points at.
        await del('phoneNumbers', () => tx.phoneNumber.deleteMany({ where: { orgId: id } }));
        await del('queueMemberships', () => tx.queueMembership.deleteMany({ where: { orgId: id } }));
        await del('queues', () => tx.queue.deleteMany({ where: { orgId: id } }));
        await del('aiAgents', () => tx.aiAgent.deleteMany({ where: { orgId: id } }));
        await del('contacts', () => tx.contact.deleteMany({ where: { orgId: id } }));
        await del('agentStateEvents', () => tx.agentStateEvent.deleteMany({ where: { orgId: id } }));
        await del('agentStates', () => tx.agentState.deleteMany({ where: { orgId: id } }));
        await del('metrics', () => tx.callMetricsDaily.deleteMany({ where: { orgId: id } }));
        await del('crmSyncLogs', () => tx.crmSyncLog.deleteMany({ where: { orgId: id } }));
        await del('outboxEvents', () => tx.outboxEvent.deleteMany({ where: { orgId: id } }));
        await del('auditLogs', () => tx.auditLog.deleteMany({ where: { orgId: id } }));
        // RefreshToken is a platform model keyed by user, not by org — it is the
        // one thing here that orgId would not find. Signs out the whole staff.
        await del('refreshTokens', () =>
          tx.refreshToken.deleteMany({ where: { userId: { in: userIds } } }),
        );
        await del('users', () => tx.user.deleteMany({ where: { orgId: id } }));

        // Setting and Site cascade from here.
        await tx.organization.delete({ where: { id } });
        return removed;
      });

      this.log.warn(
        `deleted centre "${org.name}" (${org.slug}) and ${Object.values(counts).reduce(
          (n, c) => n + c,
          0,
        )} rows`,
      );

      return { deleted: { id, name: org.name, slug: org.slug }, rows: counts };
    });
  }

  /**
   * The admins of one centre, so the operator can see who to contact — and
   * reset a password when a client locks themselves out, which is the one
   * tenant-shaped write a platform operator genuinely needs.
   */
  @Get('orgs/:id/admins')
  async orgAdmins(@Param('id') id: string) {
    return this.tenants.runAs(null, null, () =>
      this.prisma.user.findMany({
        where: { orgId: id, role: 'ADMIN' },
        select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true },
        orderBy: { name: 'asc' },
      }),
    );
  }

  @Post('orgs/:id/admins')
  @HttpCode(201)
  async addOrgAdmin(
    @Param('id') id: string,
    @ZodBody(CreateOrgInput.shape.admin) body: CreateOrgInput['admin'],
    @CurrentUser() actor: SessionUser,
  ) {
    return this.tenants.runAs(null, actor.id, async () => {
      const org = await this.prisma.organization.findUnique({ where: { id } });
      if (!org) throw new NotFoundException('Organisation not found');

      const taken = await this.prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
        select: { id: true },
      });
      if (taken) throw new ConflictException(`${body.email} already has an account`);

      const user = await this.prisma.user.create({
        data: {
          orgId: id,
          email: body.email.toLowerCase(),
          name: body.name,
          passwordHash: await this.auth.hashPassword(body.password),
          role: 'ADMIN',
          location: body.location,
          timezone: LOCATION_TIMEZONES[body.location],
          skills: ['GENERAL'],
          presence: { create: { orgId: id, status: 'OFFLINE' } },
        },
        select: { id: true, name: true, email: true },
      });

      await this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'org.admin.create',
          target: user.id,
          metadata: { orgId: id, email: user.email },
        },
      });

      return user;
    });
  }
}

/** "Northside Dental Clinic" → "northside-dental-clinic". */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

