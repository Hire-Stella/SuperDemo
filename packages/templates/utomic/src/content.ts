import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * utomic's own content shape, and how shared content becomes it.
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
export type TemplateProps = Omit<typeof d, never> & {

};

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export const DEFAULTS: TemplateProps = {
  services: d.services,
  serviceProcess: d.serviceProcess,
  projects: d.projects,
  blogPosts: d.blogPosts,
  pricingPlans: d.pricingPlans,
  faqs: d.faqs,
  testimonials: d.testimonials,
  teamMembers: d.teamMembers,
  awards: d.awards,
  companyStats: d.companyStats,
  storyMilestones: d.storyMilestones,
  homeWhyChoose: d.homeWhyChoose,
  controlFeatures: d.controlFeatures,
  contactInfo: d.contactInfo,
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
    services: list(
      content.services.map((s, i) => {
        const b = d.services[i % d.services.length] as unknown as Record<string, never>;
        return { ...b, name: s.name || b.name, image: s.image?.src || b.image };
      }) as unknown as typeof d.services,
      d.services,
    ),
    serviceProcess: list(
      content.services.map((s, i) => {
        const b = d.serviceProcess[i % d.serviceProcess.length] as unknown as Record<string, never>;
        return { ...b, step: s.number || numbered(i, b.step), description: s.body || b.description };
      }) as unknown as typeof d.serviceProcess,
      d.serviceProcess,
    ),
    pricingPlans: list(
      content.pricing.map((s, i) => {
        const b = d.pricingPlans[i % d.pricingPlans.length] as unknown as Record<string, never>;
        return { ...b, name: s.name || b.name, description: s.note || b.description, price: s.price || b.price };
      }) as unknown as typeof d.pricingPlans,
      d.pricingPlans,
    ),
    faqs: list(
      content.faq.map((s, i) => {
        const b = d.faqs[i % d.faqs.length] as unknown as Record<string, never>;
        return { ...b, question: s.q || b.question, answer: s.a || b.answer };
      }) as unknown as typeof d.faqs,
      d.faqs,
    ),
    testimonials: list(
      content.testimonials.map((s, i) => {
        const b = d.testimonials[i % d.testimonials.length] as unknown as Record<string, never>;
        return { ...b, quote: s.quote || b.quote, name: s.author || b.name, role: s.role || b.role, avatar: s.image?.src || b.avatar };
      }) as unknown as typeof d.testimonials,
      d.testimonials,
    ),
    teamMembers: list(
      content.team.map((s, i) => {
        const b = d.teamMembers[i % d.teamMembers.length] as unknown as Record<string, never>;
        return { ...b, name: s.name || b.name, role: s.role || b.role, image: s.image?.src || b.image };
      }) as unknown as typeof d.teamMembers,
      d.teamMembers,
    ),
    companyStats: list(
      content.stats.map((s, i) => {
        const b = d.companyStats[i % d.companyStats.length] as unknown as Record<string, never>;
        return { ...b, value: s.value || b.value, label: s.label || b.label };
      }) as unknown as typeof d.companyStats,
      d.companyStats,
    ),
    storyMilestones: list(
      content.steps.map((s, i) => {
        const b = d.storyMilestones[i % d.storyMilestones.length] as unknown as Record<string, never>;
        return { ...b, body: s.body || b.body };
      }) as unknown as typeof d.storyMilestones,
      d.storyMilestones,
    ),
    homeWhyChoose: list(
      content.highlights.map((s, i) => {
        const b = d.homeWhyChoose[i % d.homeWhyChoose.length] as unknown as Record<string, never>;
        return { ...b, label: s.title || b.label, description: s.body || b.description };
      }) as unknown as typeof d.homeWhyChoose,
      d.homeWhyChoose,
    ),
    controlFeatures: list(
      content.highlights.map((s, i) => {
        const b = d.controlFeatures[i % d.controlFeatures.length] as unknown as Record<string, never>;
        return { ...b, title: s.title || b.title, description: s.body || b.description };
      }) as unknown as typeof d.controlFeatures,
      d.controlFeatures,
    ),
  };
}
