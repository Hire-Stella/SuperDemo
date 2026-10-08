import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * forno's own content shape, and how shared content becomes it.
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
  SOCIAL_LINKS: d.SOCIAL_LINKS,
  SITE_NAME: d.SITE_NAME,
  NAV_LINKS: d.NAV_LINKS,
  ORDER_LABEL: d.ORDER_LABEL,
  HERO: d.HERO,
  LOCATIONS: d.LOCATIONS,
  SERVICES: d.SERVICES,
  PRICING: d.PRICING,
  TESTIMONIALS: d.TESTIMONIALS,
  CONTACT: d.CONTACT,
  FOOTER: d.FOOTER,
};

/** Non-empty wins, otherwise the template's own. */
const text = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
const list = <T>(v: T[] | undefined, fallback: T[]) => (v && v.length > 0 ? v : fallback);

/** A positional label that stays unique — see momentum/rescale/tavola for why. */
const numbered = (i: number, like: unknown) =>
  String(i + 1).padStart(String(like ?? '').length || 2, '0');

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
    },
    LOCATIONS: {
      ...d.LOCATIONS,
      items: list(
        content.highlights.map((h, i) => {
          const b = d.LOCATIONS.items[i % d.LOCATIONS.items.length];
          return { title: h.title || b.title, body: h.body || b.body, icon: b.icon };
        }),
        d.LOCATIONS.items,
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
            image: s.image?.src || b.image,
          };
        }),
        d.SERVICES.items,
      ),
    },
    PRICING: {
      ...d.PRICING,
      items: list(
        content.pricing.map((p, i) => {
          const b = d.PRICING.items[i % d.PRICING.items.length];
          return {
            name: p.name || b.name,
            price: p.price || b.price,
            note: p.note || b.note,
            features: list(p.features, b.features),
            featured: p.featured,
          };
        }),
        d.PRICING.items,
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
            image: t.image?.src || b.image,
          };
        }),
        d.TESTIMONIALS.items,
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
