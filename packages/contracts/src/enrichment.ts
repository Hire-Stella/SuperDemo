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
  /**
   * Every page read, entry point first, each with its own cleaned text.
   *
   * `text` above is these joined and capped for prompts; this keeps the
   * per-page split so each page can become its own knowledge document.
   */
  pages: z
    .array(z.object({ url: z.string(), title: z.string(), text: z.string() }))
    .default([]),
});
export type ScrapedSite = z.infer<typeof ScrapedSite>;

/*
 * Lenient building blocks for GeneratedCentre.
 *
 * The model's answer is advisory input, not a request body. A strict schema
 * here meant one over-long headline, or a ninth service on a site that sells
 * twenty-four, failed the *whole* generation — and the agent build behind it —
 * over a detail the landing page trims anyway. So every field below degrades
 * instead of failing: a missing or malformed string becomes '', a list keeps
 * the items that make sense and drops the rest, an unknown industry becomes
 * GENERIC. Length and count limits are not this schema's business any more;
 * the page enforces its own (SiteContent, via fitToPage in the enrichment
 * service), and the agent and the knowledge base want everything the site said.
 *
 * The only thing that still fails is a reply that is not an object at all —
 * there is nothing to salvage from that.
 */

/** Any string, a number written as one, or '' for anything else or nothing. */
const LenientText = z
  .preprocess((v) => (typeof v === 'number' ? String(v) : v), z.string())
  .catch('');

/** A list item that is a string (or a number). Non-strings are dropped, not blanked. */
const ListText = z.union([z.string(), z.number()]).transform(String);

/**
 * An array that keeps its valid items and drops the rest.
 *
 * `z.array(item)` rejects the whole list for one bad element, which is the
 * wrong trade for model output: four good FAQs and one null should be four
 * FAQs. Anything that is not an array at all becomes [].
 */
function lenientList<T extends z.ZodTypeAny>(item: T) {
  return z
    .preprocess(
      (v) => (Array.isArray(v) ? v.filter((x) => item.safeParse(x).success) : []),
      z.array(item),
    )
    .catch([]);
}

/**
 * One stage of the phone agent — the one item shape with real requirements.
 * A stage with no name, nothing to do or nothing to route on cannot become a
 * node in a graph, so such items are dropped from the list rather than
 * blanked into it.
 */
const GeneratedStage = z.object({
  name: z.string().trim().min(1),
  /** What the agent does once the caller is in this stage. */
  purpose: z.string().trim().min(1),
  /** When to route here — becomes the edge's condition. */
  routeWhen: z.string().trim().min(1),
});

/**
 * The LLM's structured output.
 *
 * One call produces everything downstream needs, because two calls would let
 * the page and the agent disagree about what the business does.
 *
 * Tolerant by construction — see the building blocks above. `safeParse` of
 * any object succeeds; the worst a bad reply can do is come back mostly
 * empty, which every consumer already handles by keeping what it had.
 */
export const GeneratedCentre = z.object({
  /** Which vertical the site reads as. Drives queues, labels and defaults. */
  industry: z
    .preprocess((v) => (typeof v === 'string' ? v.trim().toUpperCase() : v), Industry)
    .catch('GENERIC'),
  tagline: LenientText,
  /** Hero, services, FAQ and the rest, shaped for SiteContent. */
  hero: z
    .object({
      headline: LenientText,
      subhead: LenientText,
      ctaLabel: LenientText,
      /**
       * The chip above the headline — "Trusted by 500+ homeowners" in the
       * reference design, and one of the things that makes it read as finished.
       *
       * Empty when the site claims nothing checkable. A fabricated "trusted by
       * 10,000 customers" is the one kind of copy that could actually harm a
       * client, so it is left blank rather than invented.
       */
      eyebrow: LenientText,
    })
    .catch({ headline: '', subhead: '', ctaLabel: '', eyebrow: '' }),
  highlights: lenientList(z.object({ title: LenientText, body: LenientText })),
  /**
   * Every service the site offers, not the first eight. The landing page
   * shows as many as its design has room for; all of them are still worth
   * having here for the stages and the knowledge base.
   */
  services: lenientList(z.object({ name: LenientText, body: LenientText })),
  faq: lenientList(z.object({ q: LenientText, a: LenientText })),
  /**
   * "How it works", for layouts with a numbered band.
   *
   * Empty by default: a business whose site describes no process gets no
   * process. Inventing four confident steps for a shop that just sells things
   * would be exactly the kind of plausible fiction this whole generator is
   * written against.
   */
  steps: lenientList(z.object({ title: LenientText, body: LenientText })),
  /**
   * What the agent says when the phone is answered.
   *
   * Optional, like everything else here. Every field asked of the model is a
   * field it can omit, and a bigger required set made it drop three at once —
   * so the agent's inputs all have fallbacks.
   *
   * There is deliberately no `agentBrief` any more: Dograh's generator is
   * given the raw scrape instead, so asking a model to paraphrase the site
   * first was a lossy step and one more thing to go wrong.
   */
  agentGreeting: LenientText,
  /**
   * Quotes the site publishes. Extracted, never written.
   *
   * The instruction says to return nothing rather than compose one, because a
   * fabricated testimonial puts words in a named person's mouth on the
   * client's own site. Empty is the correct and common answer.
   */
  testimonials: lenientList(
    z.object({ quote: LenientText, author: LenientText, role: LenientText }),
  ),
  /** Price tiers the site publishes. Same rule: extracted, never invented. */
  pricing: lenientList(
    z.object({
      name: LenientText,
      price: LenientText,
      note: LenientText,
      features: lenientList(ListText),
    }),
  ),
  /** A before/after framing, drawn from how the site positions itself. */
  comparison: z
    .object({
      beforeLabel: LenientText,
      afterLabel: LenientText,
      before: lenientList(ListText),
      after: lenientList(ListText),
    })
    .catch({ beforeLabel: '', afterLabel: '', before: [], after: [] }),
  /**
   * Knowledge notes lifted from the site, for the centre's own KB. Kept at
   * full length: a note exists for the agent to answer from, and truncating
   * it is how an opening-hours line loses Friday.
   */
  knowledge: lenientList(z.object({ title: LenientText, content: LenientText })),
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
  /*
   * No minimum and no maximum, deliberately.
   *
   * A model that ignores this field should cost us tailored stages, not the
   * whole generation — `min(2)` here once failed the entire enrichment and
   * discarded good page copy because Groq returned an empty array. The
   * generator substitutes DEFAULT_STAGES when there are fewer than two, and
   * the enrichment service folds a long list into one "Other services" stage
   * before it becomes a graph.
   */
  stages: lenientList(GeneratedStage),
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
