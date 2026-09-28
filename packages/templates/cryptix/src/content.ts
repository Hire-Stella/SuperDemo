import type { TemplateContent } from '@stella/template-schema';
import * as d from './defaults';

/**
 * cryptix's own content shape, and how shared content becomes it.
 *
 * The template keeps its shape rather than being bent into the schema's: it
 * was built against one source site and wants what that site had. Fields the
 * schema cannot fill keep the template's own copy. Empty means "keep what
 * the template has", never "render nothing".
 *
 * Listed explicitly rather than derived via `typeof d` (see kiln): this
 * module also exports brand-name template functions (`heroSubhead`,
 * `faqQ1`, …) that are not content fields, and a blanket `typeof d` would
 * drag them into the content shape.
 */
export type TemplateProps = {
  TEMPLATE_CREDIT: string;
  SOCIAL_LINKS: typeof d.SOCIAL_LINKS;
  SITE_NAME: string;
  NAV_LINKS: typeof d.NAV_LINKS;
  HERO: typeof d.HERO;
  TICKER: typeof d.TICKER;
  FEATURES: typeof d.FEATURES;
  SHOWCASE_PANELS: typeof d.SHOWCASE_PANELS;
  STEPS: typeof d.STEPS;
  BENEFITS: typeof d.BENEFITS;
  TESTIMONIALS: typeof d.TESTIMONIALS;
  PRICING: typeof d.PRICING;
  FAQ: typeof d.FAQ;
  CONTACT: typeof d.CONTACT;
  FOOTER: typeof d.FOOTER;
};

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export const DEFAULTS: TemplateProps = {
  TEMPLATE_CREDIT: d.TEMPLATE_CREDIT,
  SOCIAL_LINKS: d.SOCIAL_LINKS,
  SITE_NAME: d.SITE_NAME,
  NAV_LINKS: d.NAV_LINKS,
  HERO: d.HERO,
  TICKER: d.TICKER,
  FEATURES: d.FEATURES,
  SHOWCASE_PANELS: d.SHOWCASE_PANELS,
  STEPS: d.STEPS,
  BENEFITS: d.BENEFITS,
  TESTIMONIALS: d.TESTIMONIALS,
  PRICING: d.PRICING,
  FAQ: d.FAQ,
  CONTACT: d.CONTACT,
  FOOTER: d.FOOTER,
};

/** Non-empty wins, otherwise the template's own. */
const text = (v: string | undefined, fallback: string) => (v && v.trim() ? v : fallback);
const list = <T>(v: T[] | undefined, fallback: T[]) => (v && v.length > 0 ? v : fallback);

