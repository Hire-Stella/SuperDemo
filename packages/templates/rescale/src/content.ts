import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * rescale's own content shape, and how shared content becomes it.
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
export type TemplateProps = Omit<typeof d, 'contactEmail' | 'heroBadge' | 'heroSubcopy'> & {
  contactEmail: string;
  heroBadge: string;
  heroSubcopy: string;
};

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export const DEFAULTS: TemplateProps = {
  navLinks: d.navLinks,
  socialLinks: d.socialLinks,
  primaryCtaHref: d.primaryCtaHref,
  primaryCtaLabel: d.primaryCtaLabel,
  bookCallHref: d.bookCallHref,
  bookCallLabel: d.bookCallLabel,
  heroBadge: d.heroBadge,
  heroHeading: d.heroHeading,
  heroSubcopy: d.heroSubcopy,
  heroClientLogos: d.heroClientLogos,
  heroMiniStats: d.heroMiniStats,
  heroFloatingTags: d.heroFloatingTags,
  featuresEyebrow: d.featuresEyebrow,
  featuresMarqueeTags: d.featuresMarqueeTags,
  processSteps: d.processSteps,
  integrationHighlights: d.integrationHighlights,
  integrationReliability: d.integrationReliability,
  integrationLogos: d.integrationLogos,
  performanceStats: d.performanceStats,
  founders: d.founders,
  companyStory: d.companyStory,
  lifeAtVectoraPhotos: d.lifeAtVectoraPhotos,
  testimonials: d.testimonials,
  annualDiscount: d.annualDiscount,
  pricingTiers: d.pricingTiers,
  faqs: d.faqs,
  journalPosts: d.journalPosts,
  officeLocations: d.officeLocations,
  contactEmail: d.contactEmail,
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
    navLinks: list(
      content.nav.map((s, i) => {
        const b = d.navLinks[i % d.navLinks.length] as unknown as Record<string, never>;
        return { ...b, label: s.label || b.label, href: s.href || b.href };
      }) as unknown as typeof d.navLinks,
      d.navLinks,
    ),
    heroBadge: text(hero.eyebrow, d.heroBadge),
    heroSubcopy: text(hero.subhead, d.heroSubcopy),
    processSteps: list(
      content.steps.map((s, i) => {
        const b = d.processSteps[i % d.processSteps.length] as unknown as Record<string, never>;
        return { ...b, step: s.number || numbered(i, b.step), title: s.title || b.title, description: s.body || b.description };
      }) as unknown as typeof d.processSteps,
      d.processSteps,
    ),
    integrationHighlights: list(
      content.highlights.map((s, i) => {
        const b = d.integrationHighlights[i % d.integrationHighlights.length] as unknown as Record<string, never>;
        return { ...b, label: s.title || b.label };
      }) as unknown as typeof d.integrationHighlights,
      d.integrationHighlights,
    ),
    performanceStats: list(
      content.stats.map((s, i) => {
        const b = d.performanceStats[i % d.performanceStats.length] as unknown as Record<string, never>;
        return { ...b, label: s.label || b.label };
      }) as unknown as typeof d.performanceStats,
      d.performanceStats,
    ),
    founders: list(
      content.team.map((s, i) => {
        const b = d.founders[i % d.founders.length] as unknown as Record<string, never>;
        return { ...b, name: s.name || b.name, role: s.role || b.role, photo: s.image?.src || b.photo, label: s.name || b.label };
      }) as unknown as typeof d.founders,
      d.founders,
    ),
    lifeAtVectoraPhotos: list(content.gallery.map((g) => g.src), d.lifeAtVectoraPhotos),
    testimonials: list(
      content.testimonials.map((s, i) => {
        const b = d.testimonials[i % d.testimonials.length] as unknown as Record<string, never>;
        return { ...b, name: s.author || b.name, role: s.role || b.role, quote: s.quote || b.quote, photo: s.image?.src || b.photo };
      }) as unknown as typeof d.testimonials,
      d.testimonials,
    ),
    pricingTiers: list(
      content.pricing.map((s, i) => {
        const b = d.pricingTiers[i % d.pricingTiers.length] as unknown as Record<string, never>;
        return { ...b, name: s.name || b.name };
      }) as unknown as typeof d.pricingTiers,
      d.pricingTiers,
    ),
    faqs: list(
      content.faq.map((s, i) => {
        const b = d.faqs[i % d.faqs.length] as unknown as Record<string, never>;
        return { ...b, question: s.q || b.question, answer: s.a || b.answer };
      }) as unknown as typeof d.faqs,
      d.faqs,
    ),
    contactEmail: text(contact.email, d.contactEmail),
  };
}
