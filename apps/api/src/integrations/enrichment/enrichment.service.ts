import { BadRequestException, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import {
  DEFAULT_STAGES,
  DEMO_DIALER_KINDS,
  DemoDialerKind,
  DOGRAH_AGENT_NAME,
  DograhPublic,
  SiteContent,
  dograhOffersWidget,
  type EnrichStatus,
  type EnrichmentView,
  type GeneratedCentre,
  type ScrapedSite,
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

/** A title for a page that had none: its path, or the URL as given. */
function pageLabel(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname && u.pathname !== '/' ? u.pathname : u.hostname;
  } catch {
    return url;
  }
}

/* --------------------------- fitting to the page -------------------------- */

/**
 * Shorten to `max` characters at a word boundary, marking the cut with '…'.
 *
 * The ellipsis counts towards `max`, so the result always fits. A cut that
 * would land in the first half of the string (one very long word) is made
 * mid-word instead — a headline cut to two letters is worse than a split word.
 */
export function trimWords(s: string, max: number): string {
  if (s.length <= max) return s;
  if (max <= 1) return s.slice(0, max);
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  const head = space >= Math.floor(max / 2) ? cut.slice(0, space) : cut;
  return `${head.replace(/[\s,;:.\-–—]+$/u, '')}…`;
}

/**
 * The few zod v3 internals the fitter reads.
 *
 * Typed structurally rather than imported, because the schema instance comes
 * from @superdemo/contracts' copy of zod, and a type import from this app's
 * copy would be a different nominal type the day the two versions drift.
 */
type ZodLike = {
  _def: {
    typeName?: string;
    innerType?: ZodLike;
    schema?: ZodLike;
    type?: ZodLike;
    checks?: { kind: string; value?: number }[];
    maxLength?: { value: number } | null;
    shape?: Record<string, ZodLike> | (() => Record<string, ZodLike>);
  };
  safeParse(v: unknown): { success: boolean };
};

/**
 * Trim a value to whatever a zod schema allows, rather than reject it.
 *
 * Walks the schema alongside the value: strings longer than their `.max()`
 * are cut at a word, arrays lose the items that still do not parse (an empty
 * service name, a quote with no text) and are then cut to their `.max()`.
 * Anything it does not recognise is passed through for safeParse to judge.
 *
 * Derived from the schema rather than a table of constants so that the ~50
 * limits in SiteContent (packages/contracts/src/sites.ts) cannot drift from
 * the code that respects them. Model copy is uncapped (see GeneratedCentre);
 * this is the one place it is made to fit.
 */
export function fitToSchema(schema: ZodLike, value: unknown): unknown {
  const def = schema._def;
  switch (def.typeName) {
    case 'ZodDefault':
    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodCatch':
      return value === undefined || value === null || !def.innerType
        ? value
        : fitToSchema(def.innerType, value);
    case 'ZodEffects':
      return def.schema ? fitToSchema(def.schema, value) : value;
    case 'ZodString': {
      if (typeof value !== 'string') return value;
      const max = def.checks?.find((c) => c.kind === 'max')?.value;
      return max === undefined ? value : trimWords(value, max);
    }
    case 'ZodArray': {
      const item = def.type;
      if (!Array.isArray(value) || !item) return value;
      const kept = value.map((v) => fitToSchema(item, v)).filter((v) => item.safeParse(v).success);
      const max = def.maxLength?.value;
      return max === undefined ? kept : kept.slice(0, max);
    }
    case 'ZodObject': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
      const shape = (typeof def.shape === 'function' ? def.shape() : def.shape) ?? {};
      const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
      for (const [key, field] of Object.entries(shape)) {
        if (key in out) out[key] = fitToSchema(field, out[key]);
      }
      return out;
    }
    default:
      return value;
  }
}

/** A draft landing page, trimmed to SiteContent's limits. Still safeParse it. */
export function fitToPage(draft: unknown): unknown {
  return fitToSchema(SiteContent as unknown as ZodLike, draft);
}

/* ------------------------------ agent helpers ----------------------------- */

