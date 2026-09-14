import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * tripvanta's own content shape, and how shared content becomes it.
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
export type TemplateProps = Omit<typeof d, 'FOOTER_DESTINATIONS' | 'getDestinationBodyBug'> & {

};

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export const DEFAULTS: TemplateProps = {
  DESTINATIONS: d.DESTINATIONS,
  DESTINATION_COUNTRY_NAME: d.DESTINATION_COUNTRY_NAME,
  PARTNER_LOGOS: d.PARTNER_LOGOS,
  JOURNEY_IMAGES: d.JOURNEY_IMAGES,
  GALLERY_GRID_IMAGES: d.GALLERY_GRID_IMAGES,
  GALLERY_STRIP_IMAGES: d.GALLERY_STRIP_IMAGES,
  HERO_COLLAGE_IMAGES: d.HERO_COLLAGE_IMAGES,
  HOME_DESTINATION_CARDS: d.HOME_DESTINATION_CARDS,
  GUIDES: d.GUIDES,
  TESTIMONIALS: d.TESTIMONIALS,
  FAQS: d.FAQS,
  STATS: d.STATS,
  TRIP_STEPS: d.TRIP_STEPS,
  ABOUT_FEATURES: d.ABOUT_FEATURES,
  OFFICES: d.OFFICES,
  GUEST_OPTIONS_CONTACT: d.GUEST_OPTIONS_CONTACT,
  GUEST_OPTIONS_HERO: d.GUEST_OPTIONS_HERO,
  TEMPLATE_CREDIT: d.TEMPLATE_CREDIT,
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
    GALLERY_GRID_IMAGES: list(content.gallery.map((g) => g.src), d.GALLERY_GRID_IMAGES),
    GALLERY_STRIP_IMAGES: list(content.gallery.map((g) => g.src), d.GALLERY_STRIP_IMAGES),
    GUIDES: list(
      content.team.map((s, i) => {
        const b = d.GUIDES[i % d.GUIDES.length] as unknown as Record<string, never>;
        return { ...b, name: s.name || b.name, role: s.role || b.role, image: s.image?.src || b.image };
      }) as unknown as typeof d.GUIDES,
      d.GUIDES,
    ),
    TESTIMONIALS: list(
      content.testimonials.map((s, i) => {
        const b = d.TESTIMONIALS[i % d.TESTIMONIALS.length] as unknown as Record<string, never>;
        return { ...b, quote: s.quote || b.quote, name: s.author || b.name };
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
    TRIP_STEPS: list(
      content.steps.map((s, i) => {
        const b = d.TRIP_STEPS[i % d.TRIP_STEPS.length] as unknown as Record<string, never>;
        return { ...b, number: s.number || numbered(i, b.number), title: s.title || b.title, description: s.body || b.description };
      }) as unknown as typeof d.TRIP_STEPS,
      d.TRIP_STEPS,
    ),
    ABOUT_FEATURES: list(
      content.highlights.map((s, i) => {
        const b = d.ABOUT_FEATURES[i % d.ABOUT_FEATURES.length] as unknown as Record<string, never>;
        return { ...b, title: s.title || b.title, description: s.body || b.description };
      }) as unknown as typeof d.ABOUT_FEATURES,
      d.ABOUT_FEATURES,
    ),
  };
}
