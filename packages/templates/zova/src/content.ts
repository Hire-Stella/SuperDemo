import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * zova's own content shape, and how shared content becomes it.
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
export type TemplateProps = Omit<typeof d, 'contactAddress' | 'contactEmail' | 'contactPhone' | 'footerCopyright' | 'heroEyebrow' | 'heroSubhead'> & {
  contactAddress: string;
  contactEmail: string;
  contactPhone: string;
  footerCopyright: string;
  heroEyebrow: string;
  heroSubhead: string;
};

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export const DEFAULTS: TemplateProps = {
  ctaHref: d.ctaHref,
  ctaLabel: d.ctaLabel,
  linkedinHref: d.linkedinHref,
  navLinks: d.navLinks,
  footerColumns: d.footerColumns,
  footerCredit: d.footerCredit,
  footerCopyright: d.footerCopyright,
  heroEyebrow: d.heroEyebrow,
  heroHeadingLines: d.heroHeadingLines,
  heroHighlightWord: d.heroHighlightWord,
  heroSubhead: d.heroSubhead,
  heroRating: d.heroRating,
  heroVideo: d.heroVideo,
  heroVideoPoster: d.heroVideoPoster,
  heroImage: d.heroImage,
  partnerLogos: d.partnerLogos,
  featureCards: d.featureCards,
  whyChooseHeading: d.whyChooseHeading,
  whyChooseSubhead: d.whyChooseSubhead,
  benefitRows: d.benefitRows,
  typewriterPhrases: d.typewriterPhrases,
  processHeading: d.processHeading,
  processSubhead: d.processSubhead,
  processSteps: d.processSteps,
  portfolioRows: d.portfolioRows,
  integrationHeading: d.integrationHeading,
  integrationSubhead: d.integrationSubhead,
  integrationVideo: d.integrationVideo,
  integrationVideoPoster: d.integrationVideoPoster,
  integrationIcons: d.integrationIcons,
  pricingHeading: d.pricingHeading,
  pricingSubhead: d.pricingSubhead,
  pricingTiers: d.pricingTiers,
  testimonial: d.testimonial,
  faqHeading: d.faqHeading,
  faqSubhead: d.faqSubhead,
  faqVideo: d.faqVideo,
  faqVideoPoster: d.faqVideoPoster,
  faqs: d.faqs,
  blogHeading: d.blogHeading,
  blogSubhead: d.blogSubhead,
  blogPosts: d.blogPosts,
  contactHeading: d.contactHeading,
  contactSubhead: d.contactSubhead,
  contactPhone: d.contactPhone,
  contactEmail: d.contactEmail,
  contactAddress: d.contactAddress,
  contactVideo: d.contactVideo,
  contactVideoPoster: d.contactVideoPoster,
  closingCtaHeading: d.closingCtaHeading,
  closingCtaSubhead: d.closingCtaSubhead,
  aboutHeading: d.aboutHeading,
  aboutHighlightWord: d.aboutHighlightWord,
  aboutHeaderVideo: d.aboutHeaderVideo,
  aboutHeaderVideoPoster: d.aboutHeaderVideoPoster,
  aboutPhotoStrip: d.aboutPhotoStrip,
  aboutStats: d.aboutStats,
  aboutValuesIntro: d.aboutValuesIntro,
  aboutValues: d.aboutValues,
  leadershipHeading: d.leadershipHeading,
  leadershipSubhead: d.leadershipSubhead,
  teamMembers: d.teamMembers,
  careersHeading: d.careersHeading,
  careersSubhead: d.careersSubhead,
  careersCtaLabel: d.careersCtaLabel,
  careersVideo: d.careersVideo,
  careersVideoPoster: d.careersVideoPoster,
  legalVersion: d.legalVersion,
  privacyPolicySections: d.privacyPolicySections,
  termsSections: d.termsSections,
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
    footerCopyright: `© ${new Date().getFullYear()} ${text(brand.name, d.footerCopyright)}`,
    heroEyebrow: text(hero.eyebrow, d.heroEyebrow),
    heroSubhead: text(hero.subhead, d.heroSubhead),
    featureCards: list(
      content.highlights.map((s, i) => {
        const b = d.featureCards[i % d.featureCards.length] as unknown as Record<string, never>;
        return { ...b, title: s.title || b.title, description: s.body || b.description };
      }) as unknown as typeof d.featureCards,
      d.featureCards,
    ),
    benefitRows: list(
      content.highlights.map((s, i) => {
        const b = d.benefitRows[i % d.benefitRows.length] as unknown as Record<string, never>;
        return { ...b, title: s.title || b.title, description: s.body || b.description };
      }) as unknown as typeof d.benefitRows,
      d.benefitRows,
    ),
    processSteps: list(
      content.steps.map((s, i) => {
        const b = d.processSteps[i % d.processSteps.length] as unknown as Record<string, never>;
        return { ...b, number: s.number || numbered(i, b.number), title: s.title || b.title, description: s.body || b.description };
      }) as unknown as typeof d.processSteps,
      d.processSteps,
    ),
    portfolioRows: list(
      content.gallery.map((s, i) => {
        const b = d.portfolioRows[i % d.portfolioRows.length] as unknown as Record<string, never>;
        return { ...b, name: s.alt || b.name };
      }) as unknown as typeof d.portfolioRows,
      d.portfolioRows,
    ),
    pricingTiers: list(
      content.pricing.map((s, i) => {
        const b = d.pricingTiers[i % d.pricingTiers.length] as unknown as Record<string, never>;
        return { ...b, name: s.name || b.name, description: s.note || b.description, price: s.price || b.price };
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
    contactPhone: text(contact.phone, d.contactPhone),
    contactEmail: text(contact.email, d.contactEmail),
    contactAddress: text(contact.address, d.contactAddress),
    aboutPhotoStrip: list(
      content.gallery.map((s, i) => {
        const b = d.aboutPhotoStrip[i % d.aboutPhotoStrip.length] as unknown as Record<string, never>;
        return { ...b, src: s.src || b.src };
      }) as unknown as typeof d.aboutPhotoStrip,
      d.aboutPhotoStrip,
    ),
    aboutStats: list(
      content.stats.map((s, i) => {
        const b = d.aboutStats[i % d.aboutStats.length] as unknown as Record<string, never>;
        return { ...b, label: s.label || b.label, description: s.label || b.description };
      }) as unknown as typeof d.aboutStats,
      d.aboutStats,
    ),
    teamMembers: list(
      content.team.map((s, i) => {
        const b = d.teamMembers[i % d.teamMembers.length] as unknown as Record<string, never>;
        return { ...b, name: s.name || b.name, role: s.role || b.role };
      }) as unknown as typeof d.teamMembers,
      d.teamMembers,
    ),
  };
}
