import { BadRequestException, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import {
  DOGRAH_AGENT_NAME,
  DograhPublic,
  SiteContent,
  dograhOffersWidget,
  type EnrichStatus,
  type EnrichmentView,
  type GeneratedCentre,
  type Industry,
} from '@superdemo/contracts';
import { Prisma } from '@superdemo/db';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxService } from '../../outbox/outbox.service';
import { TenantContext } from '../../tenancy/tenant-context.service';
import { DograhService } from '../dograh/dograh.service';
import { ScraperService } from './scraper.service';
import { GeneratorService } from './generator.service';

const DEFAULT_SECTIONS: SiteContent['sections'] = [
  'highlights',
  'services',
  'proof',
  'faq',
  'contact',
];

/**
 * Which sections a page shows, in the order the designs expect.
 *
 * Order is fixed rather than tenant-editable now: the templates are ports of
 * finished designs, and each one's flow is part of what was ported. What stays
 * per-tenant is *which* of them appear, and that is decided by what the scrape
 * found — a pricing band exists only for a business that publishes prices.
 *
 * A key already in `current` is kept whatever the flags say, so a section
 * someone turned on by hand is not turned off by a thinner re-scrape.
 */
const SECTION_ORDER: SiteContent['sections'] = [
  'highlights',
  'services',
  'steps',
  'gallery',
  'proof',
  'testimonials',
  'pricing',
  'comparison',
  'faq',
  'contact',
];

function sectionsFor(opts: {
  current?: SiteContent['sections'];
  steps: boolean;
  gallery: boolean;
  testimonials: boolean;
  pricing: boolean;
  comparison: boolean;
}): SiteContent['sections'] {
  const had = new Set(opts.current ?? []);
  const optional: Record<string, boolean> = {
    steps: opts.steps,
    gallery: opts.gallery,
    testimonials: opts.testimonials,
    pricing: opts.pricing,
    comparison: opts.comparison,
  };
  return SECTION_ORDER.filter((key) =>
    key in optional ? optional[key] || had.has(key) : true,
  );
}

/** "Advanced Healthcare LLC" -> "Advanced Healthcare", for a label. */
function orgNameShort(name: string): string {
  return name.replace(/\b(LLC|Ltd|Limited|Inc|FZE|FZCO|LLP|PLC)\b\.?/gi, '').trim() || name;
}

/** The event the create-centre transaction emits. Drained by this service. */
export const ENRICH_EVENT = 'centre.enrich';

/**
 * Website → landing page + voice agent, in the background.
 *
 * Runs off the transactional outbox rather than a fresh queue, which buys three
 * things this needs and a `setImmediate` would not: it commits with the centre
 * so an enrichment can never be lost between the two writes, it retries with
 * backoff when the client's Dograh or Anthropic is briefly unreachable, and it
 * survives an API restart mid-run.
 *
 * ## Ordering, and why it is this way round
 *
 * Scrape, generate, write the page, then build the agent. The page is written
 * before the agent is attempted because it is the half that cannot fail on
 * someone else's infrastructure — so a centre whose Dograh is misconfigured
 * still ends up with a real landing page about the real business, rather than
 * losing both to one error.
 *
 * ## What it will not do
 *
 * Overwrite copy a person has edited, unless explicitly told to. Enrichment
 * runs once at creation, and a retry after a failure defaults to leaving
 * existing content alone — regenerating over someone's writing should take a
 * deliberate second click, not be the default of a button labelled "retry".
 */
@Injectable()
export class EnrichmentService implements OnModuleInit {
  private readonly log = new Logger(EnrichmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly tenants: TenantContext,
    private readonly scraper: ScraperService,
    private readonly generator: GeneratorService,
    private readonly dograh: DograhService,
  ) {}

  onModuleInit(): void {
    this.outbox.on(ENRICH_EVENT, async (payload) => {
      const orgId = String(payload.orgId ?? '');
      const websiteUrl = String(payload.websiteUrl ?? '');
      const overwrite = payload.overwriteContent === true;
      if (!orgId || !websiteUrl) return;
      await this.run(orgId, websiteUrl, overwrite);
    });
  }

