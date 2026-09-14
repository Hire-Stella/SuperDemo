import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * elianvalen's own content shape, and how shared content becomes it.
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
export type TemplateProps = Omit<typeof d, 'collectionProducts' | 'formatPrice' | 'productBySlug' | 'shopFilters' | 'shopProducts'> & {

};

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export const DEFAULTS: TemplateProps = {
  site: d.site,
  navLinks: d.navLinks,
  footerColumns: d.footerColumns,
  products: d.products,
  shopOrder: d.shopOrder,
  collectionOrder: d.collectionOrder,
  collectionFilters: d.collectionFilters,
  home: d.home,
  genderBanners: d.genderBanners,
  shippingRules: d.shippingRules,
  contactTeaser: d.contactTeaser,
  curatedBand: d.curatedBand,
  campaignCards: d.campaignCards,
  shopPage: d.shopPage,
  collectionsPage: d.collectionsPage,
  productFaq: d.productFaq,
  relatedSection: d.relatedSection,
  blogPage: d.blogPage,
  blogPosts: d.blogPosts,
  storyPage: d.storyPage,
  contactPage: d.contactPage,
  shippingPage: d.shippingPage,
  privacyPage: d.privacyPage,
  newsletter: d.newsletter,
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
    navLinks: list(
      content.nav.map((s, i) => {
        const b = d.navLinks[i % d.navLinks.length] as unknown as Record<string, never>;
        return { ...b, label: s.label || b.label, href: s.href || b.href };
      }) as unknown as typeof d.navLinks,
      d.navLinks,
    ),
    productFaq: list(
      content.faq.map((s, i) => {
        const b = d.productFaq[i % d.productFaq.length] as unknown as Record<string, never>;
        return { ...b, q: s.q || b.q, a: s.a || b.a };
      }) as unknown as typeof d.productFaq,
      d.productFaq,
    ),
  };
}
