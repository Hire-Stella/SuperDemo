import { z } from 'zod';

/**
 * One content shape, filled by a product, read by every template.
 *
 * ## Why a superset and not a lowest common denominator
 *
 * The templates in this repo were each built against a different source site,
 * and their content shapes say so: one wants `WHY_MOMENTUM` and `RESULTS`,
 * another `TREATMENT_CHIPS` and `TEAM`, a third a journal feed. Flattening
 * those into the three or four sections they all share is the obvious move and
 * it is the wrong one — it produces N templates that are the same page in
 * different colours, which is a re-skin and not a library.
 *
 * So this is deliberately a superset. A template takes what it can use, and
 * keeps its own copy for the sections nothing here can fill. Every field below
 * is therefore optional or defaulted: a product that knows only a business
 * name must still produce a valid document, and a template that wants a team
 * roster must still render when it gets none.
 *
 * ## What is not here
 *
 * Styling. A template owns how it looks — that is the entire reason to have
 * more than one. `theme` carries a brand colour and a logo because those are
 * the tenant's, not the template's, and nothing else.
 */

/* ------------------------------ primitives -------------------------------- */

export const Cta = z.object({
  label: z.string(),
  /** A URL, a `tel:`, or one of the product's own action tokens. */
  href: z.string().default('#'),
});
export type Cta = z.infer<typeof Cta>;

export const Media = z.object({
  src: z.string(),
  alt: z.string().default(''),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type Media = z.infer<typeof Media>;

export const Stat = z.object({
  /** A string, not a number: "12+", "5K+", "98%" and "24/7" are all normal. */
  value: z.string(),
  label: z.string(),
});
export type Stat = z.infer<typeof Stat>;

/* -------------------------------- sections -------------------------------- */

export const Brand = z.object({
  name: z.string(),
  tagline: z.string().default(''),
  logo: Media.nullable().default(null),
});

export const Hero = z.object({
  eyebrow: z.string().default(''),
  /**
   * An array, because several templates set each line separately to control
   * where it breaks. A product with one sentence passes a single element.
   */
  headline: z.array(z.string()).min(1),
  subhead: z.string().default(''),
  primaryCta: Cta.nullable().default(null),
  secondaryCta: Cta.nullable().default(null),
  image: Media.nullable().default(null),
  /** Oversized wordmark behind or beside the hero. Templates that have no such
   *  treatment ignore it; it is not worth a second schema to omit. */
  giantText: z.string().default(''),
});

export const About = z.object({
  eyebrow: z.string().default(''),
  heading: z.string().default(''),
  body: z.string().default(''),
  image: Media.nullable().default(null),
  cta: Cta.nullable().default(null),
  stats: z.array(Stat).default([]),
});

export const Feature = z.object({
  title: z.string(),
  body: z.string().default(''),
  /** A lucide icon name where the template draws one. Unknown names fall back. */
  icon: z.string().default(''),
  image: Media.nullable().default(null),
});

export const Service = z.object({
  name: z.string(),
  body: z.string().default(''),
  /** "001", "02" — templates that number their services want the exact string. */
  number: z.string().default(''),
  price: z.string().default(''),
  image: Media.nullable().default(null),
});

export const Step = z.object({
  title: z.string(),
  body: z.string().default(''),
  number: z.string().default(''),
});

export const Testimonial = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string().default(''),
  image: Media.nullable().default(null),
});

export const PricingTier = z.object({
  name: z.string(),
  price: z.string(),
  note: z.string().default(''),
  features: z.array(z.string()).default([]),
  cta: Cta.nullable().default(null),
  featured: z.boolean().default(false),
});

export const Comparison = z.object({
  beforeLabel: z.string().default('Before'),
  afterLabel: z.string().default('After'),
  before: z.array(z.string()).default([]),
  after: z.array(z.string()).default([]),
});

export const Person = z.object({
  name: z.string(),
  role: z.string().default(''),
  bio: z.string().default(''),
  image: Media.nullable().default(null),
});

export const FaqItem = z.object({ q: z.string(), a: z.string() });

export const NavLink = z.object({ label: z.string(), href: z.string() });

/**
 * The words a section introduces itself with.
 *
 * Separate from the section's items because every template has these and none
 * of them can be derived: "A SIMPLE PATH TO LASTING WELLNESS" is the heading
 * over Sanvera's process, and four steps of content cannot produce it. Without
 * these a car rental filled into a wellness template still says "wellness"
 * three times in 40pt type — which is precisely how a generated page gives
 * itself away.
 *
 * Optional per section: a product that has nothing to say here leaves the
 * template's own, which is right for a demo and wrong for a real client, so
 * the generator should fill them.
 */
