import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * sucre's own content shape, and how shared content becomes it.
 *
 * The template keeps its shape rather than being bent into the schema's: it
 * was built against one source site and wants what that site had. The
 * schema is the source, this is the sink, and the gap between them is the
 * point of having more than one template.
 *
 * Fields the schema cannot fill keep the template's own copy. Empty means
 * "keep what the template has", never "render nothing" — a blank band reads
 * as a broken build, the template's own words read as a demo not yet filled
 * in.
 */

/*
 * Derived from the defaults module rather than written out.
 *
 * Listing the fields by hand meant guessing each one's kind, and the guesses
 * were wrong wherever a template exported a number, a null, or a helper
 * function. `typeof d` is exactly right by construction. Only the scalars
 * the adapter actually replaces are widened — those are `const`, so
 * TypeScript infers their literal text and nothing else could be assigned.
 */
export type TemplateProps = Omit<typeof d, 'SITE_NAME'> & {
  SITE_NAME: string;
};

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export const DEFAULTS: TemplateProps = {
  TEMPLATE_CREDIT: d.TEMPLATE_CREDIT,
  SOCIAL_LINKS: d.SOCIAL_LINKS,
  SITE_NAME: d.SITE_NAME,
  NAV_LINKS: d.NAV_LINKS,
  HERO: d.HERO,
  ABOUT: d.ABOUT,
  STATS: d.STATS,
  SERVICES: d.SERVICES,
  HIGHLIGHTS: d.HIGHLIGHTS,
  PRICING: d.PRICING,
  TESTIMONIALS: d.TESTIMONIALS,
  GALLERY: d.GALLERY,
  FAQ: d.FAQ,
  CONTACT: d.CONTACT,
  FOOTER: d.FOOTER,
};

/** Non-empty wins, otherwise the template's own. */
const text = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
const list = <T>(v: T[] | undefined, fallback: T[]) => (v && v.length > 0 ? v : fallback);

/** A positional label that stays unique — see aurelia/tavola/forno for why. */
const numbered = (i: number, like: unknown) =>
  String(i + 1).padStart(String(like ?? '').length || 2, '0');

export function adapt(content: TemplateContent): TemplateProps {
  const { brand, hero, about, contact } = content;
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
    HERO: {
      ...d.HERO,
      eyebrow: text(hero.eyebrow, d.HERO.eyebrow),
      titleLines: list(hero.headline, d.HERO.titleLines),
      subhead: text(hero.subhead, d.HERO.subhead),
      primaryCta: hero.primaryCta
        ? { label: hero.primaryCta.label, href: hero.primaryCta.href }
        : d.HERO.primaryCta,
      secondaryCta: hero.secondaryCta
        ? { label: hero.secondaryCta.label, href: hero.secondaryCta.href }
        : d.HERO.secondaryCta,
      image: hero.image?.src ? hero.image.src : d.HERO.image,
    },
    ABOUT: about
      ? {
          ...d.ABOUT,
          eyebrow: text(about.eyebrow, d.ABOUT.eyebrow),
          heading: text(about.heading, d.ABOUT.heading),
          paragraphs: about.body ? [about.body] : d.ABOUT.paragraphs,
          image: about.image?.src ? about.image.src : d.ABOUT.image,
          cta: about.cta ? { label: about.cta.label, href: about.cta.href } : d.ABOUT.cta,
        }
      : d.ABOUT,
    STATS: {
      ...d.STATS,
      items: list(
        content.stats.map((s, i) => {
          const b = d.STATS.items[i % d.STATS.items.length];
          return { value: s.value || b.value, label: s.label || b.label };
        }),
        d.STATS.items,
      ),
    },
    SERVICES: {
      ...d.SERVICES,
      items: list(
        content.services.map((s, i) => {
          const b = d.SERVICES.items[i % d.SERVICES.items.length];
          return {
            number: s.number || numbered(i, b.number),
            name: s.name || b.name,
            price: s.price || b.price,
            body: s.body || b.body,
            cta: b.cta,
            image: s.image?.src || b.image,
          };
        }),
        d.SERVICES.items,
      ),
    },
    HIGHLIGHTS: {
      ...d.HIGHLIGHTS,
      items: list(
        content.highlights.map((h, i) => {
          const b = d.HIGHLIGHTS.items[i % d.HIGHLIGHTS.items.length];
          return { title: h.title || b.title, body: h.body || b.body, icon: h.icon || b.icon };
        }),
        d.HIGHLIGHTS.items,
      ),
    },
    PRICING: {
      ...d.PRICING,
      tiers: list(
        content.pricing.map((p, i) => {
          const b = d.PRICING.tiers[i % d.PRICING.tiers.length];
          return {
            name: p.name || b.name,
            price: p.price || b.price,
            note: p.note || b.note,
            features: list(p.features, b.features),
            cta: p.cta ? { label: p.cta.label, href: p.cta.href } : b.cta,
            featured: p.featured,
          };
        }),
        d.PRICING.tiers,
      ),
    },
    TESTIMONIALS: {
      ...d.TESTIMONIALS,
      items: list(
        content.testimonials.map((t, i) => {
          const b = d.TESTIMONIALS.items[i % d.TESTIMONIALS.items.length];
          return {
            quote: t.quote || b.quote,
            author: t.author || b.author,
            role: t.role || b.role,
            stars: b.stars,
            image: t.image?.src || b.image,
          };
        }),
        d.TESTIMONIALS.items,
      ),
    },
    GALLERY: {
      ...d.GALLERY,
      images: list(
        content.gallery.map((g) => ({ src: g.src, alt: g.alt || 'Sucre' })),
        d.GALLERY.images,
      ),
    },
    FAQ: {
      ...d.FAQ,
      items: list(
        content.faq.map((f, i) => {
          const b = d.FAQ.items[i % d.FAQ.items.length];
          return { q: f.q || b.q, a: f.a || b.a };
        }),
        d.FAQ.items,
      ),
    },
    CONTACT: {
      ...d.CONTACT,
      phone: text(contact.phone, d.CONTACT.phone),
      email: text(contact.email, d.CONTACT.email),
      address: text(contact.address, d.CONTACT.address),
      hours: text(contact.hours, d.CONTACT.hours),
      showForm: contact.showForm,
      formNote: text(contact.formNote, d.CONTACT.formNote),
    },
    FOOTER: {
      ...d.FOOTER,
      tagline: text(content.footerNote, d.FOOTER.tagline),
    },
  };
}