/** What an operator is told when there is no Dograh to build on. */
export const DOGRAH_NOT_CONNECTED =
  'Dograh is not connected for this centre — set the host and key in the platform Voice ' +
  'panel; the agents will build automatically once it is saved.';

/**
 * Most stages a built graph carries, and what a longer list is folded into.
 *
 * Every stage is a node cross-linked to every other, so edges grow with the
 * square of the count, and each one is a routing condition the agent weighs
 * on every turn. A site with twenty services produces twenty stages; six is
 * where the graph stops being a switchboard and starts being a maze.
 */
const MAX_STAGES = 6;

/**
 * Keep the first five stages, fold the rest into one "Other services" stage.
 *
 * Folded rather than dropped: the caller who rings about the eleventh service
 * still has to land somewhere that knows it exists, so the merged stage's
 * routing names all of them and its instructions carry each one's purpose.
 */
export function foldStages(stages: GeneratedCentre['stages']): GeneratedCentre['stages'] {
  if (stages.length <= MAX_STAGES) return stages;
  const kept = stages.slice(0, MAX_STAGES - 1);
  const rest = stages.slice(MAX_STAGES - 1);
  const names = rest.map((s) => s.name);
  const list = `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
  return [
    ...kept,
    {
      name: 'Other services',
      purpose:
        `Help callers with any of: ${names.join(', ')}. ` +
        rest.map((s) => `${s.name} — ${s.purpose}`).join(' '),
      routeWhen: `the caller asks about ${list}`,
    },
  ];
}

/**
 * Would trying again plausibly work?
 *
 * DograhService reports failures as strings rather than typed errors, so this
 * reads the message: DograhClient words a network failure or timeout as
 * "Could not reach …" and an HTTP refusal as "Dograh refused the request
 * (status…)". Unreachable, 429 and 5xx are worth the outbox's retries; a 4xx,
 * a missing key or an invalid workflow fails identically every time.
 */
export function isTransientAgentFailure(detail: string): boolean {
  return /could not reach|timed? ?out|timeout|aborted|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|fetch failed|socket hang up|\((?:429|5\d\d)\b/i.test(
    detail,
  );
}

/** The event the create-centre transaction emits. Drained by this service. */
export const ENRICH_EVENT = 'centre.enrich';

/** Builds the demo-call agents for a centre that already exists. */
export const BUILD_AGENTS_EVENT = 'centre.build-agents';

/**
 * Website → landing page + voice agent, in the background.
 *
 * Runs off the transactional outbox rather than a fresh queue, which buys three
 * things this needs and a `setImmediate` would not: it commits with the centre
 * so an enrichment can never be lost between the two writes, it retries with
 * backoff when the client's Dograh or Anthropic is briefly unreachable, and it
 * survives an API restart mid-run.
 *
 * ## Two halves, and why neither can stop the other
 *
 * The page half — scrape, generate, write the landing page — and the agent
 * half — build the Dograh agents for the page and the demo calls. The page is
 * attempted first because it is the half that cannot fail on someone else's
 * infrastructure, so a centre whose Dograh is misconfigured still gets a real
 * landing page about the real business.
 *
 * They used to be one chain, and any throw in the page half (a site that
 * would not load, a model answer one service too long) silently cost the
 * centre its demo agents too. Now the page half is best-effort and only
 * records what went wrong; the agent half always runs, from the scrape when
 * there is one and from the centre's own copy when there is not — the same
 * fallback the "Build agents" button uses.
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
      const rebuild = payload.rebuildAgents === true;
      // Events queued before slots were choosable carry no list: all three.
      const kinds = DemoDialerKind.array().safeParse(payload.demoCallKinds);
      if (!orgId || !websiteUrl) return;
      await this.run(orgId, websiteUrl, overwrite, kinds.success ? kinds.data : [...DEMO_DIALER_KINDS], rebuild);
    });
    this.outbox.on(BUILD_AGENTS_EVENT, async (payload) => {
      const orgId = String(payload.orgId ?? '');
      const kinds = DemoDialerKind.array().safeParse(payload.demoCallKinds);
      if (!orgId) return;
      await this.buildAgents(orgId, kinds.success ? kinds.data : [...DEMO_DIALER_KINDS]);
    });
  }

  /** Queue an enrichment. Called inside the caller's transaction. */
  async enqueue(
    tx: Prisma.TransactionClient,
    orgId: string,
    websiteUrl: string,
    overwriteContent = false,
    demoCallKinds: DemoDialerKind[] = [...DEMO_DIALER_KINDS],
    rebuildAgents = false,
  ): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        orgId,
        aggregate: 'organization',
        aggregateId: orgId,
        type: ENRICH_EVENT,
        payload: { orgId, websiteUrl, overwriteContent, demoCallKinds, rebuildAgents },
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
   * The whole pipeline: the page half, then the agent half. See the class
   * comment for why the second always runs.
   *
   * Retries only what retrying can fix. The outbox retries on throw, eight
   * times with backoff — right for a Dograh that is briefly down or rate
   * limiting, wrong for a site that will not load, a model that wrote
   * nonsense, or a centre with no Dograh configured. So the page half never
   * throws, and the agent half throws only for a transient Dograh failure
   * (unreachable, timeout, 429, 5xx). Everything else is recorded on the
   * status and swallowed. A retry is safe because agents are built with
   * `reuseInbound`, so the second attempt does not duplicate the first's.
   *
   * The reason is always recorded before any throw, because the operator
   * watching the centre page needs the message now and the retry may be
   * minutes away.
   */
  private async run(
    orgId: string,
    websiteUrl: string,
    overwrite: boolean,
    kinds: DemoDialerKind[],
    rebuild = false,
  ): Promise<void> {
    await this.setStatus(orgId, 'running', { error: null });
    let retry: Error | null = null;
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

      /*
       * The page half. Best effort: every failure is caught, logged and kept
       * for the status message, and the agent half runs regardless.
       *
       * The scrape is shared — it is also the agent's best source — so it is
       * attempted even when there turns out to be no Site row to write to;
       * applyContent is what checks for one. The model cannot fail this half
       * any more (generateOrFallback falls back to the site's own words), but
       * it is inside the same guard in case that ever stops being true.
       */
      let scraped: ScrapedSite | null = null;
      let generated: GeneratedCentre | null = null;
      let pageProblem: string | null = null;
      try {
        scraped = await this.scraper.scrape(websiteUrl);
      } catch (e) {
        pageProblem = `the website could not be read (${e instanceof Error ? e.message : String(e)})`;
        this.log.warn(`enrich: ${org.slug} ${pageProblem} — building agents from the centre's own copy`);
      }
      if (scraped) {
        const site = scraped;
        try {
          const g = await this.generator.generateOrFallback(site, org.name);
          generated = g;
          // As the tenant, because Site and Setting are tenant-scoped and the
          // drainer has no request context of its own.
          await this.tenants.runAs(orgId, null, () => this.applyContent(org, g, site, overwrite));
        } catch (e) {
          pageProblem = `the landing page could not be written (${e instanceof Error ? e.message : String(e)})`;
          this.log.warn(`enrich: ${org.slug} ${pageProblem}`);
        }
      }

      // The agent half. Always runs; see the class comment.
      const agents = await this.buildAgentHalf(orgId, org, scraped, generated, kinds, { rebuild });

      if (agents.ok) {
        await this.setStatus(orgId, 'ready', { error: null, enrichedAt: new Date() });
        if (pageProblem) {
          this.log.warn(`enrich: ${org.slug} ready — agents built, but ${pageProblem}`);
        } else {
          this.log.log(`enrich: ${org.slug} ready — page and agents generated from ${scraped?.finalUrl}`);
        }
      } else {
        // Recorded as failed even with the page intact: the operator asked for
        // a page and agents, and the message says which half did not happen.
        await this.setStatus(orgId, 'failed', {
          error:
            (pageProblem
              ? `The landing page was not updated: ${pageProblem}. `
              : 'The landing page was generated. ') +
            `The voice agents were not all built: ${agents.detail}`,
          enrichedAt: new Date(),
        });
        if (agents.transient) {
          this.log.warn(`enrich: ${orgId} agents failed, will retry — ${agents.detail}`);
          retry = new Error(agents.detail);
        } else {
          this.log.warn(`enrich: ${orgId} agents not built, not retrying — ${agents.detail}`);
        }
      }
    } catch (e) {
      const why = e instanceof Error ? e.message : 'unknown error';
      await this.setStatus(orgId, 'failed', { error: why });

      /*
       * Something outside both halves' own guards — the database, most
       * likely. A BadRequestException is this codebase's marker for "the
       * input is the problem", so it is recorded and swallowed; anything else
       * is presumed passing and handed to the outbox to retry.
       */
      if (e instanceof BadRequestException) {
        this.log.warn(`enrich: ${orgId} rejected permanently — ${why}`);
        return;
      }
      this.log.warn(`enrich: ${orgId} failed, will retry — ${why}`);
      throw e;
    }
    // Outside the try, so the message recorded above is not overwritten by
    // the catch's generic one on the way out.
    if (retry) throw retry;
  }

  /* ---------------------------- the landing page --------------------------- */

  private async applyContent(
    org: { id: string; name: string; industry: string; logoUrl: string | null; tagline: string | null },
    g: GeneratedCentre,
    site: ScrapedSite,
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
     * per field. It no longer caps: the model's copy is uncapped, and
     * fitToPage below trims every string and list to what SiteContent allows,
     * read from the schema itself. Items that could not survive that (an
     * empty name) are filtered here first, so a list of only those falls
     * back to the existing one rather than fitting down to nothing.
     */
    const keep = <T,>(scraped: T[] | undefined, existing: T[] | undefined): T[] =>
      scraped && scraped.length > 0 ? scraped : (existing ?? []);
    const text = (scraped: string | undefined, existing: string | undefined) =>
      scraped?.trim() || existing || '';

    const draft = {
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
        g.highlights.filter((h) => h.title.trim()),
        base?.highlights,
      ),
      services: keep(
        g.services.filter((x) => x.name.trim()),
        base?.services,
      ),
      faq: keep(
        g.faq.filter((f) => f.q.trim()),
        base?.faq,
      ),
      steps: keep(
        g.steps.filter((st) => st.title.trim()),
        base?.steps,
      ),
      // A URL cannot be shortened with an ellipsis, so an over-long one is
      // dropped here rather than "fitted" into a broken link.
      gallery: keep((site.images ?? []).filter((u) => u.length <= 400), base?.gallery),
      testimonials: keep(
        g.testimonials.filter((t) => t.quote.trim() && t.author.trim()),
        base?.testimonials,
      ),
      pricing: keep(g.pricing.filter((t) => t.name.trim()), base?.pricing),
      comparison:
        g.comparison.before.length > 0 || g.comparison.after.length > 0
          ? {
              beforeLabel: g.comparison.beforeLabel || 'Doing it alone',
              afterLabel: g.comparison.afterLabel || `With ${orgNameShort(org.name)}`,
              before: g.comparison.before,
              after: g.comparison.after,
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
        gallery: (site.images ?? []).length > 0 || (base?.gallery?.length ?? 0) > 0,
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
        // operator set. Like a URL, a phone number cannot be trimmed, so one
        // longer than the field holds is not used at all.
        phoneOverride:
          base?.contact.phoneOverride ||
          (site.phone && site.phone.length <= 24 ? site.phone : ''),
      },
    };

    /*
     * Fit, then check. fitToPage trims to every limit SiteContent declares;
     * the safeParse is what proves it worked. If something still does not
     * fit — a schema shape the fitter does not know — the page keeps what it
     * had rather than the enrichment failing over a landing-page detail.
     */
    const fitted = SiteContent.safeParse(fitToPage(draft));
    if (!fitted.success) {
      this.log.warn(
        `enrich: generated page for ${org.id} still did not fit SiteContent, keeping the existing ` +
          `content — ${fitted.error.message.slice(0, 500)}`,
      );
    }

    const contentChanged =
      fitted.success && (!base || overwrite || this.looksLikeStarterCopy(base, org.name));
    if (fitted.success && !contentChanged) {
      this.log.log(`enrich: leaving edited copy for ${org.id} alone (overwrite not requested)`);
    }

    await this.prisma.site.update({
      where: { id: existing.id },
      data: {
        ...(contentChanged && fitted.success
          ? { content: fitted.data as unknown as Prisma.InputJsonValue }
          : {}),
        metaTitle: existing.metaTitle ?? (site.title ? trimWords(site.title, 120) : null),
        metaDescription:
          existing.metaDescription ?? trimWords(site.description || g.hero.subhead, 300),
      },
    });

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        // The vertical the site actually reads as, which is better than the one
        // an operator guessed from a dropdown before seeing it.
        industry: g.industry as Industry,
        tagline: org.tagline || trimWords(g.tagline, 120),
        logoUrl: org.logoUrl ?? site.imageUrl,
      },
    });

    // Knowledge the agent and the KB search can both answer from.
    await this.applyKnowledge(org.id, g, site);
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

  /**
   * The website, as knowledge documents.
   *
   * Two sources: the model's notes, at full length, and one document per
   * page the scraper read, in the page's own words. The pages are the more
   * important of the two — a note is a model's summary of a site, a page is
   * the site — and they need no model at all, so a centre on a deployment
   * with no LLM still gets a knowledge base about the right business.
   *
   * Deduplicated by title (the model often titles a note after the page it
   * came from) and capped at twenty, which is more than a small business's
   * site has pages and few enough that a sprawling one does not bury the
   * operator's own documents. KnowledgeDoc has no length limits on title or
   * content (packages/db/prisma/schema.prisma); the 160 on titles is only so
   * they read in a list.
   */
  private async applyKnowledge(orgId: string, g: GeneratedCentre, site: ScrapedSite): Promise<void> {
    const MAX_DOCS = 20;
    const PREFIX = 'From the website — ';
    const candidates = [
      ...g.knowledge.map((n) => ({ title: n.title, content: n.content })),
      ...(site.pages ?? []).map((p) => ({ title: p.title || pageLabel(p.url), content: p.text })),
    ];
    const seen = new Set<string>();
    const docs: { title: string; content: string }[] = [];
    for (const c of candidates) {
      const title = `${PREFIX}${c.title.trim()}`.slice(0, 160);
      const content = c.content.trim();
      const key = title.toLowerCase();
      if (!c.title.trim() || !content || seen.has(key)) continue;
      seen.add(key);
      docs.push({ title, content });
      if (docs.length >= MAX_DOCS) break;
    }
    if (docs.length === 0) return;

    // Additive: the vertical placeholders stay until a person deletes them, and
    // a re-run replaces only what a previous run of this added.
    await this.prisma.knowledgeDoc.deleteMany({
      where: { orgId, title: { startsWith: PREFIX } },
    });
    for (const doc of docs) {
      await this.prisma.knowledgeDoc.create({
        data: { orgId, title: doc.title, category: 'GENERAL', content: doc.content },
      });
    }
    this.log.log(`enrich: stored ${docs.length} website document(s) for ${orgId}`);
  }

  /* ----------------------------- the voice agent --------------------------- */

  /**
   * Build the Dograh agents: inbound for the landing page, plus outbound and
   * info, and point all three demo-call slots at them.
   *
   * `inbound` because every one of the three call paths is the agent *receiving*
   * a conversation: a visitor pressing the widget, a caller on the DID, and the
   * demo call, where we place the leg but the agent still answers the human.
   */
  private async provisionAgent(
    orgId: string,
    g: GeneratedCentre,
    site: ScrapedSite,
    orgName: string,
    kinds: DemoDialerKind[],
    opts: { reuseInbound?: boolean } = {},
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

    const facts = [
      site.phone ? `The published phone number is ${site.phone}.` : '',
      `Their website is ${site.finalUrl}.`,
      '',
      "### The business's own website text",
      site.text.slice(0, 7000),
    ]
      .filter(Boolean)
      .join('\n');

    // An existing centre keeps the agent its landing page already talks to:
    // rebuilding it would orphan the page's embed token and its history.
    const existing = opts.reuseInbound ? (await this.dograh.view(orgId)).workflowId : null;
    const inbound = existing
      ? ({ ok: true } as const)
      : await this.dograh.buildAgentFor(orgId, {
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
      facts,
    });
    if (!inbound.ok || kinds.length === 0) return inbound;

    /*
     * Then the other two demo slots — outbound and info — built from the same
     * scrape, with the inbound agent above wired into the first slot. Without
     * this a centre made from a URL had a voice agent on its landing page and
     * an empty Demo calls page until an operator picked three agents by hand.
     */
    const demo = await this.dograh.buildDemoAgentsFor(orgId, kinds, {
      businessName: orgName,
      scraped,
      facts,
      agentName: DOGRAH_AGENT_NAME,
    });
    /*
     * Booking last, and best-effort: an agent that cannot book is still an
     * agent worth having, so a failure here is logged rather than turning a
     * ready centre into a failed one.
     */
    const booking = await this.dograh.enableBooking(orgId);
    if (!booking.ok) this.log.warn(`enrich: ${orgId} agents built without booking — ${booking.detail}`);

    return demo.ok
      ? demo
      : { ok: false, detail: `the inbound agent was built, but demo calls are ${demo.detail}` };
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

  /**
   * Queue the demo-call agents for a centre that already exists.
   *
   * Centres made before the three-agent change, or made without a website,
   * have empty slots and nothing that would ever fill them. This is that
   * something: queued like an enrichment because Dograh takes minutes to build
   * an agent, and progress is reported on the same status fields.
   */
  async enqueueBuildAgents(orgId: string, kinds: DemoDialerKind[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.outboxEvent.create({
        data: {
          orgId,
          aggregate: 'organization',
          aggregateId: orgId,
          type: BUILD_AGENTS_EVENT,
          payload: { orgId, demoCallKinds: kinds },
        },
      });
      await tx.setting.update({
        where: { orgId },
        data: { enrichStatus: 'queued', enrichError: null },
      });
    });
    await this.outbox.notify();
  }

  /**
   * Build whatever agents an existing centre is missing.
   *
   * From its website when it has one; otherwise from what the centre already
   * says about itself — its landing-page copy and knowledge documents — so a
   * centre created from a vertical template still gets agents that know its
   * name and services. The landing page's agent, if any, becomes the inbound
   * one rather than being replaced.
   */
  private async buildAgents(orgId: string, kinds: DemoDialerKind[]): Promise<void> {
    await this.setStatus(orgId, 'running', { error: null });
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, slug: true, websiteUrl: true },
    });
    if (!org) return;

    let site: ScrapedSite | null = null;
    if (org.websiteUrl) {
      site = await this.scraper.scrape(org.websiteUrl).catch((e: unknown) => {
        this.log.warn(
          `build-agents: ${org.slug} website unreadable, using its own copy — ` +
            `${e instanceof Error ? e.message : e}`,
        );
        return null;
      });
    }

    // Stages and greeting are the copywriter's; without a website there is
    // nothing for it to read, so buildAgentHalf's generic stages stand in.
    const generated = site ? await this.generator.generateOrFallback(site, org.name) : null;

    const result = await this.buildAgentHalf(orgId, org, site, generated, kinds);
    if (result.ok) {
      await this.setStatus(orgId, 'ready', { error: null });
      this.log.log(`build-agents: ${org.slug} ready (${kinds.join(', ')})`);
    } else {
      await this.setStatus(orgId, 'failed', { error: `The demo agents were not all built: ${result.detail}` });
    }
  }

  /**
   * The agent half, shared by an enrichment and the "Build agents" button.
   *
   * Everything here is forgiving in the same way, wherever it is called from:
   * no scrape means the centre's own copy is the source (siteFromCentre), no
   * usable generation means the generic stages, a long stage list is folded
   * to one the graph can carry, and the inbound agent is reused when the
   * centre already has one — so a retry, or a second click, never builds a
   * duplicate.
   *
   * Never throws for a Dograh failure; reports it, with whether a retry could
   * plausibly fix it. A centre with no Dograh at all is checked up front so
   * the operator gets the one message that tells them what to do about it.
   */
  private async buildAgentHalf(
    orgId: string,
    org: { name: string; slug: string },
    scraped: ScrapedSite | null,
    generated: GeneratedCentre | null,
    kinds: DemoDialerKind[],
    opts: { rebuild?: boolean } = {},
  ): Promise<{ ok: true } | { ok: false; detail: string; transient: boolean }> {
    const connection = await this.dograh.view(orgId);
    if (!connection.baseUrl || !connection.hasApiKey) {
      return { ok: false, detail: DOGRAH_NOT_CONNECTED, transient: false };
    }

    const site = scraped ?? (await this.tenants.runAs(orgId, null, () => this.siteFromCentre(orgId, org)));
    const stages = foldStages(
      generated && generated.stages.length >= 2 ? generated.stages : DEFAULT_STAGES,
    );
    const g = {
      ...(generated ?? ({ agentGreeting: '' } as unknown as GeneratedCentre)),
      stages,
    } as GeneratedCentre;

    /*
     * Reuse, unless the operator asked for a fresh read.
     *
     * Every automatic path (creation, Voice-panel save, backfill, outbox
     * retry) keeps agents that already exist, so no attempt leaves duplicates
     * in Dograh. `restart` is the one deliberate "read this site again" and
     * rebuilds the inbound agent; it clears the other slots itself.
     */
    const result = await this.provisionAgent(orgId, g, site, org.name, kinds, {
      reuseInbound: !opts.rebuild,
    }).catch((e: unknown) => ({
      ok: false as const,
      detail: e instanceof Error ? e.message : 'unknown error',
    }));
    if (result.ok) return result;

    // Dograh's own wording for a missing host or key, from clientFor, mapped
    // to the message that says where to fix it.
    const detail = /No Dograh (host|API key)/i.test(result.detail) ? DOGRAH_NOT_CONNECTED : result.detail;
    return { ok: false, detail, transient: isTransientAgentFailure(detail) };
  }

  /** A centre's own copy and knowledge, shaped like a scrape. */
  private async siteFromCentre(
    orgId: string,
    org: { name: string; slug: string },
  ): Promise<ScrapedSite> {
    const [siteRow, docs] = await Promise.all([
      this.prisma.site.findFirst({ where: { orgId }, select: { content: true } }),
      this.prisma.knowledgeDoc.findMany({ select: { title: true, content: true }, take: 20 }),
    ]);
    const strings: string[] = [];
    const walk = (v: unknown): void => {
      if (typeof v === 'string') {
        if (v.trim() && !/^https?:\/\//.test(v)) strings.push(v.trim());
      } else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(siteRow?.content ?? {});
    const text = [
      ...strings,
      ...docs.map((d) => `${d.title}\n${d.content}`),
    ]
      .join('\n')
      .slice(0, 20_000);
    return {
      url: '',
      finalUrl: `${org.slug} landing page`,
      // These two only name the agent in the operator's list; page copy is
      // whatever sentence came first, which reads badly as a name.
      title: org.name,
      description: 'front desk',
      text,
      headings: [],
      imageUrl: null,
      images: [],
      phone: null,
      alsoRead: [],
      pages: [],
    };
  }

  /** Re-run for a centre, from the platform page or the website editor. */
  async restart(orgId: string, websiteUrl: string, overwriteContent: boolean): Promise<void> {
    // Rejected here, synchronously, so a bad URL is a 400 the operator sees
    // rather than a status field they have to go and read.
    await this.scraper.assertReadable(websiteUrl);
    await this.prisma.$transaction(async (tx) => {
      await tx.organization.update({ where: { id: orgId }, data: { websiteUrl } });
      // Empty the outbound and info slots so they are rebuilt from the new
      // read: the builder skips any slot that already has an agent.
      const setting = await tx.setting.findUnique({ where: { orgId }, select: { dograhDialers: true } });
      const dialers = { ...((setting?.dograhDialers ?? {}) as Record<string, Record<string, unknown>>) };
      for (const kind of ['outbound', 'info'] as const) {
        if (dialers[kind]) {
          dialers[kind] = { ...dialers[kind], workflowId: null, workflowUuid: '', workflowName: '', embedToken: '' };
        }
      }
      await tx.setting.update({ where: { orgId }, data: { dograhDialers: dialers as Prisma.InputJsonValue } });
      await this.enqueue(tx, orgId, websiteUrl, overwriteContent, [...DEMO_DIALER_KINDS], true);
    });
    await this.outbox.notify();
  }
}
