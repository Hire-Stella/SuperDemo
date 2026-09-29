import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * fluxo's own content shape, and how shared content becomes it.
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
  HIGHLIGHTS: d.HIGHLIGHTS,
  STATS: d.STATS,
  SERVICES: d.SERVICES,
  CHECKOUT_DEMO: d.CHECKOUT_DEMO,
  GALLERY: d.GALLERY,
  TESTIMONIALS: d.TESTIMONIALS,
  CONTACT: d.CONTACT,
  FOOTER: d.FOOTER,
};

/** Non-empty wins, otherwise the template's own. */
const text = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
const list = <T>(v: T[] | undefined, fallback: T[]) => (v && v.length > 0 ? v : fallback);

/**
 * The source names itself mid-sentence in four spots beyond the nav/footer
 * wordmark — `HIGHLIGHTS.subhead`, `CONTACT.subhead`, the footer copyright
 * line, and one testimonial's own quote (see defaults.ts's own comments on
 * each). A tenant whose brand name lands only in the nav and nowhere else
 * reads as generated, not designed, so every literal "Fluxo" in those four
 * strings is re-templated here rather than left to drift from `SITE_NAME`.
 */
const withBrand = (s: string, name: string) => s.replace(/Fluxo/g, name);

export function adapt(content: TemplateContent): TemplateProps {
  const { brand, hero, contact } = content;
  const name = text(brand.name, d.SITE_NAME);
  return {
    ...DEFAULTS,
    SITE_NAME: name,
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
    HIGHLIGHTS: {
      ...d.HIGHLIGHTS,
      subhead: withBrand(d.HIGHLIGHTS.subhead, name),
      items: list(
        content.highlights.map((h, i) => {
          const b = d.HIGHLIGHTS.items[i % d.HIGHLIGHTS.items.length];
          return {
            title: h.title || b.title,
            body: h.body || b.body,
            icon: h.icon || b.icon,
            image: h.image?.src || b.image,
          };
        }),
        d.HIGHLIGHTS.items,
      ),
    },
    /**
     * Live dashboard-preview numbers, not tied to a service item — see
     * defaults.ts's own note on why these are real DOM text in the source
     * rather than another raster crop.
     */
    STATS: list(
      content.stats.map((s, i) => {
        const b = d.STATS[i % d.STATS.length];
        return { value: s.value || b.value, label: s.label || b.label };
      }),
      d.STATS,
    ),
    SERVICES: {
      ...d.SERVICES,
      items: list(
        content.services.map((s, i) => {
          const b = d.SERVICES.items[i % d.SERVICES.items.length];
          return {
            number: s.number || b.number,
            category: b.category,
            name: s.name || b.name,
            price: s.price || b.price,
            body: s.body || b.body,
          };
        }),
        d.SERVICES.items,
      ),
    },
    GALLERY: {
      ...d.GALLERY,
      subhead: withBrand(d.GALLERY.subhead, name),
      images: list(
        content.gallery.map((g) => ({ src: g.src, alt: g.alt || `${name} integration` })),
        d.GALLERY.images,
      ),
    },
    /**
     * `withBrand` runs on the *resolved* list, after the tenant/fallback
     * choice — not inside the `.map()` over `content.testimonials` — since
     * an empty `content.testimonials` (the common case for a demo tenant)
     * makes `list()` return `d.TESTIMONIALS` verbatim, and every one of its
     * nine quotes names the source's own brand (see defaults.ts's own
     * note). Applying the replace only inside that map would silently skip
     * all nine whenever no tenant testimonial was supplied.
     */
    TESTIMONIALS: list(
      content.testimonials.map((t, i) => {
        const b = d.TESTIMONIALS[i % d.TESTIMONIALS.length];
        return {
          quote: t.quote || b.quote,
          author: t.author || b.author,
          role: t.role || b.role,
          image: t.image?.src || b.image,
        };
      }),
      d.TESTIMONIALS,
    ).map((t) => ({ ...t, quote: withBrand(t.quote, name) })),
    CONTACT: {
      ...d.CONTACT,
      subhead: withBrand(d.CONTACT.subhead, name),
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
      copyright: withBrand(d.FOOTER.copyright, name),
    },
  };
}