  /** Queue an enrichment. Called inside the caller's transaction. */
  async enqueue(
    tx: Prisma.TransactionClient,
    orgId: string,
    websiteUrl: string,
    overwriteContent = false,
  ): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        orgId,
        aggregate: 'organization',
        aggregateId: orgId,
        type: ENRICH_EVENT,
        payload: { orgId, websiteUrl, overwriteContent },
      },
    });
    await tx.setting.update({
      where: { orgId },
      data: { enrichStatus: 'queued', enrichSourceUrl: websiteUrl, enrichError: null },
    });
  }

  private async setStatus(
    orgId: string,
    status: EnrichStatus,
    extra: { error?: string | null; enrichedAt?: Date | null } = {},
  ): Promise<void> {
    await this.prisma.setting.updateMany({
      where: { orgId },
      data: {
        enrichStatus: status,
        ...(extra.error !== undefined ? { enrichError: extra.error } : {}),
        ...(extra.enrichedAt !== undefined ? { enrichedAt: extra.enrichedAt } : {}),
      },
    });
  }

  /**
   * The whole pipeline.
   *
   * Throws on failure so the outbox retries it — but records the reason first,
   * because the operator watching the centre page needs the message now and the
   * retry may be minutes away. A failure that is the site's fault (404, no
   * readable text) will simply fail the same way eight times; that is accepted
   * rather than special-cased, since the status carries the reason either way.
   */
  private async run(orgId: string, websiteUrl: string, overwrite: boolean): Promise<void> {
    await this.setStatus(orgId, 'running', { error: null });
    try {
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, slug: true, industry: true, logoUrl: true, tagline: true },
      });
      if (!org) {
        // Deleted while queued. Not an error; there is nothing to enrich.
        this.log.log(`enrich: org ${orgId} is gone — dropping`);
        return;
      }

      const site = await this.scraper.scrape(websiteUrl);
      const generated = await this.generator.generate(site, org.name);

      // Everything below runs as the tenant, because Site and Setting are
      // tenant-scoped and the drainer has no request context of its own.
      await this.tenants.runAs(orgId, null, async () => {
        await this.applyContent(org, generated, site, overwrite);
      });

      // The agent last: see the class comment. A failure here leaves the page.
      const agent = await this.provisionAgent(orgId, generated, site, org.name).catch((e: unknown) => {
        const why = e instanceof Error ? e.message : 'unknown error';
        this.log.warn(`enrich: page written for ${org.slug} but the agent failed — ${why}`);
        return { ok: false as const, detail: why };
      });

      if (agent.ok) {
        await this.setStatus(orgId, 'ready', { error: null, enrichedAt: new Date() });
        this.log.log(`enrich: ${org.slug} ready — page and agent generated from ${site.finalUrl}`);
      } else {
        // Ready-with-a-caveat is recorded as failed *with the page intact*: the
        // operator asked for a page and an agent, and got one of the two.
        await this.setStatus(orgId, 'failed', {
          error: `The landing page was generated. The voice agent was not: ${agent.detail}`,
          enrichedAt: new Date(),
        });
      }
    } catch (e) {
      const why = e instanceof Error ? e.message : 'unknown error';
      await this.setStatus(orgId, 'failed', { error: why });

      /*
       * Retry only what retrying can fix.
       *
       * The outbox retries on throw, eight times with backoff — right for a
       * Dograh that is briefly down or an LLM that returned 529. Wrong for a
       * URL that is not a public address, a site with no readable text or a
       * model refusal: those fail identically every time, and eight rounds of
       * it is wasted work plus eight identical lines in the log. A
       * BadRequestException is this codebase's marker for "the input is the
       * problem", so it is recorded and swallowed.
       */
      if (e instanceof BadRequestException) {
        this.log.warn(`enrich: ${orgId} rejected permanently — ${why}`);
        return;
      }
      this.log.warn(`enrich: ${orgId} failed, will retry — ${why}`);
      throw e;
    }
  }

  /* ---------------------------- the landing page --------------------------- */

  private async applyContent(
    org: { id: string; name: string; industry: string; logoUrl: string | null; tagline: string | null },
    g: GeneratedCentre,
    site: Awaited<ReturnType<ScraperService['scrape']>>,
    overwrite: boolean,
  ): Promise<void> {
    const existing = await this.prisma.site.findFirst({ where: { orgId: org.id } });
    if (!existing) return;

    const current = SiteContent.safeParse(existing.content);
    const base = current.success ? current.data : undefined;

    /**
     * Merge, not replace.
     *
     * The vertical starter content is a complete, valid SiteContent — sections
     * order, CTA kinds, form flags. Regenerating only the parts an LLM can
     * honestly write from a website means the page stays structurally sound
     * even if the model returns fewer services than the template had.
     */
    /*
     * Scraped wins, existing survives.
     *
     * Every field below prefers what the scrape found and falls back to what
     * the page already had — because a model that returns an empty `services`
     * array is telling us it could not read them, not that the business has
     * none. Replacing wholesale meant one thin scrape could blank a page that
     * was previously complete, and a re-run after a site redesign was a
     * coin toss.
     *
     * `keep` is the whole rule, applied uniformly rather than remembered
     * per field.
     */
    const keep = <T,>(scraped: T[] | undefined, existing: T[] | undefined, cap: number): T[] =>
      scraped && scraped.length > 0 ? scraped.slice(0, cap) : (existing ?? []);
    const text = (scraped: string | undefined, existing: string | undefined) =>
      scraped?.trim() || existing || '';

    const next: SiteContent = {
      ...(base ?? SiteContent.parse({ hero: { headline: org.name, primaryCta: { label: 'Call us', kind: 'call' } } })),
      hero: {
        eyebrow: text(g.hero.eyebrow, base?.hero.eyebrow),
        headline: text(g.hero.headline, base?.hero.headline) || org.name,
        subhead: text(g.hero.subhead, base?.hero.subhead),
        primaryCta: {
          label: text(g.hero.ctaLabel, base?.hero.primaryCta.label) || 'Call us',
          kind: base?.hero.primaryCta.kind ?? 'call',
        },
        secondaryCta: base?.hero.secondaryCta ?? null,
      },
      highlights: keep(
        g.highlights.map((h) => ({ title: h.title.slice(0, 60), body: h.body.slice(0, 220) })),
        base?.highlights,
        6,
      ),
      services: keep(
        g.services.map((x) => ({ name: x.name.slice(0, 60), body: x.body.slice(0, 220) })),
        base?.services,
        8,
      ),
      faq: keep(
        g.faq.map((f) => ({ q: f.q.slice(0, 160), a: f.a.slice(0, 600) })),
        base?.faq,
        10,
      ),
      steps: keep(
        g.steps.map((st) => ({ title: st.title.slice(0, 60), body: st.body.slice(0, 200) })),
        base?.steps,
        6,
      ),
      gallery: keep(site.images, base?.gallery, 8),
      testimonials: keep(
        g.testimonials.filter((t) => t.quote.trim() && t.author.trim()),
        base?.testimonials,
        6,
      ),
      pricing: keep(g.pricing.filter((t) => t.name.trim()), base?.pricing, 4),
      comparison:
        g.comparison.before.length > 0 || g.comparison.after.length > 0
          ? {
              beforeLabel: g.comparison.beforeLabel || 'Doing it alone',
              afterLabel: g.comparison.afterLabel || `With ${orgNameShort(org.name)}`,
              before: g.comparison.before.slice(0, 5),
              after: g.comparison.after.slice(0, 5),
            }
          : (base?.comparison ?? {
              beforeLabel: 'Without us',
              afterLabel: 'With us',
              before: [],
              after: [],
            }),
      /*
       * Sections are opted into by what the scrape actually produced.
       *
       * A design that has a pricing band renders nothing where the business
       * publishes no prices, which is the honest outcome — the alternative is
       * an empty band or an invented tier.
       */
      sections: sectionsFor({
        current: base?.sections,
        steps: g.steps.length > 0 || (base?.steps?.length ?? 0) > 0,
        gallery: site.images.length > 0 || (base?.gallery?.length ?? 0) > 0,
        testimonials: g.testimonials.length > 0 || (base?.testimonials?.length ?? 0) > 0,
        pricing: g.pricing.length > 0 || (base?.pricing?.length ?? 0) > 0,
        comparison:
          g.comparison.before.length > 0 ||
          g.comparison.after.length > 0 ||
          (base?.comparison?.before?.length ?? 0) > 0,
      }),
      contact: {
        ...(base?.contact ?? {
          phoneOverride: '',
          email: '',
          address: '',
          hours: '',
          showForm: true,
          formNote: '',
        }),
        // A number found on the client's own site is better than the platform's
        // generated placeholder — but only fills a blank, never replaces one an
        // operator set.
        phoneOverride: base?.contact.phoneOverride || site.phone || '',
      },
    };

    const contentChanged = !base || overwrite || this.looksLikeStarterCopy(base, org.name);
    if (!contentChanged) {
      this.log.log(`enrich: leaving edited copy for ${org.id} alone (overwrite not requested)`);
    }

    await this.prisma.site.update({
      where: { id: existing.id },
      data: {
        ...(contentChanged ? { content: next as unknown as Prisma.InputJsonValue } : {}),
        metaTitle: existing.metaTitle ?? site.title.slice(0, 120) ?? null,
        metaDescription: existing.metaDescription ?? (site.description || g.hero.subhead).slice(0, 300),
      },
    });

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        // The vertical the site actually reads as, which is better than the one
        // an operator guessed from a dropdown before seeing it.
        industry: g.industry as Industry,
        tagline: org.tagline || g.tagline.slice(0, 120),
        logoUrl: org.logoUrl ?? site.imageUrl,
      },
    });

    // Knowledge the agent and the KB search can both answer from.
    await this.applyKnowledge(org.id, g);
  }

  /**
   * Was this copy still the template's, or had someone written over it?
   *
   * Compared against the starter text rather than tracked with a flag, because
   * the flag would have to be set by every path that can edit a page and would
   * be wrong the first time one forgot. The heuristic: starter copy always
   * contains the centre's own name substituted into `{{ORG}}`, and never
   * contains a service list, so a page with services has been worked on.
   */
  private looksLikeStarterCopy(content: SiteContent, orgName: string): boolean {
    if (content.services.length === 0) return true;
    return content.hero.headline.includes(orgName) && content.faq.length === 0;
  }

  private async applyKnowledge(orgId: string, g: GeneratedCentre): Promise<void> {
    if (g.knowledge.length === 0) return;
    // Additive: the vertical placeholders stay until a person deletes them, and
    // a re-run replaces only what a previous run of this added.
    await this.prisma.knowledgeDoc.deleteMany({
      where: { orgId, title: { startsWith: 'From the website — ' } },
    });
    for (const note of g.knowledge.slice(0, 6)) {
      await this.prisma.knowledgeDoc.create({
        data: {
          orgId,
          title: `From the website — ${note.title}`.slice(0, 160),
          category: 'GENERAL',
          content: note.content,
        },
      });
    }
    this.log.log(`enrich: stored ${g.knowledge.length} website note(s) for ${orgId}`);
  }

  /* ----------------------------- the voice agent --------------------------- */

  /**
   * Build the Dograh agent and point the landing page at it.
   *
   * `inbound` because every one of the three call paths is the agent *receiving*
   * a conversation: a visitor pressing the widget, a caller on the DID, and the
   * demo call, where we place the leg but the agent still answers the human.
   */
  private async provisionAgent(
    orgId: string,
    g: GeneratedCentre,
    site: Awaited<ReturnType<ScraperService['scrape']>>,
    orgName: string,
  ): Promise<{ ok: true } | { ok: false; detail: string }> {
    /*
     * The agent is built from the scrape, not from the model's paraphrase.
     *
     * Dograh's generator reads natural language and does its own distillation —
     * given raw page text it worked out "training institute, admissions,
     * accreditation" unaided. Sending our copywriter's summary instead put a
     * lossy step between the website and the agent, and made the agent fail
     * whenever that copywriter was unavailable. So: the scraper fetches, Dograh
     * interprets, and the model's only remaining job is the landing page.
     *
     * Twelve thousand characters here against seven in the prompt below: this
     * is read once, at build time, by their generator, so its length costs
     * nothing per call.
     */
    const scraped = [
      `BUSINESS: ${orgName}`,
      `WEBSITE: ${site.finalUrl}`,
      site.title ? `TITLE: ${site.title}` : '',
      site.description ? `DESCRIPTION: ${site.description}` : '',
      site.phone ? `PUBLISHED PHONE: ${site.phone}` : '',
      '',
      site.text,
    ]
      .filter(Boolean)
      .join('\n');

    return this.dograh.buildAgentFor(orgId, {
      /*
       * The label Dograh names the workflow after, so it has to read well in
       * the operator's agent list. A page's <title> is often just the brand
       * ("Advanced-hc"), which names the workflow after nothing useful, so the
       * meta description wins where there is one. Scrape-only either way — the
       * copywriter is not in this path.
       */
      useCase: `${orgName} — ${(site.description || site.title || 'enquiries').slice(0, 60)}`.slice(
        0,
        80,
      ),
      activityDescription:
        'Build an inbound phone and chat agent for this business. Everything below is the text of ' +
        "their own website; use it to work out what they do, who contacts them and what those " +
        'people want.\n\n' +
        scraped.slice(0, 12_000),
      greeting: g.agentGreeting,
      businessName: orgName,
      /*
       * The agent's own name, not Dograh's default.
       *
       * "Stella" is the platform's assistant persona and what the landing
       * page's button already says, so an agent introducing itself as Sam
       * contradicts the button a visitor just pressed.
       */
      agentName: DOGRAH_AGENT_NAME,
      /*
       * One stage per thing callers actually ring about — see
       * DograhClient.buildStageGraph for why the graph is built rather than
       * requested.
       */
      stages: g.stages,
      /*
       * The site's own words, in the prompt the agent carries.
       *
       * Capped at 7,000 characters, and that cap is the one real trade-off
       * here: this block is inherited by every node and re-read on every turn,
       * so an unbounded page would slow answers and cost tokens per reply. The
       * head of a scrape is where a business says what it does and the tail is
       * usually footer and legal, so truncating the end loses the least.
       *
       * The phone number and the URL are pinned above it because they are the
       * two things most asked on a call and the most expensive to get wrong.
       */
      facts: [
        site.phone ? `The published phone number is ${site.phone}.` : '',
        `Their website is ${site.finalUrl}.`,
        '',
        "### The business's own website text",
        site.text.slice(0, 7000),
      ]
        .filter(Boolean)
        .join('\n'),
    });
  }

  /* --------------------------------- reads -------------------------------- */

  async view(orgId: string): Promise<EnrichmentView> {
    const [org, setting] = await Promise.all([
      this.prisma.organization.findUnique({ where: { id: orgId }, select: { websiteUrl: true } }),
      this.prisma.setting.findFirst({
        where: { orgId },
        select: {
          enrichStatus: true,
          enrichSourceUrl: true,
          enrichError: true,
          enrichedAt: true,
          dograhPublic: true,
        },
      }),
    ]);
    const pub = DograhPublic.safeParse(setting?.dograhPublic ?? {});
    const dp = pub.success ? pub.data : null;
    return {
      status: (setting?.enrichStatus as EnrichStatus) ?? 'none',
      websiteUrl: org?.websiteUrl ?? null,
      sourceUrl: setting?.enrichSourceUrl ?? null,
      error: setting?.enrichError ?? null,
      enrichedAt: setting?.enrichedAt ?? null,
      workflowId: dp?.workflowId ?? null,
      workflowName: dp?.workflowName || null,
      hasEmbedToken: Boolean(dp?.embedToken && dograhOffersWidget(dp.callMode)),
    };
  }

  /** Re-run for a centre, from the platform page or the website editor. */
  async restart(orgId: string, websiteUrl: string, overwriteContent: boolean): Promise<void> {
    // Rejected here, synchronously, so a bad URL is a 400 the operator sees
    // rather than a status field they have to go and read.
    await this.scraper.assertReadable(websiteUrl);
    await this.prisma.$transaction(async (tx) => {
      await tx.organization.update({ where: { id: orgId }, data: { websiteUrl } });
      await this.enqueue(tx, orgId, websiteUrl, overwriteContent);
    });
    await this.outbox.notify();
  }
}
