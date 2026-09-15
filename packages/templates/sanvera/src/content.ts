import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * Sanvera's own content shape, and how shared content becomes it.
 *
 * ## Why the template keeps its own shape
 *
 * Sanvera wants `WHY_CHOOSE` cards, a `SERVICES_GALLERY`, a numbered `PROCESS`
 * and a headline split into four lines. None of that is in the shared schema,
 * and it should not be: the next template wants a team roster and a journal
 * feed instead. Forcing every template through one shape is how a library of
 * sixteen becomes one page in sixteen palettes.
 *
 * So the schema is the *source* and this is the *sink*, with an adapter
 * between. What the schema can fill, it fills. What it cannot, falls back to
 * the copy this template shipped with — which is why `defaults.ts` is kept
 * verbatim from the clone rather than deleted.
 *
 * ## The fallback rule
 *
 * Empty means "keep what the template has", never "render nothing". A tenant
 * whose site had no testimonials gets Sanvera's, not three blank cards — and a
 * product that wants the band gone says so through `sections`, which is a
 * different question from having no content for it. That distinction is the
 * one that decides whether a generated page reads as sparse or as broken.
 */

/*
 * Scalars are `string`, not `typeof d.X`.
 *
 * The defaults are `const`, so TypeScript infers their literal text as the
 * type — `SERVICES_EYEBROW` would be the type `"Services"` and nothing else
 * could ever be assigned. Objects and arrays keep `typeof` because their shape
 * is exactly what a template component expects and is worth pinning.
 */
export interface SanveraContent {
  BRAND_NAME: string;
  BRAND_TAGLINE: string;
  NAV_LINKS: typeof d.NAV_LINKS;
  HERO: typeof d.HERO;
  ABOUT: typeof d.ABOUT;
  SERVICES: typeof d.SERVICES;
  SERVICES_EYEBROW: string;
  SERVICES_CTA: string;
  SERVICES_GALLERY: typeof d.SERVICES_GALLERY;
  WHY_CHOOSE: typeof d.WHY_CHOOSE;
  PROCESS: typeof d.PROCESS;
  TESTIMONIALS_EYEBROW: string;
  TESTIMONIALS_HEADING: string;
  TESTIMONIALS_SUBHEAD: string;
  TESTIMONIALS: typeof d.TESTIMONIALS;
  FAQ_HEADING: string;
  FAQ_CTA: string;
  FAQ_IMAGE: string;
  FAQS: typeof d.FAQS;
  JOURNEY_CTA: typeof d.JOURNEY_CTA;
  FOOTER: typeof d.FOOTER;
  /**
   * Where the FAQ's "Contact us" goes.
   *
   * Not in the clone's data file — it was a `mailto:hello@amberwell.co.uk`
   * hardcoded in the markup, which on a client's page is their enquiry button
   * pointing at somebody else's inbox. The kind of thing that only shows up
   * when you grep the rendered HTML for the template's own name.
   */
  CONTACT_HREF: string;
}

/** The template exactly as it was cloned — the gallery and every fallback. */
export const SANVERA_DEFAULTS: SanveraContent = {
  BRAND_NAME: d.BRAND_NAME,
  BRAND_TAGLINE: d.BRAND_TAGLINE,
  NAV_LINKS: d.NAV_LINKS,
  HERO: d.HERO,
  ABOUT: d.ABOUT,
  SERVICES: d.SERVICES,
  SERVICES_EYEBROW: d.SERVICES_EYEBROW,
  SERVICES_CTA: d.SERVICES_CTA,
  SERVICES_GALLERY: d.SERVICES_GALLERY,
  WHY_CHOOSE: d.WHY_CHOOSE,
  PROCESS: d.PROCESS,
  TESTIMONIALS_EYEBROW: d.TESTIMONIALS_EYEBROW,
  TESTIMONIALS_HEADING: d.TESTIMONIALS_HEADING,
  TESTIMONIALS_SUBHEAD: d.TESTIMONIALS_SUBHEAD,
  TESTIMONIALS: d.TESTIMONIALS,
  FAQ_HEADING: d.FAQ_HEADING,
  FAQ_CTA: d.FAQ_CTA,
  FAQ_IMAGE: d.FAQ_IMAGE,
  FAQS: d.FAQS,
  JOURNEY_CTA: d.JOURNEY_CTA,
  FOOTER: d.FOOTER,
  CONTACT_HREF: 'mailto:hello@example.com',
};

