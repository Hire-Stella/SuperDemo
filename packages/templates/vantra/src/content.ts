import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * vantra's own content shape, and how shared content becomes it.
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
  NAV_CTA: d.NAV_CTA,
  HERO: d.HERO,
  TRUST: d.TRUST,
  COMPARISON: d.COMPARISON,
  HIGHLIGHTS: d.HIGHLIGHTS,
  ABOUT: d.ABOUT,
  STEPS: d.STEPS,
  SECURITY: d.SECURITY,
  STATS: d.STATS,
  TESTIMONIALS: d.TESTIMONIALS,
  PRICING: d.PRICING,
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
  const siteName = text(brand.name, d.SITE_NAME);

  return {
    ...DEFAULTS,
    SITE_NAME: siteName,
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
    /**
     * The source's own copy literally names the brand in both labels
     * ("Before Vantra" / "After Vantra") — threaded with `siteName` here so
     * a tenant's own business name appears exactly where the source's own
     * copy put its brand, falling back to the source's literal wording when
     * the tenant has no name yet.
     */
    COMPARISON: {
      ...d.COMPARISON,
      heading: text(content.headings.comparison?.heading, d.COMPARISON.heading),
      beforeLabel: brand.name ? `Before ${siteName}` : d.COMPARISON.beforeLabel,
      afterLabel: brand.name ? `After ${siteName}` : d.COMPARISON.afterLabel,
      before: list(content.comparison?.before, d.COMPARISON.before),
      after: list(content.comparison?.after, d.COMPARISON.after),
    },
    HIGHLIGHTS: {
      ...d.HIGHLIGHTS,
      title: text(content.headings.highlights?.heading, d.HIGHLIGHTS.title),
      subhead: text(content.headings.highlights?.subhead, d.HIGHLIGHTS.subhead),
      items: list(
        content.highlights.map((h, i) => {
          const b = d.HIGHLIGHTS.items[i % d.HIGHLIGHTS.items.length];
          return {
            title: h.title || b.title,
            body: h.body || b.body,
            icon: h.image?.src || h.icon || b.icon,
            image: h.image?.src || b.image,
            tags: b.tags,
          };
        }),
        d.HIGHLIGHTS.items,
      ),
    },
    ABOUT: about
      ? {
          ...d.ABOUT,
          eyebrow: text(about.eyebrow, d.ABOUT.eyebrow),
          heading: text(about.heading, d.ABOUT.heading),
          body: text(about.body, d.ABOUT.body),
          image: about.image?.src ? about.image.src : d.ABOUT.image,
          cta: about.cta ? { label: about.cta.label, href: about.cta.href } : d.ABOUT.cta,
          stats: list(about.stats, d.ABOUT.stats),
        }
      : d.ABOUT,
    STEPS: {
      ...d.STEPS,
      items: list(
        content.steps.map((s, i) => {
          const b = d.STEPS.items[i % d.STEPS.items.length];
          return {
            number: s.number || numbered(i, b.number),
            title: s.title || b.title,
            body: s.body || b.body,
          };
        }),
        d.STEPS.items,
      ),
    },
    STATS: {
      ...d.STATS,
      items: list(
        content.stats.map((s, i) => {
          const b = d.STATS.items[i % d.STATS.items.length];
          return { value: s.value || b.value, label: s.label || b.label, body: b.body, icon: b.icon };
        }),
        d.STATS.items,
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
    PRICING: {
      ...d.PRICING,
      tiers: list(
        content.pricing.map((p, i) => {
          const b = d.PRICING.tiers[i % d.PRICING.tiers.length];
          return {
            name: p.name || b.name,
            note: p.note || b.note,
            price: p.price || b.price,
            priceSuffix: b.priceSuffix,
            badge: b.badge,
            cta: p.cta ? { label: p.cta.label, href: p.cta.href } : b.cta,
            featured: p.featured,
            features: list(p.features, b.features),
          };
        }),
        d.PRICING.tiers,
      ),
    },
    FAQ: {
      ...d.FAQ,
      items: list(content.faq, d.FAQ.items),
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
