import { z } from 'zod';
import { Industry } from './enums';

/**
 * Website-to-centre enrichment.
 *
 * An operator pastes a client's website when creating their contact centre, and
 * that one URL produces the two things a demo otherwise needs a copywriter and
 * a prompt engineer for: a landing page that talks about *their* business, and
 * a voice agent briefed on it.
 *
 * Deliberately not part of the create transaction. Reading a stranger's website
 * takes seconds, an LLM call takes more, and building a workflow happens on the
 * client's own Dograh — none of which should be able to fail the creation of a
 * centre, or make "build six demo tenants before a meeting" a five-minute job.
 * The centre is created complete and usable from its vertical template, then an
 * outbox event enriches it in the background and the status says where it got to.
 */

export const EnrichStatus = z.enum(['none', 'queued', 'running', 'ready', 'failed']);
export type EnrichStatus = z.infer<typeof EnrichStatus>;

export const ENRICH_STATUS_LABELS: Record<EnrichStatus, { label: string; note: string }> = {
  none: { label: 'Not requested', note: 'No website was supplied, so nothing was generated.' },
  queued: { label: 'Queued', note: 'Waiting to read the website.' },
  running: { label: 'Reading the website…', note: 'Scraping, writing the page, building the agent.' },
  ready: { label: 'Ready', note: 'Landing page and voice agent were generated from the website.' },
  failed: { label: 'Failed', note: 'Nothing was overwritten — the vertical starter content is intact.' },
};

/**
 * What a scrape yields, before an LLM sees it.
 *
 * Kept as its own step so the two halves are separable: a scrape that returns
 * nothing useful is a different problem from an LLM that writes badly, and the
 * operator-facing error should say which happened.
 */
export const ScrapedSite = z.object({
  url: z.string(),
  /** Final URL after redirects — what was actually read. */
  finalUrl: z.string(),
  title: z.string(),
  description: z.string(),
  /** Visible text, collapsed and truncated. The LLM's only real input. */
  text: z.string(),
  headings: z.array(z.string()),
  /** og:image or an apple-touch-icon, offered as the centre's logo. */
  imageUrl: z.string().nullable(),
  /**
   * Large images found on the pages read, in document order.
   *
   * Full-page designs have image bands, and one og:image cannot fill them.
   * These are the business's own photographs, which is the only kind that
   * belongs on their own landing page.
   */
  images: z.array(z.string()).max(12).default([]),
  /** Discovered on the page, offered as the centre's public number. */
  phone: z.string().nullable(),
  /** Pages beyond the entry point that were also read. */
  alsoRead: z.array(z.string()),
});
export type ScrapedSite = z.infer<typeof ScrapedSite>;

/**
 * The LLM's structured output.
 *
 * One call produces everything downstream needs, because two calls would let
 * the page and the agent disagree about what the business does.
 */
export const GeneratedCentre = z.object({
  /** Which vertical the site reads as. Drives queues, labels and defaults. */
  industry: Industry,
  tagline: z.string().max(120),
  /** Hero, services, FAQ and the rest, shaped for SiteContent. */
  hero: z.object({
    headline: z.string().max(120),
    subhead: z.string().max(300),
    ctaLabel: z.string().max(40),
    /**
     * The chip above the headline — "Trusted by 500+ homeowners" in the
     * reference design, and one of the things that makes it read as finished.
     *
     * Empty when the site claims nothing checkable. A fabricated "trusted by
     * 10,000 customers" is the one kind of copy that could actually harm a
     * client, so it is left blank rather than invented.
     */
    eyebrow: z.string().max(60).default(''),
  }),
  highlights: z.array(z.object({ title: z.string().max(60), body: z.string().max(200) })).max(6),
  services: z.array(z.object({ name: z.string().max(80), body: z.string().max(240) })).max(8),
  faq: z.array(z.object({ q: z.string().max(160), a: z.string().max(400) })).max(6),
  /**
   * "How it works", for layouts with a numbered band.
   *
   * Optional and empty by default: a business whose site describes no process
   * gets no process. Inventing four confident steps for a shop that just sells
   * things would be exactly the kind of plausible fiction this whole generator
   * is written against.
   */
  steps: z
    .array(z.object({ title: z.string().max(60), body: z.string().max(200) }))
    .max(4)
    .default([]),
  /**
   * What the agent says when the phone is answered.
   *
   * Optional, like everything below the page copy. Every field asked of the
   * model is a field it can omit, and a bigger required set made it drop
   * three at once — so only what the landing page genuinely needs is
   * mandatory, and the agent's inputs all have fallbacks.
   *
   * There is deliberately no `agentBrief` any more: Dograh's generator is
   * given the raw scrape instead, so asking a model to paraphrase the site
   * first was a lossy step and one more thing to go wrong.
   */
  agentGreeting: z.string().max(300).default(''),
  /**
   * Quotes the site publishes. Extracted, never written.
   *
   * The instruction says to return nothing rather than compose one, because a
   * fabricated testimonial puts words in a named person's mouth on the
   * client's own site. Empty is the correct and common answer.
   */
  testimonials: z
    .array(
      z.object({
        quote: z.string().max(400),
        author: z.string().max(60),
        role: z.string().max(80).default(''),
      }),
    )
    .max(6)
    .default([]),
  /** Price tiers the site publishes. Same rule: extracted, never invented. */
  pricing: z
    .array(
      z.object({
        name: z.string().max(40),
        price: z.string().max(40).default(''),
        note: z.string().max(120).default(''),
        features: z.array(z.string().max(90)).max(8).default([]),
      }),
    )
    .max(4)
    .default([]),
  /** A before/after framing, drawn from how the site positions itself. */
  comparison: z
    .object({
      beforeLabel: z.string().max(40).default(''),
      afterLabel: z.string().max(40).default(''),
      before: z.array(z.string().max(120)).max(5).default([]),
      after: z.array(z.string().max(120)).max(5).default([]),
    })
    .default({ beforeLabel: '', afterLabel: '', before: [], after: [] }),
  /** Short knowledge notes lifted from the site, for the centre's own KB. */
  knowledge: z
    .array(z.object({ title: z.string().max(120), content: z.string().max(2000) }))
    .max(6)
    .default([]),
  /**
   * The distinct things a caller wants, one per stage of the agent.
   *
   * Dograh's generator always returns the same four-node skeleton — greet,
   * one catch-all agent node, global, end — regardless of how the brief
   * describes the work. Verified by asking it for six named stages and getting
   * four nodes back. Their own hand-built agents are nine nodes with routing
   * between them, so a multi-stage flow has to be constructed rather than
   * requested, and these are what it is constructed from.
   *
   * `routeWhen` becomes the edge condition Dograh evaluates to move a caller
   * into the stage, so it is written as a description of the caller's need
   * rather than of the stage.
   */
  stages: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        /** What the agent does once the caller is in this stage. */
        purpose: z.string().min(10).max(600),
        /** When to route here — becomes the edge's condition. */
        routeWhen: z.string().min(10).max(240),
      }),
    )
    /*
     * No minimum, deliberately.
     *
     * A model that ignores this field should cost us tailored stages, not the
     * whole generation — `min(2)` here failed the entire enrichment and
     * discarded good page copy because Groq returned an empty array. The
     * caller substitutes DEFAULT_STAGES when there are fewer than two.
     */
    .max(6)
    .default([]),
});
export type GeneratedCentre = z.infer<typeof GeneratedCentre>;