/**
 * "12+" -> { value: 12, suffix: "+" }.
 *
 * Sanvera counts its stats up on scroll, so it needs the number and its
 * decoration apart. The schema keeps them as one string because "24/7" is a
 * perfectly good stat that is not a number at all — those land as value 0 with
 * the whole string as the suffix, which animates to nothing and reads right.
 */
const splitStat = (s: { value: string; label: string }) => ({
  value: Number.parseFloat(s.value) || 0,
  suffix: s.value.replace(/^[\d.,]+/, ''),
  label: s.label,
});

/**
 * Take what the tenant has, top up from the template's own to the length the
 * template indexes. Never returns fewer entries than `fallback`.
 */
const padTo = <T,>(v: T[] | undefined, fallback: T[]): T[] => {
  const taken = v && v.length > 0 ? v : [];
  return fallback.map((f, i) => taken[i] ?? f);
};

/** Non-empty wins, otherwise the template's own. */
const text = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
const list = <T,>(v: T[] | undefined, fallback: T[]) => (v && v.length > 0 ? v : fallback);

export function adapt(content: TemplateContent): SanveraContent {
  const { brand, hero, about, services, highlights, steps, testimonials, faq, gallery, contact } =
    content;
  /** A section's own words, or the template's. */
  const h = (k: Parameters<typeof content.headings.hasOwnProperty>[0] extends never ? never : keyof typeof content.headings) =>
    content.headings[k as keyof typeof content.headings];

  return {
    BRAND_NAME: text(brand.name, d.BRAND_NAME),
    BRAND_TAGLINE: text(brand.tagline, d.BRAND_TAGLINE),
    NAV_LINKS: list(content.nav, d.NAV_LINKS),

    HERO: {
      ...d.HERO,
      headline: list(hero.headline, d.HERO.headline),
      subhead: text(hero.subhead, d.HERO.subhead),
      cta: text(hero.primaryCta?.label, d.HERO.cta),
      // The wordmark is the brand's, not the template's — an unbranded giant
      // "AMBERWELL" over a client's page is worse than no treatment at all.
      giantText: text(hero.giantText || brand.name.toUpperCase(), d.HERO.giantText),
      image: text(hero.image?.src, d.HERO.image),
    },

    ABOUT: {
      ...d.ABOUT,
      eyebrow: text(about?.eyebrow || h('about')?.eyebrow, d.ABOUT.eyebrow),
      heading: text(about?.heading, d.ABOUT.heading),
      paragraph: text(about?.body, d.ABOUT.paragraph),
      cta: text(about?.cta?.label, d.ABOUT.cta),
      thumb: text(about?.image?.src, d.ABOUT.thumb),
      stats: list(about?.stats.map(splitStat), d.ABOUT.stats),
    },

    SERVICES: list(
      services.map((s, i) => ({
        number: s.number || String(i + 1).padStart(3, '0'),
        title: s.name,
        description: s.body || undefined,
      })),
      d.SERVICES,
    ),
    SERVICES_EYEBROW: text(h('services')?.eyebrow, d.SERVICES_EYEBROW),
    SERVICES_CTA: d.SERVICES_CTA,
    /*
     * Padded to the length the template indexes, not merely replaced.
     *
     * Services reads SERVICES_GALLERY[0..2] by fixed index for a three-photo
     * collage. A tenant whose scrape found one image would otherwise put
     * `undefined` into two <Image src> props — a real broken render, which the
     * compiler happened to catch. Short lists are topped up from the
     * template's own so the collage always has three frames.
     */
    SERVICES_GALLERY: padTo(
      gallery.map((g) => g.src),
      d.SERVICES_GALLERY,
    ),

    /*
     * WHY_CHOOSE is a headed block with its own stat strip, not a card list —
     * so highlights cannot simply replace it. The tenant's heading and body go
     * in; the stats come from wherever the product put them, and the strip
     * keeps the template's own where it found none.
     */
    WHY_CHOOSE: {
      ...d.WHY_CHOOSE,
      eyebrow: text(h('highlights')?.eyebrow, d.WHY_CHOOSE.eyebrow),
      heading: text(h('highlights')?.heading || highlights[0]?.title, d.WHY_CHOOSE.heading),
      paragraph: text(h('highlights')?.subhead || highlights[0]?.body, d.WHY_CHOOSE.paragraph),
      stats: list(content.stats.map(splitStat), d.WHY_CHOOSE.stats),
    },

    PROCESS: {
      ...d.PROCESS,
      eyebrow: text(h('steps')?.eyebrow, d.PROCESS.eyebrow),
      heading: text(h('steps')?.heading, d.PROCESS.heading),
      subhead: text(h('steps')?.subhead, d.PROCESS.subhead),
      steps: list(
        steps.map((s, i) => ({
          number: s.number || String(i + 1).padStart(2, '0'),
          title: s.title,
          description: s.body,
          // The template gives each step bullets and an icon; the schema has
          // neither. Empty bullets render as none, and the icon is carried
          // over positionally from the template's own steps so the rhythm of
          // the section survives — inventing three bullets per step would be
          // writing copy, which this adapter must never do.
          bullets: [] as string[],
          icon: d.PROCESS.steps[i % d.PROCESS.steps.length]!.icon,
        })),
        d.PROCESS.steps,
      ),
    },

    TESTIMONIALS_EYEBROW: text(h('testimonials')?.eyebrow, d.TESTIMONIALS_EYEBROW),
    TESTIMONIALS_HEADING: text(h('testimonials')?.heading, d.TESTIMONIALS_HEADING),
    TESTIMONIALS_SUBHEAD: text(h('testimonials')?.subhead, d.TESTIMONIALS_SUBHEAD),
    TESTIMONIALS: list(
      testimonials.map((t, i) => ({
        quote: t.quote,
        name: t.author,
        role: t.role,
        photo: t.image?.src || d.TESTIMONIALS[i]?.photo || d.TESTIMONIALS[0]!.photo,
      })),
      d.TESTIMONIALS,
    ),

    FAQ_HEADING: text(h('faq')?.heading, d.FAQ_HEADING),
    FAQ_CTA: d.FAQ_CTA,
    FAQ_IMAGE: d.FAQ_IMAGE,
    FAQS: list(
      faq.map((f) => ({ question: f.q, answer: f.a })),
      d.FAQS,
    ),

    JOURNEY_CTA: {
      ...d.JOURNEY_CTA,
      heading: text(h('contact')?.heading, d.JOURNEY_CTA.heading),
      subhead: text(h('contact')?.subhead, d.JOURNEY_CTA.subhead),
      cta: text(contact.phone ? `Call ${contact.phone}` : '', d.JOURNEY_CTA.cta),
    },

    CONTACT_HREF: contact.email
      ? `mailto:${contact.email}`
      : contact.phone
        ? `tel:${contact.phone.replace(/[^+\d]/g, '')}`
        : '#contact',

    FOOTER: {
      ...d.FOOTER,
      // The only tenant-specific string the footer has room for. Socials stay
      // the template's placeholders — inventing a client's LinkedIn is worse
      // than leaving the row alone.
      copyright: `© ${new Date().getFullYear()} ${text(brand.name, d.BRAND_NAME)}.`,
    },
  };
}
