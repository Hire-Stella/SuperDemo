import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import {
  type ApiEnv,
  type PublicSiteDto,
  SiteContent,
  type SiteDto,
  type SiteLeadInput,
  type SiteLeadOutput,
  type SiteLeadRow,
  SiteStyle,
  type SiteTemplate,
  type ThemePreset,
  type ThemeTokens,
  type UpdateSiteInput,
  composeE164,
  countryByCode,
  defaultStyleForIndustry,
  defaultTemplateForIndustry,
  isPlausibleNumber,
  siteContentForIndustry,
} from '@superdemo/contracts';
import { Prisma } from '@superdemo/db';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context.service';
import { DograhService } from '../integrations/dograh/dograh.service';
import { ENV } from '../config/config.module';

/**
 * Tenant landing pages.
 *
 * Two callers with very different trust levels share this service: the centre's
 * own admin, whose request already carries a tenant context, and an anonymous
 * visitor, whose request carries nothing at all. The public methods are the ones
 * that enter a tenant context themselves, by slug — everything else assumes the
 * guard already did it.
 *
 * That distinction is the load-bearing part of this file. The Prisma extension
 * scopes by whatever `TenantContext.orgId()` returns, and on a @Public() route
 * that is null, which means *unscoped* rather than *denied*. So a public read
 * that forgot its `runAs` would not fail — it would quietly serve the first
 * matching row from any centre. Every public path below resolves the org first
 * and does its work inside `runAs(org.id, …)`.
 */
@Injectable()
export class SitesService {
  private readonly log = new Logger(SitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantContext,
    private readonly dograh: DograhService,
    @Inject(ENV) private readonly env: ApiEnv,
  ) {}

  /* ============================ tenant-facing ============================= */

  /** The signed-in centre's own page. */
  async mine(): Promise<SiteDto> {
    const orgId = this.tenants.requireOrgId();
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');

    const site = await this.ensureSite(org);
    const [phone, leadCount] = await Promise.all([
      this.assignedNumber(),
      this.prisma.siteLead.count({ where: { siteId: site.id } }),
    ]);

    const content = this.readContent(site.content, org.industry, org.name);

    return {
      template: site.template as SiteTemplate,
      style: this.readStyle(site.style, org.industry),
      isPublished: site.isPublished,
      content,
      metaTitle: site.metaTitle,
      metaDescription: site.metaDescription,
      leadCampaignId: site.leadCampaignId,
      updatedAt: site.updatedAt,
      slug: org.slug,
      name: org.name,
      tagline: org.tagline,
      logoUrl: org.logoUrl,
      themePreset: org.themePreset as ThemePreset,
      phoneE164: content.contact.phoneOverride || phone,
      leadCount,
    };
  }