export function adapt(content: TemplateContent): TemplateProps {
  const { brand, hero, about, contact } = content;

  /**
   * Every one of the source's own bands that names the brand mid-sentence
   * (see defaults.ts's header note) is recomputed here against the real
   * tenant name — not read off `d.HERO.subhead` etc., which is frozen on
   * the literal word "Cryptix" at module load. Falling back to the frozen
   * string would thread the tenant's name into the nav and footer only and
   * leave "Cryptix" sitting in the hero, the FAQ and the final CTA — the
   * exact half-measure this port is written to avoid.
   */
  const finalName = text(brand.name, d.SITE_NAME);
  const heroSubheadDefault = d.heroSubhead(finalName);
  const whyChooseTitleDefault = d.whyChooseHeading(finalName);
  const testimonialsSubheadDefault = d.testimonialsSubhead(finalName);
  const faqTitleDefault = d.faqHeading(finalName);
  const faqQ1Default = d.faqQ1(finalName);
  const faqA1Default = d.faqA1(finalName);
  const faqQ5Default = d.faqQ5(finalName);
  const faqA5Default = d.faqA5(finalName);
  const finalCtaBodyDefault = d.finalCtaBody(finalName);
  const footerTaglineDefault = d.footerTagline(finalName);
  const brandedFaqDefaults = d.FAQ.items.map((item, i) => {
    if (i === 0) return { q: faqQ1Default, a: faqA1Default };
    if (i === 4) return { q: faqQ5Default, a: faqA5Default };
    return item;
  });

  return {
    ...DEFAULTS,
    SITE_NAME: finalName,
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
      subhead: text(hero.subhead, heroSubheadDefault),
      primaryCta: hero.primaryCta
        ? { label: hero.primaryCta.label, href: hero.primaryCta.href }
        : d.HERO.primaryCta,
      secondaryCta: hero.secondaryCta
        ? { label: hero.secondaryCta.label, href: hero.secondaryCta.href }
        : d.HERO.secondaryCta,
      image: hero.image?.src ? hero.image.src : d.HERO.image,
    },
    /**
     * TICKER and FEATURES are the source's own fixed product chrome — a
     * live market ticker and the three feature cards built around it carry
     * no tenant-editable text in the source itself beyond what a real price
     * feed would supply, so both render literally, the same way kiln's
     * ABOUT.years render unconditionally regardless of tenant content.
     */
    SHOWCASE_PANELS: about
      ? [
          {
            ...d.SHOWCASE_PANELS[0],
            eyebrow: text(about.eyebrow, d.SHOWCASE_PANELS[0].eyebrow),
            heading: text(about.heading, d.SHOWCASE_PANELS[0].heading),
            body: text(about.body, d.SHOWCASE_PANELS[0].body),
            image: about.image?.src ? about.image.src : d.SHOWCASE_PANELS[0].image,
            cta: about.cta ? { label: about.cta.label, href: about.cta.href } : d.SHOWCASE_PANELS[0].cta,
          },
          d.SHOWCASE_PANELS[1],
          d.SHOWCASE_PANELS[2],
        ]
      : d.SHOWCASE_PANELS,
    STEPS: {
      ...d.STEPS,
      items: list(
        content.steps.map((s, i) => {
          const b = d.STEPS.items[i % d.STEPS.items.length];
          return {
            number: s.number || b.number,
            title: s.title || b.title,
            body: s.body || b.body,
            image: b.image,
          };
        }),
        d.STEPS.items,
      ),
    },
    BENEFITS: {
      ...d.BENEFITS,
      title: whyChooseTitleDefault,
      items: list(
        content.highlights.map((h, i) => {
          const b = d.BENEFITS.items[i % d.BENEFITS.items.length];
          return {
            title: h.title || b.title,
            body: h.body || b.body,
            icon: h.icon || b.icon,
          };
        }),
        d.BENEFITS.items,
      ),
    },
    TESTIMONIALS: {
      ...d.TESTIMONIALS,
      subhead: testimonialsSubheadDefault,
      items: list(
        content.testimonials.map((t, i) => {
          const b = d.TESTIMONIALS.items[i % d.TESTIMONIALS.items.length];
          return {
            quote: t.quote || b.quote,
            author: t.author || b.author,
            role: t.role || b.role,
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
            ...b,
            name: p.name || b.name,
            priceMonthly: p.price || b.priceMonthly,
            priceYearly: p.price || b.priceYearly,
            note: p.note || b.note,
            features: list(p.features, b.features),
            cta: p.cta ? { label: p.cta.label, href: p.cta.href } : b.cta,
            featured: p.featured,
          };
        }),
        d.PRICING.tiers,
      ),
    },
    FAQ: {
      ...d.FAQ,
      title: faqTitleDefault,
      items: list(
        content.faq.map((f, i) => {
          // Items 0 and 4 name the brand in their default question/answer
          // (see faqQ1/faqA1/faqA5 in defaults.ts) — every other default
          // item is brand-neutral and can be read straight off `d.FAQ`.
          const b = brandedFaqDefaults[i % brandedFaqDefaults.length];
          return { q: f.q || b.q, a: f.a || b.a };
        }),
        brandedFaqDefaults,
      ),
    },
    CONTACT: {
      ...d.CONTACT,
      subhead: finalCtaBodyDefault,
      phone: text(contact.phone, d.CONTACT.phone),
      email: text(contact.email, d.CONTACT.email),
      address: text(contact.address, d.CONTACT.address),
      hours: text(contact.hours, d.CONTACT.hours),
      showForm: contact.showForm,
      formNote: text(contact.formNote, d.CONTACT.formNote),
    },
    FOOTER: {
      ...d.FOOTER,
      tagline: text(content.footerNote, footerTaglineDefault),
      navLinks: [{ ...d.FOOTER.navLinks[0], label: `Why ${finalName}?` }, ...d.FOOTER.navLinks.slice(1)],
      copyright: `${finalName}. All rights reserved.`,
    },
  };
}