export const SectionCopy = z.object({
  eyebrow: z.string().default(''),
  heading: z.string().default(''),
  subhead: z.string().default(''),
});
export type SectionCopy = z.infer<typeof SectionCopy>;

export const Contact = z.object({
  phone: z.string().default(''),
  email: z.string().default(''),
  address: z.string().default(''),
  hours: z.string().default(''),
  /** Whether the template should render its enquiry form at all. */
  showForm: z.boolean().default(true),
  formNote: z.string().default(''),
});

/**
 * The tenant's identity, and nothing about the template's own design.
 *
 * `brandColor` is a hint rather than a contract: a template built on a fixed
 * maroon palette is entitled to ignore it, and forcing every template to be
 * tintable is how they all end up looking alike.
 */
export const Theme = z.object({
  brandColor: z.string().default(''),
  mode: z.enum(['light', 'dark', 'auto']).default('auto'),
});

/* --------------------------------- content -------------------------------- */

/**
 * Section keys, in the order a page renders them by default.
 *
 * A template declares which of these it supports and the product says which it
 * wants shown; the intersection is what renders. That is what lets a scrape
 * that found no testimonials drop the band rather than render an empty one.
 */
export const SECTION_KEYS = [
  'hero',
  'about',
  'highlights',
  'services',
  'steps',
  'gallery',
  'stats',
  'testimonials',
  'pricing',
  'comparison',
  'team',
  'faq',
  'contact',
] as const;

export const SectionKey = z.enum(SECTION_KEYS);
export type SectionKey = z.infer<typeof SectionKey>;

export const TemplateContent = z.object({
  brand: Brand,
  nav: z.array(NavLink).default([]),
  hero: Hero,
  about: About.nullable().default(null),
  highlights: z.array(Feature).default([]),
  services: z.array(Service).default([]),
  steps: z.array(Step).default([]),
  gallery: z.array(Media).default([]),
  stats: z.array(Stat).default([]),
  testimonials: z.array(Testimonial).default([]),
  pricing: z.array(PricingTier).default([]),
  comparison: Comparison.nullable().default(null),
  team: z.array(Person).default([]),
  faq: z.array(FaqItem).default([]),
  contact: Contact,
  footerNote: z.string().default(''),
  /** Which sections to render, in order. Empty means "whatever has content". */
  sections: z.array(SectionKey).default([]),
  /** Per-section eyebrow/heading/subhead. Missing entries keep the template's. */
  headings: z.record(SectionKey, SectionCopy).default({}),
  theme: Theme.default({ brandColor: '', mode: 'auto' }),
});
export type TemplateContent = z.infer<typeof TemplateContent>;

/**
 * Sections worth rendering, given the content and the template's repertoire.
 *
 * Callers pass `supports` from the template's own manifest, so a template that
 * cannot draw a pricing table never receives one — and a section the product
 * asked for but has no content behind is dropped rather than rendered empty,
 * which is the failure that makes a generated page look broken rather than
 * sparse.
 */
export function visibleSections(
  content: TemplateContent,
  supports: readonly SectionKey[],
): SectionKey[] {
  const hasContent: Record<SectionKey, boolean> = {
    hero: true,
    about: Boolean(content.about?.heading || content.about?.body),
    highlights: content.highlights.length > 0,
    services: content.services.length > 0,
    steps: content.steps.length > 0,
    gallery: content.gallery.length > 0,
    stats: content.stats.length > 0 || (content.about?.stats.length ?? 0) > 0,
    testimonials: content.testimonials.length > 0,
    pricing: content.pricing.length > 0,
    comparison: Boolean(content.comparison),
    team: content.team.length > 0,
    faq: content.faq.length > 0,
    contact: true,
  };

  const wanted = content.sections.length > 0 ? content.sections : [...SECTION_KEYS];
  return wanted.filter((k) => supports.includes(k) && hasContent[k]);
}

/**
 * A template, as the registry sees it.
 *
 * `supports` is what makes a mixed library usable: the product can offer only
 * the templates that can show what this tenant actually has, instead of
 * offering all sixteen and letting three of them render half a page.
 */
export interface TemplateManifest {
  id: string;
  name: string;
  /** One line for the picker. */
  description: string;
  /** Source it was built from, for attribution and licence tracking. */
  source: string;
  supports: readonly SectionKey[];
  /** A still of the template with sample content, for the picker. */
  preview: string;
}