  async update(body: UpdateSiteInput): Promise<SiteDto> {
    const orgId = this.tenants.requireOrgId();
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');
    await this.ensureSite(org);

    // A campaign named for lead capture must belong to this centre. The
    // extension already guarantees that for the read; this turns "not yours"
    // into a clear message rather than a foreign-key error.
    if (body.leadCampaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: body.leadCampaignId },
        select: { id: true },
      });
      if (!campaign) throw new BadRequestException('That campaign does not exist in this centre');
    }

    await this.prisma.site.update({
      where: { orgId },
      data: {
        template: body.template,
        style: body.style ? SiteStyle.parse(body.style) : undefined,
        isPublished: body.isPublished,
        content: body.content ? SiteContent.parse(body.content) : undefined,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        leadCampaignId: body.leadCampaignId,
      },
    });

    /**
     * Identity and palette live on the Organization but are edited here.
     *
     * The app shell, the login page and the landing page all need them, so the
     * Organization is the right home — but "what our brand looks like" is one
     * decision, and having the Website page tell an admin to ask their provider
     * for a colour change was the wrong split. A tenant admin now owns it.
     *
     * Note the scope: changing the preset re-themes this centre's entire
     * dashboard, not just its public page. The editor says so.
     */
    if (
      body.logoUrl !== undefined ||
      body.tagline !== undefined ||
      body.themePreset !== undefined ||
      body.themeTokens !== undefined
    ) {
      await this.prisma.organization.update({
        where: { id: orgId },
        data: {
          logoUrl: body.logoUrl,
          tagline: body.tagline,
          themePreset: body.themePreset,
          // undefined leaves a pasted export alone; null clears it so the
          // preset takes over again.
          themeTokens:
            body.themeTokens === undefined ? undefined : (body.themeTokens ?? Prisma.DbNull),
        },
      });
    }

    return this.mine();
  }

  /** Captured callbacks, newest first. */
  async leads(limit = 50): Promise<SiteLeadRow[]> {
    const rows = await this.prisma.siteLead.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phoneE164: r.phoneE164,
      email: r.email,
      message: r.message,
      source: r.source,
      queuedToCampaign: Boolean(r.targetId),
      contactId: r.contactId,
      createdAt: r.createdAt,
    }));
  }

  /* ============================ public-facing ============================= */

  /**
   * A landing page for an anonymous visitor.
   *
   * Returns null rather than throwing for every "no page here" case — an
   * unknown slug, a deactivated centre, an unpublished page — so the caller
   * renders one 404 and a probe cannot tell which of the three it hit.
   */
  async publicBySlug(slug: string): Promise<PublicSiteDto | null> {
    // Organization is a platform model, so this read needs no context. It is
    // also the only thing that decides which context the rest of this runs in.
    const org = await this.prisma.organization.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (!org || !org.isActive) return null;

    return this.tenants.runAs(org.id, null, async () => {
      const site = await this.ensureSite(org);
      if (!site.isPublished) return null;

      const content = this.readContent(site.content, org.industry, org.name);
      const phone = content.contact.phoneOverride || (await this.assignedNumber());

      return {
        slug: org.slug,
        name: org.name,
        tagline: org.tagline,
        logoUrl: org.logoUrl,
        industry: org.industry,
        template: site.template as SiteTemplate,
        style: this.readStyle(site.style, org.industry),
        themePreset: org.themePreset as ThemePreset,
        themeTokens: (org.themeTokens as ThemeTokens | null) ?? null,
        content,
        phoneE164: phone,
        metaTitle: site.metaTitle,
        metaDescription: site.metaDescription,
        acceptsLeads: content.contact.showForm,
        dograh: await this.dograh.widgetFor(org.id),
      } satisfies PublicSiteDto;
    });
  }

  /**
   * A callback request from a landing page.
   *
   * The one place on the platform where an unauthenticated request creates rows
   * inside a tenant, so the constraints are all here rather than spread about:
   * the org is resolved from the slug and never from the body, the number is
   * normalised before anything is written, a filled honeypot is accepted and
   * discarded, and an existing opt-out is respected even though the visitor just
   * asked to be called.
   */
  async captureLead(
    slug: string,
    input: SiteLeadInput,
    meta: { ip?: string; userAgent?: string },
  ): Promise<SiteLeadOutput> {
    const accepted: SiteLeadOutput = {
      ok: true,
      message: 'Thank you — we have your number and someone will call you back.',
    };

    // A bot filled the hidden field. Return the same success a person gets: a
    // 400 here would only tell a scraper which field to leave alone next time.
    if (input.company && input.company.trim() !== '') return accepted;

    const org = await this.prisma.organization.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (!org || !org.isActive) throw new NotFoundException('No page here');

    const country = countryByCode(input.country);
    const phoneE164 = composeE164(country, input.phone);
    if (!isPlausibleNumber(country, phoneE164)) {
      throw new BadRequestException(
        `That does not look like a ${country.name} number. Include the area code, e.g. ${country.example}.`,
      );
    }

    return this.tenants.runAs(org.id, null, async () => {
      const site = await this.ensureSite(org);
      const content = this.readContent(site.content, org.industry, org.name);
      if (!site.isPublished || !content.contact.showForm) {
        throw new NotFoundException('No page here');
      }

      // findFirst then create rather than upsert: the compound unique is
      // (orgId, phoneE164) and the extension injects orgId at the top level of
      // `where`, which an upsert's unique input would not accept. Two queries,
      // no cleverness. A race between two submissions of the same number loses
      // one contact row to the unique index, which is the correct outcome.
      const existing = await this.prisma.contact.findFirst({ where: { phoneE164 } });
      const contact = existing
        ? await this.prisma.contact.update({
            where: { id: existing.id },
            // Never overwrite a name we already have with a form entry; fill a
            // blank one. The CRM is the record of who someone is, not this form.
            data: {
              name: existing.name ?? input.name,
              email: existing.email ?? (input.email || null),
            },
          })
        : await this.prisma.contact.create({
            data: { phoneE164, name: input.name, email: input.email || null },
          });

      /**
       * An opt-out is not revoked by a web form.
       *
       * Someone who asked not to be called has that recorded against their
       * number, and a form anybody can submit with anybody's number is not
       * evidence they changed their mind. So the lead is kept — it is a genuine
       * enquiry and the centre should see it — but the dialler is not pointed at
       * them. A human decides, from the leads list, where they can see the
       * opt-out next to the request.
       */
      const suppressed = contact.doNotCall;

      /**
       * When the page's callback path is Dograh, Dograh does the dialling.
       *
       * Both this and a running campaign ring the same number, so doing both
       * would call a visitor twice seconds apart from two different systems —
       * worse than either alone. Dograh wins because it is the thing the admin
       * pointed this page at; the campaign remains the path for pages that have
       * no Dograh connected.
       *
       * An opt-out still suppresses it: ringVisitor is never reached for a
       * doNotCall contact, so connecting Dograh cannot quietly undo a
       * suppression the internal dialler respects.
       */
      const ringing = suppressed ? false : await this.dograh.ringVisitor(org.id, phoneE164);

      let targetId: string | null = null;
      // Queued only when the centre nominated a campaign *and* it is running —
      // see queueToCampaign. Otherwise the lead is captured and a human works it.
      if (site.leadCampaignId && !suppressed && !ringing) {
        targetId = await this.queueToCampaign(site.leadCampaignId, contact.id);
      }

      const lead = await this.prisma.siteLead.create({
        data: {
          siteId: site.id,
          name: input.name,
          phoneE164,
          email: input.email || null,
          message: input.message || null,
          source: input.source,
          contactId: contact.id,
          targetId,
          userAgent: meta.userAgent?.slice(0, 300) ?? null,
          ipHash: this.hashIp(meta.ip),
        },
      });

      this.log.log(
        `site lead ${lead.id} for ${org.slug}: ${phoneE164}` +
          (ringing
            ? ' → Dograh is calling'
            : targetId
              ? ' → queued to campaign'
              : suppressed
                ? ' → held (opted out)'
                : ' → captured'),
      );

      const firstName = input.name.split(/\s+/)[0];
      if (ringing) {
        return {
          ok: true,
          message: `Thank you, ${firstName} — we are calling you now, so please keep your phone to hand.`,
        };
      }
      return targetId
        ? {
            ok: true,
            message: `Thank you, ${firstName} — you are in the queue and we will call you shortly.`,
          }
        : accepted;
    });
  }

  /* ================================ helpers =============================== */

  /**
   * The centre's site, created on first access if it has none.
   *
   * Lazily rather than by migration, because the alternative is that every
   * centre created before this feature existed has no page until someone
   * remembers to run a backfill — and the whole point of provisioning a page
   * with the tenant is that nobody has to remember anything. Creating it on read
   * is a write on a GET, which is worth one comment and no more.
   */
  private async ensureSite(org: {
    id: string;
    name: string;
    industry: SiteIndustry;
  }): Promise<SiteRow> {
    const found = await this.prisma.site.findUnique({ where: { orgId: org.id } });
    if (found) return found;

    this.log.log(`provisioning a landing page for ${org.name} on first access`);
    return this.prisma.site.create({
      data: {
        orgId: org.id,
        template: defaultTemplateForIndustry(org.industry),
        style: defaultStyleForIndustry(org.industry),
        content: siteContentForIndustry(org.industry, org.name),
      },
    });
  }

  /**
   * Content, or freshly generated defaults.
   *
   * `safeParse` rather than `parse`: this column is JSON, so a shape change in
   * sites.ts would otherwise turn every existing page into a 500. Falling back
   * to the industry defaults loses edits, which is bad — but a page that
   * renders is recoverable and one that throws is not, and the log line says
   * which centre to look at.
   */
  private readContent(raw: unknown, industry: SiteIndustry, name: string): SiteContent {
    const parsed = SiteContent.safeParse(raw);
    if (parsed.success) return parsed.data;
    this.log.warn(
      `stored site content for "${name}" did not match the current shape — serving defaults`,
    );
    return siteContentForIndustry(industry, name);
  }

  /**
   * The style, or the vertical's default.
   *
   * Null is the normal state for every page created before styles existed, so
   * this is a fallback rather than error handling — and it means adding a fifth
   * axis later gives every existing page a sane value for it instead of a crash.
   */
  private readStyle(raw: unknown, industry: SiteIndustry): SiteStyle {
    const parsed = SiteStyle.safeParse(raw);
    return parsed.success ? parsed.data : defaultStyleForIndustry(industry);
  }

  /** The DID the page's call button should dial. */
  private async assignedNumber(): Promise<string | null> {
    const number = await this.prisma.phoneNumber.findFirst({
      where: { status: 'ASSIGNED' },
      orderBy: { purchasedAt: 'asc' },
      select: { e164: true },
    });
    return number?.e164 ?? null;
  }

  /**
   * Add a captured lead to the campaign the centre nominated.
   *
   * Only for a RUNNING campaign: queueing into a paused or draft list would
   * mean a visitor who was told "we will call you shortly" waits for someone to
   * press start. Returns null when it did not queue, which is what the
   * visitor-facing message keys off.
   */
  private async queueToCampaign(campaignId: string, contactId: string): Promise<string | null> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true, name: true },
    });
    if (!campaign || campaign.status !== 'RUNNING') return null;

    const existing = await this.prisma.campaignTarget.findFirst({
      where: { campaignId, contactId },
    });
    if (existing) {
      // Already on the list. Re-arm it rather than adding a duplicate: they have
      // asked twice, so a target that was exhausted or failed should ring again.
      if (existing.status === 'PENDING') return existing.id;
      const rearmed = await this.prisma.campaignTarget.update({
        where: { id: existing.id },
        data: { status: 'PENDING', nextAttemptAt: null, lastError: null },
      });
      return rearmed.id;
    }

    const target = await this.prisma.campaignTarget.create({
      data: { campaignId, contactId, status: 'PENDING' },
    });
    return target.id;
  }

  /**
   * A stable, non-reversing handle for the submitter's IP.
   *
   * Kept for abuse triage — spotting one address filing forty leads — and
   * nothing else, so it is hashed rather than stored. HMAC with a secret the
   * deployment already requires, and a domain-separation prefix so this value
   * cannot be compared against a hash computed for any other purpose. Honest
   * caveat: the IPv4 space is small enough to enumerate given the key, so this
   * protects against a leaked *database*, not a leaked key.
   */
  private hashIp(ip: string | undefined): string | null {
    if (!ip) return null;
    return createHmac('sha256', this.env.JWT_ACCESS_SECRET)
      .update(`site-lead-ip:${ip}`)
      .digest('hex')
      .slice(0, 32);
  }
}

/* Local shapes, so this file does not import Prisma's generated types just to
   describe two rows it already has in hand. */
type SiteIndustry = Parameters<typeof siteContentForIndustry>[0];
interface SiteRow {
  id: string;
  template: string;
  style: unknown;
  isPublished: boolean;
  content: unknown;
  metaTitle: string | null;
  metaDescription: string | null;
  leadCampaignId: string | null;
  updatedAt: Date;
}
