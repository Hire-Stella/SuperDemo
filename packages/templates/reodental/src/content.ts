import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * reodental's own content shape, and how shared content becomes it.
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
export type TemplateProps = Omit<typeof d, 'BRAND_NAME' | 'BRAND_TAGLINE' | 'CONTACT_ADDRESS' | 'CONTACT_EMAIL' | 'CONTACT_HOURS' | 'CONTACT_PHONE' | 'CONTACT_PHONE_HREF' | 'COPYRIGHT' | 'DEPRECATED_TEMPLATE_EMAIL_DO_NOT_USE'> & {
  BRAND_NAME: string;
  BRAND_TAGLINE: string;
  CONTACT_ADDRESS: string;
  CONTACT_EMAIL: string;
  CONTACT_HOURS: string;
  CONTACT_PHONE: string;
  CONTACT_PHONE_HREF: string;
  COPYRIGHT: string;
  DEPRECATED_TEMPLATE_EMAIL_DO_NOT_USE: string;
};

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export const DEFAULTS: TemplateProps = {
  BRAND_NAME: d.BRAND_NAME,
  BRAND_TAGLINE: d.BRAND_TAGLINE,
  CONTACT_EMAIL: d.CONTACT_EMAIL,
  DEPRECATED_TEMPLATE_EMAIL_DO_NOT_USE: d.DEPRECATED_TEMPLATE_EMAIL_DO_NOT_USE,
  CONTACT_PHONE: d.CONTACT_PHONE,
  CONTACT_PHONE_HREF: d.CONTACT_PHONE_HREF,
  CONTACT_ADDRESS: d.CONTACT_ADDRESS,
  CONTACT_HOURS: d.CONTACT_HOURS,
  TEMPLATE_CREDIT: d.TEMPLATE_CREDIT,
  COPYRIGHT: d.COPYRIGHT,
  NAV_LINKS: d.NAV_LINKS,
  HERO: d.HERO,
  TREATMENT_CHIPS: d.TREATMENT_CHIPS,
  SERVICES: d.SERVICES,
  STATS: d.STATS,
  DIFFERENCE_STEPS: d.DIFFERENCE_STEPS,
  TEAM: d.TEAM,
  TESTIMONIALS: d.TESTIMONIALS,
  FAQS: d.FAQS,
  FOOTER_SERVICES: d.FOOTER_SERVICES,
  FOOTER_STUDIO_LINKS: d.FOOTER_STUDIO_LINKS,
  BOOKING_SERVICE_OPTIONS: d.BOOKING_SERVICE_OPTIONS,
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
/**
 * A stat's number and its decoration, apart.
 *
 * The schema keeps "600+" as one string because "24/7" is a perfectly good
 * stat that is not a number. Templates that animate their stats need the two
 * separately — and taking the label without the value is what showed the
 * template's "1200+" above the tenant's "Vehicles in the fleet".
 */
const statValue = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : v;
};
const statSuffix = (v: string) => v.replace(/^[\d.,]+/, '');

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
    BRAND_NAME: text(brand.name, d.BRAND_NAME),
    BRAND_TAGLINE: text(brand.tagline, d.BRAND_TAGLINE),
    CONTACT_EMAIL: text(contact.email, d.CONTACT_EMAIL),
    DEPRECATED_TEMPLATE_EMAIL_DO_NOT_USE: text(contact.email, d.DEPRECATED_TEMPLATE_EMAIL_DO_NOT_USE),
    CONTACT_PHONE: text(contact.phone, d.CONTACT_PHONE),
    CONTACT_PHONE_HREF: `tel:${text(contact.phone, d.CONTACT_PHONE_HREF).replace(/[^+\d]/g, "")}`,
    CONTACT_ADDRESS: text(contact.address, d.CONTACT_ADDRESS),
    CONTACT_HOURS: text(contact.hours, d.CONTACT_HOURS),
    COPYRIGHT: `© ${new Date().getFullYear()} ${text(brand.name, d.COPYRIGHT)}`,
    NAV_LINKS: list(
      content.nav.map((s, i) => {
        const b = d.NAV_LINKS[i % d.NAV_LINKS.length] as unknown as Record<string, never>;
        return { ...b, label: s.label || b.label, href: s.href || b.href };
      }) as unknown as typeof d.NAV_LINKS,
      d.NAV_LINKS,
    ),
    HERO: { ...d.HERO, eyebrow: (text(hero.eyebrow, (d.HERO as never as Record<string,string>)["eyebrow"]) as never), titleLines: (hero.headline.length ? hero.headline : (d.HERO as never as Record<string,string[]>)["titleLines"]) as never, subhead: (text(hero.subhead, (d.HERO as never as Record<string,string>)["subhead"]) as never) },
    TREATMENT_CHIPS: list(content.services.map((s) => s.name) as typeof d.TREATMENT_CHIPS, d.TREATMENT_CHIPS),
    SERVICES: list(
      content.services.map((s, i) => {
        const b = d.SERVICES[i % d.SERVICES.length] as unknown as Record<string, never>;
        return { ...b, number: s.number || numbered(i, b.number), name: s.name || b.name, description: s.body || b.description };
      }) as unknown as typeof d.SERVICES,
      d.SERVICES,
    ),
    STATS: list(
      content.stats.map((s, i) => {
        const b = d.STATS[i % d.STATS.length] as unknown as Record<string, never>;
        return { ...b, value: statValue(s.value) || b.value, suffix: statSuffix(s.value) || b.suffix, label: s.label || b.label };
      }) as unknown as typeof d.STATS,
      d.STATS,
    ),
    DIFFERENCE_STEPS: list(
      content.highlights.map((s, i) => {
        const b = d.DIFFERENCE_STEPS[i % d.DIFFERENCE_STEPS.length] as unknown as Record<string, never>;
        return { ...b, title: s.title || b.title };
      }) as unknown as typeof d.DIFFERENCE_STEPS,
      d.DIFFERENCE_STEPS,
    ),
    TEAM: list(
      content.team.map((s, i) => {
        const b = d.TEAM[i % d.TEAM.length] as unknown as Record<string, never>;
        return { ...b, name: s.name || b.name, role: s.role || b.role, photo: s.image?.src || b.photo };
      }) as unknown as typeof d.TEAM,
      d.TEAM,
    ),
    TESTIMONIALS: list(
      content.testimonials.map((s, i) => {
        const b = d.TESTIMONIALS[i % d.TESTIMONIALS.length] as unknown as Record<string, never>;
        return { ...b, quote: s.quote || b.quote, name: s.author || b.name, role: s.role || b.role, photo: s.image?.src || b.photo };
      }) as unknown as typeof d.TESTIMONIALS,
      d.TESTIMONIALS,
    ),
    FAQS: list(
      content.faq.map((s, i) => {
        const b = d.FAQS[i % d.FAQS.length] as unknown as Record<string, never>;
        return { ...b, question: s.q || b.question, answer: s.a || b.answer };
      }) as unknown as typeof d.FAQS,
      d.FAQS,
    ),
    FOOTER_SERVICES: list(content.services.map((s) => s.name) as typeof d.FOOTER_SERVICES, d.FOOTER_SERVICES),
    BOOKING_SERVICE_OPTIONS: list(content.services.map((s) => s.name) as typeof d.BOOKING_SERVICE_OPTIONS, d.BOOKING_SERVICE_OPTIONS),
  };
}