/**
 * Stages to use when nothing better could be derived.
 *
 * Three real stages with real routing still beats one catch-all node — a
 * caller who wants a callback goes somewhere different from one asking a
 * price. They are just not tailored to the business.
 */
export const DEFAULT_STAGES: GeneratedCentre['stages'] = [
  {
    name: 'Enquiries',
    purpose:
      'Answer questions about what this business offers, using only the verified facts. If a ' +
      'detail is missing, say you will have a colleague confirm rather than guessing.',
    routeWhen: 'the caller asks what the business does, offers or provides',
  },
  {
    name: 'Prices and availability',
    purpose:
      'Answer cost and availability questions from the verified facts. Never estimate a price ' +
      'that is not written down — offer a callback instead.',
    routeWhen: 'the caller asks what something costs, or whether it is available',
  },
  {
    name: 'Take their details',
    purpose:
      "Collect the caller's name and phone number so somebody can call them back, read the " +
      'number back to confirm it, and say when to expect the call.',
    routeWhen: 'the caller wants a human, a callback, or to book something',
  },
];

/** Enrichment state, as the operator sees it. */
export const EnrichmentView = z.object({
  status: EnrichStatus,
  websiteUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  error: z.string().nullable(),
  enrichedAt: z.coerce.date().nullable(),
  /** Whether a Dograh agent came out of it, and which one. */
  workflowId: z.number().int().nullable(),
  workflowName: z.string().nullable(),
  hasEmbedToken: z.boolean(),
});
export type EnrichmentView = z.infer<typeof EnrichmentView>;

export const StartEnrichmentInput = z.object({
  websiteUrl: z.string().url('Give a full URL, e.g. https://example.com'),
  /**
   * Replace copy an operator may have edited by hand.
   *
   * Defaults false so re-running after a failure is safe. Regenerating is a
   * destructive act on someone's writing, and it should take a deliberate
   * second click rather than being the default of a button labelled "retry".
   */
  overwriteContent: z.boolean().default(false),
});
export type StartEnrichmentInput = z.infer<typeof StartEnrichmentInput>;

/* ------------------------------ demo calling ------------------------------ */

/**
 * A call the platform places to a number an operator types in.
 *
 * This is how a demo gets given: paste a prospect's number, their own AI answers
 * it. It is also the only outbound path that does not go through the dialler, so
 * it is rate-limited and logged as itself rather than pretending to be a campaign.
 */
export const DemoCallInput = z.object({
  phone: z.string().trim().min(6, 'A number the agent can ring').max(24),
  /** ISO 3166-1 alpha-2, from the country picker. */
  country: z.string().length(2).default('AE'),
  /** Anything the agent should know before it speaks. Merged into its context. */
  note: z.string().max(300).optional(),
});
export type DemoCallInput = z.infer<typeof DemoCallInput>;

export const DemoCallOutput = z.object({
  ok: z.boolean(),
  detail: z.string(),
  /** Dograh's run id, so the operator can find the transcript on their side. */
  workflowRunId: z.number().int().nullable(),
  /** E.164 as actually dialled, so a wrong country code is visible. */
  dialled: z.string().nullable(),
});
export type DemoCallOutput = z.infer<typeof DemoCallOutput>;
