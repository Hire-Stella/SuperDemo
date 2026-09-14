import { TemplateContent } from '@stella/template-schema';
import type { Site } from '@/components/site/parts';

/**
 * A centre's page, in the shape the template library expects.
 *
 * Two content schemas exist because they answer to different owners.
 * `SiteContent` is ours: it is what the scraper produces, what the editor
 * writes, and what the database stores, and it changes when our pipeline
 * does. `TemplateContent` belongs to the library, which also serves
 * ai-employees-v2 and must not move every time our scrape learns a new field.
 *
 * So this is the seam, and it lives here rather than in the library: the
 * library should not know what a SuperDemo `Site` is.
 */
export function toTemplateContent(site: Site): TemplateContent {
  const c = site.content;

  /*
   * The headline arrives as one sentence and several templates set each line
   * separately to control where it breaks. Splitting on clause boundaries
   * reads better than one long line squeezed into a four-line slot, and a
   * headline with no punctuation stays whole rather than being chopped
   * arbitrarily.
   */
  const headline = (c.hero.headline || site.name)
    .split(/(?<=[—–:,])\s+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return TemplateContent.parse({
    brand: {
      name: site.name,
      tagline: site.tagline ?? '',
      logo: site.logoUrl ? { src: site.logoUrl, alt: site.name } : null,
    },
    nav: c.sections
      .filter((s) => s !== 'contact')
      .slice(0, 5)
      .map((s) => ({ label: SECTION_LABELS[s] ?? s, href: `#${s}` })),
    hero: {
      eyebrow: c.hero.eyebrow ?? '',
      headline: headline.length ? headline : [site.name],
      subhead: c.hero.subhead ?? '',
      primaryCta: site.phoneE164
        ? { label: c.hero.primaryCta?.label || 'Call us', href: `tel:${site.phoneE164}` }
        : null,
      secondaryCta: c.contact.showForm
        ? { label: c.hero.secondaryCta?.label || 'Request a callback', href: '#contact' }
        : null,
      // The tenant's own mark, never the template's — an unbranded giant
      // wordmark from somebody else's demo is worse than no treatment at all.
      giantText: site.name.toUpperCase(),
      image: null,
    },
    about: {
      heading: c.proof?.quote?.text ? '' : '',
      body: '',
      stats: (c.proof?.stats ?? []).map((s) => ({ value: s.value, label: s.label })),
    },
    highlights: c.highlights.map((h) => ({ title: h.title, body: h.body })),
    services: c.services.map((s) => ({ name: s.name, body: s.body ?? '' })),
    steps: (c.steps ?? []).map((s) => ({ title: s.title, body: s.body ?? '' })),
    gallery: (c.gallery ?? []).map((src) => ({ src, alt: site.name })),
    stats: (c.proof?.stats ?? []).map((s) => ({ value: s.value, label: s.label })),
    /*
     * Testimonials and pricing pass through untouched and are never
     * synthesised anywhere upstream. A fabricated testimonial puts words in a
     * named person's mouth on their own site, and an invented price is a
     * number their customer will hold them to.
     */
    testimonials: (c.testimonials ?? []).map((t) => ({
      quote: t.quote,
      author: t.author,
      role: t.role ?? '',
    })),
    pricing: (c.pricing ?? []).map((p) => ({
      name: p.name,
      price: p.price,
      note: p.note ?? '',
      features: p.features ?? [],
    })),
    comparison: c.comparison
      ? {
          beforeLabel: c.comparison.beforeLabel,
          afterLabel: c.comparison.afterLabel,
          before: c.comparison.before,
          after: c.comparison.after,
        }
      : null,
    faq: c.faq.map((f) => ({ q: f.q, a: f.a })),
    contact: {
      phone: site.phoneE164 ?? '',
      email: c.contact.email ?? '',
      address: c.contact.address ?? '',
      hours: c.contact.hours ?? '',
      showForm: c.contact.showForm,
      formNote: c.contact.formNote ?? '',
    },
    footerNote: c.footerNote ?? '',
    sections: c.sections.filter((s) => TEMPLATE_SECTIONS.has(s)),
    theme: { mode: 'auto' },
  });
}

/*
 * Our section keys and the library's overlap but are not identical — ours
 * carries `proof`, the library calls the same band `stats`. Only the shared
 * ones are forwarded; an unknown key would fail the library's enum and take
 * down a public page over a vocabulary difference.
 */
const TEMPLATE_SECTIONS = new Set<string>([
  'hero', 'about', 'highlights', 'services', 'steps', 'gallery', 'stats',
  'testimonials', 'pricing', 'comparison', 'team', 'faq', 'contact',
]);

const SECTION_LABELS: Record<string, string> = {
  highlights: 'Why us',
  services: 'Services',
  steps: 'How it works',
  gallery: 'Gallery',
  testimonials: 'Reviews',
  pricing: 'Pricing',
  faq: 'FAQ',
  proof: 'Results',
};
