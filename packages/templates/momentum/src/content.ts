import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * momentum's own content shape, and how shared content becomes it.
 *
 * The template keeps its shape rather than being bent into the schema's: it was
 * built against one source site and wants what that site had. The schema is the
 * source, this is the sink, and the gap between them is the point of having
 * more than one template.
 *
 * Fields the schema cannot fill keep the template's own copy. Empty means "keep
 * what the template has", never "render nothing" — a blank band reads as a
 * broken build, the template's own words read as a demo not yet filled in.
 */

/*
 * Derived from the defaults module rather than written out.
 *
 * Listing the fields by hand meant guessing each one's kind, and the guesses
 * were wrong wherever a template exported a number, a null, or a helper
 * function. `typeof d` is exactly right by construction. Only the scalars the
 * adapter actually replaces are widened — those are `const`, so TypeScript
 * infers their literal text and nothing else could be assigned.
 */
export type TemplateProps = Omit<typeof d, 'SITE_NAME'> & {
  SITE_NAME: string;
};

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export const DEFAULTS: TemplateProps = {
  TEMPLATE_CREDIT: d.TEMPLATE_CREDIT,
  BOOKING_URL: d.BOOKING_URL,
  SOCIAL_LINKS: d.SOCIAL_LINKS,
  SITE_NAME: d.SITE_NAME,
  NAV_LINKS: d.NAV_LINKS,
  HERO: d.HERO,
  STATS: d.STATS,
  ABOUT: d.ABOUT,
  WHY_MOMENTUM: d.WHY_MOMENTUM,
  SERVICES: d.SERVICES,
  HOW_IT_WORKS: d.HOW_IT_WORKS,
  RESULTS: d.RESULTS,
  PRICING: d.PRICING,
  FAQ: d.FAQ,
  FINAL_CTA: d.FINAL_CTA,
  FOOTER: d.FOOTER,
};

/** Non-empty wins, otherwise the template's own. */
const text = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
const list = <T,>(v: T[] | undefined, fallback: T[]) => (v && v.length > 0 ? v : fallback);

/**
 * A positional label that stays unique.
 *
 * Templates number their services and steps — "001", "02" — and several use
 * that string as the React key. The base element is reused cyclically when the
 * tenant has more items than the template shipped with, so carrying its number
 * over produces duplicate keys. This keeps the template's width and padding and
 * counts properly.
 */
const numbered = (i: number, like: unknown) =>
  String(i + 1).padStart(String(like ?? '').length || 2, '0');

/* The clone's field names are its own, so these produce the common shapes
 * loosely and are cast where they land. */
const mapFaq = (f: { q: string; a: string }) =>
  ({ question: f.q, answer: f.a, q: f.q, a: f.a }) as never;
const mapTestimonial = (t: { quote: string; author: string; role: string }) =>
  ({ quote: t.quote, name: t.author, author: t.author, role: t.role }) as never;

export function adapt(content: TemplateContent): TemplateProps {
  const { brand, hero, contact } = content;
  return {
    ...DEFAULTS,
    SITE_NAME: text(brand.name, d.SITE_NAME),
    NAV_LINKS: list(
      content.nav.map((s, i) => {
        const b = d.NAV_LINKS[i % d.NAV_LINKS.length] as unknown as Record<string, never>;
        return { ...b, label: s.label || b.label, href: s.href || b.href };
      }) as unknown as typeof d.NAV_LINKS,
      d.NAV_LINKS,
    ),
    HERO: { ...d.HERO, subhead: (text(hero.subhead, (d.HERO as never as Record<string,string>)["subhead"]) as never) },
    STATS: list(
      content.stats.map((s, i) => {
        const b = d.STATS[i % d.STATS.length] as unknown as Record<string, never>;
        return { ...b, label: s.label || b.label };
      }) as unknown as typeof d.STATS,
      d.STATS,
    ),
  };
}
