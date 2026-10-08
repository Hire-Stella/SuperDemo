import { z } from 'zod';
import { DograhWidgetDto } from './dograh';
import { Industry } from './enums';
import { ThemePreset, ThemeTokens } from './themes';

/**
 * Tenant landing pages.
 *
 * Every centre on the platform gets a public page, provisioned with the centre
 * itself. The reason is not that anyone needs another website builder — it is
 * that a demo has to start somewhere a visitor would actually arrive, and a
 * landing page whose "Call us" button rings a real queue and whose callback form
 * drops a real contact into the dialler is the whole product in one screen.
 *
 * Two ideas are kept apart deliberately:
 *
 *  * **Template** is layout — which sections exist, in what arrangement, with
 *    what emphasis. Four of them.
 *  * **Theme** is colour, and already exists per tenant in themes.ts.
 *
 * Keeping them orthogonal is the same discipline `palette()` applies in
 * themes.ts: four templates across eight themes reads as thirty-two looks
 * without thirty-two things to maintain. Content is stored template-agnostically
 * for the same reason — switching template must never lose a sentence anyone
 * wrote.
 */

/**
 * Every landing layout a centre can be put on.
 *
 * The first four are in-house. The nine after them are ported designs from
 * Hire-Stella/landing-templates — real finished pages that fill themselves from
 * this centre's content rather than being assembled from our own parts. They
 * are listed here rather than read from the library at runtime because the
 * stored value is a database column: it has to be a closed set the API can
 * validate, and a template that disappears upstream must fail a save rather
 * than a page render.
 */
export const SiteTemplate = z.enum([
  'solaris',
  'sentira',
  'knotch',
  'nudge',
  'sanvera',
  'momentum',
  'reodental',
  'tripvanta',
  'elianvalen',
  'rescale',
  'stackgrid',
  'utomic',
  'zova',
  'tavola',
  'forno',
  'aurelia',
  'brasa',
  'yokai',
  'natsu',
  'kiln',
  'folio',
  'pearl',
  'sucre',
  'oscar',
  'cryptix',
  'fluxo',
  'insunet',
  'summit',
  'vantra',
]);
export type SiteTemplate = z.infer<typeof SiteTemplate>;

/**
 * One template, deliberately.
 *
 * This used to be four layouts × 108 treatments, on the theory that a demo
 * should not look like the last demo. In practice every new tenant needed
 * somebody to choose, and the choice was between four in-house layouts that
 * all looked in-house. A single ported design that is already finished beats
 * four that need taste applied — so the picker is gone and the enum has one
 * member.
 *
 * It is still an enum and still a `Record`, so adding the second ported design
 * is the same two-step as before (see
 * apps/web/components/site/templates/types.ts) and the compiler still refuses
 * a half-added one.
 */
export interface SiteTemplateDefinition {
  label: string;
  /** What this layout is for, shown beside the picker. */
  note: string;
  /** Which vertical it suits, so the provisioning default is not arbitrary. */
  bestFor: string;
  /**
   * Verticals this design was actually built to suit, for filtering the
   * picker. Unset means general-purpose — the four in-house layouts (solaris,
   * sentira, knotch, nudge) are deliberately untagged so they keep showing up
   * for every industry, the same "fits anything" role they already play as
   * the platform's own fallback layouts.
   */
  industries?: Industry[];
}

export const SITE_TEMPLATES: Record<SiteTemplate, SiteTemplateDefinition> = {
  solaris: {
    label: 'Solaris',
    note: 'Bright sky hero, oversized grotesk headline, lime accents, soft cards.',
    bestFor: 'Consumer services — homes, health, anything friendly',
  },
  sentira: {
    label: 'Sentira',
    note: 'Near-black with an enormous serif display. Quiet everywhere else.',
    bestFor: 'Studios and consultancies — anyone selling judgement',
  },
  knotch: {
    label: 'Knotch',
    note: 'Pure black slab inset in the viewport, starfield, tight sans display.',
    bestFor: 'Technical services and AI — anyone selling capability',
  },
  nudge: {
    label: 'Nudge',
    note: 'White blueprint grid, ultra-heavy left-ranged headline, flat colour chips.',
    bestFor: 'Creative and trades — anyone whose pitch is personality',
  },

  /* ---- ported from Hire-Stella/landing-templates ---- */
  sanvera: {
    label: 'Sanvera',
    note: 'Warm maroon and cream, oversized wordmark, editorial service list.',
    bestFor: 'Wellness, clinics, practices',
    industries: ['CLINIC'],
  },
  momentum: {
    label: 'Momentum',
    note: 'Bold photographic hero, big stat strip, numbered programme, pricing tiers.',
    bestFor: 'Fitness, coaching, training',
    industries: ['FITNESS'],
  },
  reodental: {
    label: 'Reodental',
    note: 'Clinical and calm — treatment cards, team portraits, trust stats.',
    bestFor: 'Clinics and healthcare',
    industries: ['CLINIC'],
  },
  tripvanta: {
    label: 'Tripvanta',
    note: 'Imagery first, destination cards, itinerary steps, video bands.',
    bestFor: 'Travel, hospitality, venues',
    // No TRAVEL industry in the enum; "hospitality, venues" is closest to the
    // restaurant/hospitality cluster below.
    industries: ['RESTAURANT'],
  },
  elianvalen: {
    label: 'Elian Valen',
    note: 'Editorial and restrained — large imagery, product-led, quiet type.',
    bestFor: 'Retail, studios, portfolios',
    industries: ['RETAIL'],
  },
  rescale: {
    label: 'Rescale',
    note: 'SaaS marketing — process, integrations, performance stats, journal.',
    bestFor: 'Software and B2B services',
    industries: ['PROFESSIONAL'],
  },
  stackgrid: {
    label: 'Stackgrid',
    note: 'Technical and dense — monospace motifs, integration diagram.',
    bestFor: 'Developer and technical products',
    industries: ['PROFESSIONAL'],
  },
  utomic: {
    label: 'Utomic',
    note: 'Agency site — gradient hero, case studies, service detail, pricing.',
    bestFor: 'Agencies and consultancies',
    industries: ['PROFESSIONAL'],
  },
  zova: {
    label: 'Zova',
    note: 'Full marketing page — video hero, benefits, pricing, blog, contact.',
    bestFor: 'SaaS and product launches',
    industries: ['PROFESSIONAL'],
  },
  tavola: {
    label: 'Tavola',
    note: 'Dark, warm fine-dining — video hero, curated menu, gallery, reservation form.',
    bestFor: 'Restaurants and fine dining',
    industries: ['RESTAURANT'],
  },
  forno: {
    label: 'Forno',
    note: 'Bright, playful pizzeria — floating hero art, combo deals, chef reviews, location finder.',
    bestFor: 'Pizzerias, casual and fast-casual restaurants',
    industries: ['RESTAURANT'],
  },
  aurelia: {
    label: 'Aurelia',
    note: 'Warm, jewel-toned all-day bistro — rated hero, sentence-style reservation form, chef roster.',
    bestFor: 'All-day bistros, brasseries, and family-friendly fine dining',
    industries: ['RESTAURANT'],
  },
  brasa: {
    label: 'Brasa',
    note: 'Bright, fire-lit Mexican street food — tilted photo-stack hero, unpriced dish cards, chef roster.',
    bestFor: 'Taquerias, street-food counters, and casual Mexican restaurants',
    industries: ['RESTAURANT'],
  },
  yokai: {
    label: 'Yokai',
    note: 'Late-night ramen & izakaya counter — edge-bleed hero, dark throughout, priced menu, rising steam.',
    bestFor: 'Ramen bars, izakayas, and late-night noodle counters',
    industries: ['RESTAURANT'],
  },
  natsu: {
    label: 'Natsu',
    note: 'Bright, airy coffee shop — priced drink menu, founding timeline, counter stats, single-barista team.',
    bestFor: 'Coffee shops and cafes',
    industries: ['RESTAURANT'],
  },
  kiln: {
    label: 'Kiln',
    note: 'Swiss-minimal, monochrome specialty coffee bar — quiet type, ink-black accent, no colour.',
    bestFor: 'Third-wave coffee bars and specialty roasters',
    industries: ['RESTAURANT'],
  },
  folio: {
    label: 'Folio',
    note: 'Print-poster cafe — giant auto-fit headlines, one cobalt ink, ruled hours and menu tables.',
    bestFor: 'Neighborhood cafes with a strong, simple identity',
    industries: ['RESTAURANT'],
  },
  pearl: {
    label: 'Pearl',
    note: 'Bubble-pop boba and specialty-drinks bar — taro and berry on milky cream, rising pearls.',
    bestFor: 'Boba shops and specialty-drinks bars',
    industries: ['RESTAURANT'],
  },
  sucre: {
    label: 'Sucre',
    note: 'Blush-and-gold patisserie — serif display, hot-pink accent, cake gallery, sweet memberships.',
    bestFor: 'Patisseries, bakeries, and dessert cafes',
    industries: ['RESTAURANT'],
  },
  oscar: {
    label: 'Oscar',
    note: 'Warm cream & forest green — institute marquee, department cards, mentor roster, flat course pricing.',
    bestFor: 'Vocational training institutes, education centres',
    industries: ['EDUCATION'],
  },
  cryptix: {
    label: 'Cryptix',
    note: 'Dark, glowing crypto exchange — live price ticker, non-custodial security messaging, tiered pricing.',
    bestFor: 'Crypto exchanges, wallets, and Web3 trading products',
    // No CRYPTO industry in the enum; closest cluster is the finance/B2B
    // software templates below.
    industries: ['PROFESSIONAL'],
  },
  fluxo: {
    label: 'Fluxo',
    note: 'Indigo-and-violet merchant payments product — dashboard hero, live stat cards, checkout-link mockup, integrations marquee.',
    bestFor: 'Payment platforms, invoicing SaaS, and fintech products',
    industries: ['PROFESSIONAL'],
  },
  insunet: {
    label: 'Insunet',
    note: 'Friendly insurtech page — cut-out hero photography, coverage-type cards, claims-first trust messaging, get-a-quote form.',
    bestFor: 'Insurance agencies and brokers',
    // No INSURANCE industry in the enum; closest cluster is the finance/B2B
    // software templates below.
    industries: ['PROFESSIONAL'],
  },
  summit: {
    label: 'Summit',
    note: 'Dark, gold-glow AI wealth platform — portfolio-growth hero, robo-advisor feature bands, plan pricing, looping investor testimonials.',
    bestFor: 'Wealth management and robo-advisor products',
    industries: ['PROFESSIONAL'],
  },
  vantra: {
    label: 'Vantra',
    note: 'AI-driven fintech / digital-investing platform — bento feature grid, before/after comparison, bento stat cards, subscription pricing.',
    bestFor: 'AI investment and portfolio-tracking products',
    industries: ['PROFESSIONAL'],
  },
};

/* ================================= style ================================== */

/**
 * How a layout is dressed.
 *
 * Template decides *what* is on the page; theme decides the palette; these four
 * axes decide the treatment. They exist because four layouts eventually all look
 * like the same four layouts — and because the first version of `bold` had a
 * hardcoded near-black hero, which meant one of the four templates ignored the
 * tenant's brand entirely. Everything here is emitted as CSS custom properties
 * that the templates read, so a template never branches on style and a new axis
 * needs no template changes.
 *
 * 4 surfaces × 3 display faces × 3 corner radii × 3 densities = 108 treatments,
 * across 4 layouts and 8 themes. That is the point: a demo should not look like
 * the last demo.
 */

/** The hero band's treatment. Everything below the hero stays on page colours. */
export const SiteSurface = z.enum(['plain', 'tint', 'ink', 'brand']);
export type SiteSurface = z.infer<typeof SiteSurface>;

export const SITE_SURFACE_LABELS: Record<SiteSurface, { label: string; note: string }> = {
  plain: { label: 'Plain', note: 'Hero on the page background. Quietest.' },
  tint: { label: 'Tinted', note: 'A wash of the brand colour behind the hero.' },
  ink: { label: 'Ink', note: 'Dark hero, tinted with the brand hue.' },
  brand: { label: 'Full brand', note: 'Hero in the brand colour itself. Loudest.' },
};

export const SiteDisplay = z.enum(['serif', 'sans', 'wide']);
export type SiteDisplay = z.infer<typeof SiteDisplay>;

export const SITE_DISPLAY_LABELS: Record<SiteDisplay, { label: string; note: string }> = {
  serif: { label: 'Serif', note: 'Editorial. Reads as established.' },
  sans: { label: 'Sans', note: 'Matches the dashboard. Reads as a product.' },
  wide: { label: 'Condensed', note: 'Tight and industrial, for big headlines.' },
};

export const SiteCorners = z.enum(['sharp', 'soft', 'round']);
export type SiteCorners = z.infer<typeof SiteCorners>;

export const SITE_CORNERS_LABELS: Record<SiteCorners, { label: string }> = {
  sharp: { label: 'Sharp' },
  soft: { label: 'Soft' },
  round: { label: 'Round' },
};

export const SiteDensity = z.enum(['compact', 'regular', 'airy']);
export type SiteDensity = z.infer<typeof SiteDensity>;

export const SITE_DENSITY_LABELS: Record<SiteDensity, { label: string }> = {
  compact: { label: 'Compact' },
  regular: { label: 'Regular' },
  airy: { label: 'Airy' },
};

export const SiteStyle = z.object({
  surface: SiteSurface.default('tint'),
  display: SiteDisplay.default('sans'),
  corners: SiteCorners.default('soft'),
  density: SiteDensity.default('regular'),
});
export type SiteStyle = z.infer<typeof SiteStyle>;

export const DEFAULT_SITE_STYLE: SiteStyle = {
  surface: 'tint',
  display: 'sans',
  corners: 'soft',
  density: 'regular',
};

/**
 * Display faces as local stacks, never webfonts.
 *
 * A landing page that silently falls back because a font CDN was unreachable is
 * worse than one that never asked. The cost of that choice is that every family
 * named here has to actually exist on the machine, which was worth measuring
 * rather than assuming: the first version of `wide` led with Haettenschweiler,
 * Helvetica Neue Condensed and Roboto Condensed, **none** of which is installed
 * on macOS — so one of the three options silently rendered identically to
 * `sans`. Widths measured in Chrome at 64px, against a fallback of 930px:
 *
 *   Avenir Next Condensed  773  ✓ macOS
 *   Arial Narrow           796  ✓ macOS + Windows
 *   Impact                 859  ✓ macOS + Windows
 *   Georgia                983  ✓ everywhere
 *   Haettenschweiler       930  ✗ fell back
 *   Roboto Condensed       930  ✗ fell back
 *
 * So the condensed stack leads with the two that resolve, keeps Impact as a
 * heavier third, and only then names the Linux/Android families.
 */
const DISPLAY_STACKS: Record<SiteDisplay, string> = {
  serif: `Georgia, 'Iowan Old Style', Charter, Palatino, ui-serif, serif`,
  sans: `var(--font-sans)`,
  wide: `'Avenir Next Condensed', 'Arial Narrow', Impact, 'Roboto Condensed', 'Liberation Sans Narrow', var(--font-sans)`,
};

/** Letter-spacing has to come down as the face gets narrower, or `wide` looks loose. */
const DISPLAY_TRACKING: Record<SiteDisplay, string> = {
  serif: '-0.022em',
  sans: '-0.032em',
  wide: '-0.01em',
};

const CORNER_RADII: Record<SiteCorners, string> = {
  sharp: '0.125rem',
  soft: '0.75rem',
  round: '1.5rem',
};

/** Vertical rhythm between sections, and the hero's own top and bottom. */
const DENSITY_SPACE: Record<SiteDensity, { section: string; hero: string }> = {
  compact: { section: '2.5rem', hero: '3.5rem' },
  regular: { section: '3.5rem', hero: '5rem' },
  airy: { section: '5.5rem', hero: '7.5rem' },
};

/**
 * The hero band's colours, per surface.
 *
 * Every one of these is derived from the tenant's own `--primary`, which is what
 * makes a layout follow its theme instead of merely sitting next to it. `ink` is
 * the interesting case: mixing the brand into a fixed dark base gives a
 * near-black that is recognisably *their* near-black, and it lands the same way
 * in light and dark mode — deriving it from `--foreground` instead would invert
 * under dark mode and turn the whole statement inside out.
 */
const SURFACE_TOKENS: Record<SiteSurface, Record<string, string>> = {
  plain: {
    'site-hero-bg': 'var(--background)',
    'site-hero-fg': 'var(--foreground)',
    'site-hero-dim': 'var(--muted-foreground)',
    'site-hero-line': 'var(--border)',
    'site-hero-accent': 'var(--primary)',
    'site-hero-btn-bg': 'var(--primary)',
    'site-hero-btn-fg': 'var(--primary-foreground)',
    'site-hero-card': 'var(--card)',
    'site-hero-wash': 'transparent',
  },
  tint: {
    'site-hero-bg': 'color-mix(in oklch, var(--primary) 8%, var(--background))',
    'site-hero-fg': 'var(--foreground)',
    'site-hero-dim': 'var(--muted-foreground)',
    'site-hero-line': 'color-mix(in oklch, var(--primary) 18%, var(--border))',
    'site-hero-accent': 'var(--primary)',
    'site-hero-btn-bg': 'var(--primary)',
    'site-hero-btn-fg': 'var(--primary-foreground)',
    'site-hero-card': 'var(--card)',
    'site-hero-wash': 'color-mix(in oklch, var(--primary) 14%, transparent)',
  },
  ink: {
    'site-hero-bg': 'color-mix(in oklch, var(--primary) 15%, oklch(0.17 0.014 265))',
    'site-hero-fg': 'oklch(0.985 0 0)',
    'site-hero-dim': 'oklch(0.985 0 0 / 65%)',
    'site-hero-line': 'oklch(1 0 0 / 15%)',
    // Lifted well above the dark ground so it stays legible as an accent.
    'site-hero-accent': 'color-mix(in oklch, var(--primary) 62%, oklch(0.97 0 0))',
    'site-hero-btn-bg': 'oklch(0.99 0 0)',
    'site-hero-btn-fg': 'oklch(0.18 0 0)',
    'site-hero-card': 'oklch(1 0 0 / 8%)',
    'site-hero-wash': 'color-mix(in oklch, var(--primary) 30%, transparent)',
  },
  brand: {
    'site-hero-bg': 'var(--primary)',
    'site-hero-fg': 'var(--primary-foreground)',
    'site-hero-dim': 'color-mix(in oklch, var(--primary-foreground) 72%, var(--primary))',
    'site-hero-line': 'color-mix(in oklch, var(--primary-foreground) 25%, transparent)',
    'site-hero-accent': 'var(--primary-foreground)',
    'site-hero-btn-bg': 'var(--primary-foreground)',
    'site-hero-btn-fg': 'var(--primary)',
    'site-hero-card': 'color-mix(in oklch, var(--primary-foreground) 12%, transparent)',
    'site-hero-wash': 'color-mix(in oklch, var(--primary-foreground) 16%, transparent)',
  },
};

/**
 * Whether the hero band is a dark surface.
 *
 * Only needed for the two things a colour token cannot express: which way a
 * native `<select>`'s OS-drawn popup should be coloured, and whether a decorative
 * white overlay should be lightening or darkening. Everything else reads tokens.
 */
export function isDarkSurface(surface: SiteSurface): boolean {
  return surface === 'ink' || surface === 'brand';
}

/** Serialises a style into the custom properties the templates consume. */
export function siteStyleToCss(style: SiteStyle): string {
  const vars: Record<string, string> = {
    'font-display-face': DISPLAY_STACKS[style.display],
    'site-display-tracking': DISPLAY_TRACKING[style.display],
    radius: CORNER_RADII[style.corners],
    'site-section-y': DENSITY_SPACE[style.density].section,
    'site-hero-y': DENSITY_SPACE[style.density].hero,
    ...SURFACE_TOKENS[style.surface],
  };

  return `:root{${Object.entries(vars)
    .map(([k, v]) => `--${k}:${v};`)
    .join('')}}`;
}

/**
 * Curated combinations.
 *
 * The axes above allow treatments that are merely odd — condensed type on an airy
 * plain surface reads as an unfinished page rather than a choice. These are the
 * ones worth starting from, so a demo takes one click and still looks like
 * somebody decided. Every axis stays individually editable underneath.
 */
export interface SiteLook {
  key: string;
  label: string;
  note: string;
  template: SiteTemplate;
  style: SiteStyle;
  /** Left unset where a look works with whatever theme the centre already has. */
  themePreset?: string;
}

export const SITE_LOOKS: SiteLook[] = [
  {
    key: 'establishment',
    label: 'Establishment',
    note: 'Serif on a quiet tint. Institutes, chambers, clinics with a history.',
    template: 'solaris',
    style: { surface: 'tint', display: 'serif', corners: 'sharp', density: 'airy' },
  },
  {
    key: 'showroom',
    label: 'Showroom',
    note: 'Dark hero, brand-tinted, big numbers. Gyms and consumer brands.',
    template: 'solaris',
    style: { surface: 'ink', display: 'sans', corners: 'soft', density: 'regular' },
  },
  {
    key: 'statement',
    label: 'Statement',
    note: 'Condensed type on full brand colour. Impossible to mistake for anyone else.',
    template: 'solaris',
    style: { surface: 'brand', display: 'wide', corners: 'sharp', density: 'regular' },
  },
  {
    key: 'conversion',
    label: 'Conversion',
    note: 'Form above the fold, tight and plain. Built to collect numbers.',
    template: 'solaris',
    style: { surface: 'tint', display: 'sans', corners: 'round', density: 'compact' },
  },
  {
    key: 'frontdesk',
    label: 'Front desk',
    note: 'Hours and phone first, nothing in the way. Clinics and restaurants.',
    template: 'solaris',
    style: { surface: 'plain', display: 'sans', corners: 'soft', density: 'compact' },
  },
  {
    key: 'boutique',
    label: 'Boutique',
    note: 'Serif on brand colour, generous spacing. Salons, hospitality, private practice.',
    template: 'solaris',
    style: { surface: 'brand', display: 'serif', corners: 'round', density: 'airy' },
  },
];

/** The treatment a vertical starts on, so provisioning is not arbitrary. */
export function defaultStyleForIndustry(industry: Industry): SiteStyle {
  switch (industry) {
    case 'FITNESS':
    case 'RETAIL':
      return { surface: 'ink', display: 'sans', corners: 'soft', density: 'regular' };
    case 'EDUCATION':
    case 'PROFESSIONAL':
      return { surface: 'tint', display: 'serif', corners: 'sharp', density: 'airy' };
    case 'CLINIC':
      return { surface: 'plain', display: 'sans', corners: 'soft', density: 'compact' };
    case 'RESTAURANT':
      return { surface: 'brand', display: 'serif', corners: 'round', density: 'regular' };
    default:
      return DEFAULT_SITE_STYLE;
  }
}

/* ============================= the URL space ============================== */

/**
 * Slugs a centre may not have.
 *
 * A landing page lives at `/{slug}`, which puts tenant handles in the same
 * namespace as the dashboard's own routes. Next resolves a static route ahead of
 * a dynamic one, so a centre called "Analytics" would take the slug `analytics`
 * and its page would be permanently shadowed by the dashboard's — with no error
 * anywhere to explain why. Cheaper to refuse the handle at creation than to
 * debug it later.
 *
 * Keep in step with the top level of apps/web/app. Listing a route that no
 * longer exists costs nothing; omitting one that does costs an invisible bug.
 */
export const RESERVED_SLUGS = new Set([
  // Dashboard routes.
  'login',
  'logout',
  'superadmin',
  'agents',
  'ai-agent',
  'analytics',
  'campaigns',
  'conversations',
  'knowledge',
  'settings',
  'simulator',
  'telecaller',
  'website',
  // Framework and convention.
  'api',
  '_next',
  'static',
  'assets',
  'public',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'manifest.json',
  '.well-known',
  // Reserved for the platform's own marketing, which will want them.
  'about',
  'pricing',
  'contact',
  'docs',
  'blog',
  'help',
  'support',
  'status',
  'admin',
  'platform',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/* ============================== content shape ============================= */

/**
 * The sections a page can carry, beyond the hero.
 *
 * The hero is not in this list because it is not optional — a landing page with
 * no hero is a broken page, not a configuration. Everything else can be hidden
 * by leaving it out of `sections`, and reordered by moving it, which is where
 * most of a builder's perceived flexibility lives at none of its cost.
 */
export const SiteSection = z.enum([
  'highlights',
  'services',
  'steps',
  'gallery',
  'testimonials',
  'pricing',
  'comparison',
  'proof',
  'faq',
  'contact',
]);
export type SiteSection = z.infer<typeof SiteSection>;

export const SITE_SECTION_LABELS: Record<SiteSection, string> = {
  highlights: 'Highlights',
  services: 'What we do',
  steps: 'How it works',
  gallery: 'Photographs',
  testimonials: 'What clients say',
  pricing: 'Pricing',
  comparison: 'Before and after',
  proof: 'Proof',
  faq: 'Questions',
  contact: 'Get in touch',
};

/** What the primary button does. `call` and `callback` are why this page exists. */
export const SiteCtaKind = z.enum(['call', 'callback', 'link']);
export type SiteCtaKind = z.infer<typeof SiteCtaKind>;

const Cta = z.object({
  label: z.string().min(1).max(40),
  kind: SiteCtaKind,
  /** Only for `link`. Ignored otherwise. */
  href: z.string().max(300).optional(),
});

export const SiteContent = z.object({
  hero: z.object({
    /** Small line above the headline. Empty hides it. */
    eyebrow: z.string().max(60).default(''),
    headline: z.string().min(1).max(120),
    subhead: z.string().max(320).default(''),
    primaryCta: Cta,
    secondaryCta: Cta.nullable().default(null),
  }),
  highlights: z
    .array(
      z.object({
        title: z.string().min(1).max(60),
        body: z.string().max(220),
      }),
    )
    .max(6)
    .default([]),
  services: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        body: z.string().max(220),
      }),
    )
    .max(8)
    .default([]),
  /**
   * A numbered "how it works" sequence.
   *
   * Its own section rather than reused highlights, because the two answer
   * different questions — highlights are reasons to trust you, steps are what
   * happens after someone rings. Layouts that have no place for a sequence
   * simply leave `steps` out of `sections`, which is the same way every other
   * section is opted into.
   *
   * Defaults to empty: a centre whose site does not describe a process should
   * not get an invented one.
   */
  steps: z
    .array(
      z.object({
        title: z.string().min(1).max(60),
        body: z.string().max(200).default(''),
      }),
    )
    .max(6)
    .default([]),
  /**
   * Photographs from the client's own site.
   *
   * Full-page clones need image bands — a case-study row, a split about
   * section — and one `og:image` does not fill them. The scraper collects the
   * large images off the pages it reads, so a gallery is the business's own
   * photography rather than stock. Absent, the bands are omitted.
   */
  gallery: z.array(z.string().max(400)).max(8).default([]),
  /**
   * Attributed quotes, only where the site actually publishes them.
   *
   * Never generated. A fabricated testimonial is a claim in a named person's
   * mouth on a client's own site, which is the one category of invention that
   * cannot be walked back.
   */
  testimonials: z
    .array(
      z.object({
        quote: z.string().min(1).max(400),
        author: z.string().max(60),
        role: z.string().max(80).default(''),
      }),
    )
    .max(6)
    .default([]),
  /**
   * Price tiers, only where the site publishes them.
   *
   * Same rule as testimonials and for the same reason: a made-up price is a
   * number a customer will hold the client to.
   */
  pricing: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        price: z.string().max(40).default(''),
        note: z.string().max(120).default(''),
        features: z.array(z.string().max(90)).max(8).default([]),
      }),
    )
    .max(4)
    .default([]),
  /**
   * A "before / after" band — the without-us versus with-us comparison several
   * of these designs close on. Derived from the site's own positioning.
   */
  comparison: z
    .object({
      beforeLabel: z.string().max(40).default('Without us'),
      afterLabel: z.string().max(40).default('With us'),
      before: z.array(z.string().max(120)).max(5).default([]),
      after: z.array(z.string().max(120)).max(5).default([]),
    })
    .default({ beforeLabel: 'Without us', afterLabel: 'With us', before: [], after: [] }),
  proof: z
    .object({
      stats: z
        .array(z.object({ value: z.string().max(16), label: z.string().max(48) }))
        .max(4)
        .default([]),
      quote: z
        .object({
          text: z.string().max(320),
          author: z.string().max(60),
          role: z.string().max(80).default(''),
        })
        .nullable()
        .default(null),
    })
    .default({ stats: [], quote: null }),
  faq: z
    .array(z.object({ q: z.string().min(1).max(160), a: z.string().max(600) }))
    .max(10)
    .default([]),
  contact: z
    .object({
      /** Blank means "use the centre's assigned number", resolved at render. */
      phoneOverride: z.string().max(24).default(''),
      email: z.string().max(120).default(''),
      address: z.string().max(200).default(''),
      hours: z.string().max(160).default(''),
      /** The form is the lead capture. Off makes this a brochure page. */
      showForm: z.boolean().default(true),
      formNote: z.string().max(200).default(''),
    })
    .default({
      phoneOverride: '',
      email: '',
      address: '',
      hours: '',
      showForm: true,
      formNote: '',
    }),
  /** Order and visibility. Unknown keys are ignored; absent keys are hidden. */
  sections: z.array(SiteSection).default(['highlights', 'services', 'proof', 'faq', 'contact']),
  footerNote: z.string().max(200).default(''),
});
export type SiteContent = z.infer<typeof SiteContent>;

/* ============================ per-vertical copy =========================== */

/**
 * Starter copy per industry.
 *
 * Written here rather than derived from INDUSTRY_TEMPLATES: that file describes
 * how a *contact centre* is provisioned — queues, an AI briefing, knowledge
 * placeholders — and squeezing marketing copy out of a 200-word knowledge
 * placeholder produces exactly the mush you would expect. These are separate
 * concerns that happen to be keyed by the same enum.
 *
 * `{{ORG}}` is substituted at provisioning time, the same convention the AI
 * briefings use. The copy is deliberately real rather than lorem, and
 * deliberately generic enough to be true of any business in the vertical — a
 * demo tenant should look finished, and anything more specific than this would
 * be a claim nobody checked.
 */
type LandingCopy = Omit<
  SiteContent,
  | 'sections'
  | 'contact'
  | 'footerNote'
  | 'steps'
  | 'gallery'
  | 'testimonials'
  | 'pricing'
  | 'comparison'
> & {
  template: SiteTemplate;
  /** Only the two fields a template can supply without inventing an address. */
  contact: Pick<SiteContent['contact'], 'hours' | 'formNote'>;
};

const LANDING_COPY: Record<Industry, LandingCopy> = {
  EDUCATION: {
    template: 'solaris',
    hero: {
      eyebrow: 'Admissions open',
      headline: 'Learn something that changes what you can do',
      subhead:
        'Courses built around working schedules, taught by people who have done the job. Speak to an admissions advisor and we will tell you honestly whether {{ORG}} is the right fit.',
      primaryCta: { label: 'Talk to admissions', kind: 'call' },
      secondaryCta: { label: 'Request a callback', kind: 'callback' },
    },
    highlights: [
      {
        title: 'Advisors, not salespeople',
        body: 'You will be told if a course is wrong for you. We would rather lose an enrolment than a reputation.',
      },
      {
        title: 'Schedules that fit work',
        body: 'Evening and weekend cohorts, with recordings for the sessions you have to miss.',
      },
      {
        title: 'Fees stated up front',
        body: 'One figure, instalment options explained before you commit to anything.',
      },
    ],
    services: [
      {
        name: 'Professional certifications',
        body: 'Structured programmes with assessment and a credential at the end.',
      },
      {
        name: 'Short courses',
        body: 'Four to eight weeks, aimed at one specific skill you need now.',
      },
      {
        name: 'Corporate training',
        body: 'Delivered at your office or ours, shaped around your team’s actual gaps.',
      },
    ],
    proof: {
      stats: [
        { value: '12 yrs', label: 'Teaching in the region' },
        { value: '4,000+', label: 'Learners enrolled' },
        { value: '<1 hr', label: 'Average reply to an enquiry' },
      ],
      quote: {
        text: 'I called expecting a sales pitch and got a straight answer about which course to take. That is why I enrolled.',
        author: 'Rahul M.',
        role: 'Enrolled on the professional certification',
      },
    },
    faq: [
      {
        q: 'How do I know which course to take?',
        a: 'Call us and describe what you are trying to do. An advisor will tell you which programme matches, or that none of them do.',
      },
      {
        q: 'Can I pay in instalments?',
        a: 'Yes. We will set out the schedule in writing before you pay anything.',
      },
      {
        q: 'What if I miss a session?',
        a: 'Sessions are recorded and released to your cohort, so you can catch up before the next one.',
      },
    ],
    contact: {
      hours: 'Sunday to Thursday, 9am – 6pm',
      formNote: 'An advisor will call you back — usually the same day.',
    },
  },

  CLINIC: {
    template: 'solaris',
    hero: {
      eyebrow: 'Appointments available this week',
      headline: 'Care that starts with someone answering the phone',
      subhead:
        'Book an appointment, ask about a result, or check whether we take your insurance. {{ORG}} answers every call — and if the person who can help is with a patient, we will ring you back.',
      primaryCta: { label: 'Call the clinic', kind: 'call' },
      secondaryCta: { label: 'Request a callback', kind: 'callback' },
    },
    highlights: [
      {
        title: 'Same-week appointments',
        body: 'Including evening slots, so you are not choosing between work and a check-up.',
      },
      {
        title: 'Insurance checked before you arrive',
        body: 'Tell us your provider on the phone and we will confirm cover, not guess at it.',
      },
      {
        title: 'No queue on hold',
        body: 'Calls are answered immediately. Anything clinical goes to a person, always.',
      },
    ],
    services: [
      {
        name: 'General practice',
        body: 'Consultations, prescriptions, referrals and routine follow-up.',
      },
      {
        name: 'Diagnostics',
        body: 'On-site tests with results explained by the doctor who ordered them.',
      },
      {
        name: 'Health screening',
        body: 'Annual packages for individuals and for company schemes.',
      },
    ],
    proof: {
      stats: [
        { value: 'Same week', label: 'Typical wait for an appointment' },
        { value: '9', label: 'Insurers accepted directly' },
        { value: '7 days', label: 'Open, including weekends' },
      ],
      quote: null,
    },
    faq: [
      {
        q: 'Do you take my insurance?',
        a: 'Call and tell us your provider — we will confirm whether we bill them directly before you book.',
      },
      {
        q: 'Can I speak to a doctor about a result?',
        a: 'Yes. Ask for a callback and the doctor who ordered the test will call you, not a receptionist reading a number.',
      },
      {
        q: 'Do I need an appointment?',
        a: 'Walk-ins are seen when there is a gap, but booking ahead means a time rather than a wait.',
      },
    ],
    contact: {
      hours: 'Open seven days, 8am – 9pm',
      formNote: 'Leave a number and we will call you back to book.',
    },
  },

  RESTAURANT: {
    template: 'solaris',
    hero: {
      eyebrow: 'Now taking bookings',
      headline: 'A table, a delivery, or a room for thirty',
      subhead:
        'Ring {{ORG}} and someone picks up — for a reservation tonight, a large group next month, or a question about what is in a dish.',
      primaryCta: { label: 'Book by phone', kind: 'call' },
      secondaryCta: { label: 'Ask us to call you', kind: 'callback' },
    },
    highlights: [
      {
        title: 'Bookings answered instantly',
        body: 'No form, no wait for a confirmation email. You know you have a table before you hang up.',
      },
      {
        title: 'Large groups handled properly',
        body: 'Set menus, private space and a named person looking after it.',
      },
      {
        title: 'Allergens answered honestly',
        body: 'Ask about any dish and you will get the ingredients, not a disclaimer.',
      },
    ],
    services: [
      { name: 'Reservations', body: 'Lunch and dinner, same day where we can fit you in.' },
      {
        name: 'Private events',
        body: 'Birthdays, team dinners and functions, with a set menu agreed in advance.',
      },
      {
        name: 'Delivery and collection',
        body: 'Order by phone for collection or delivery within the area.',
      },
    ],
    proof: {
      stats: [
        { value: '4.6★', label: 'Average across review sites' },
        { value: '30 sec', label: 'Typical time to answer' },
        { value: '60', label: 'Covers, plus a private room' },
      ],
      quote: null,
    },
    faq: [
      {
        q: 'Can I book for tonight?',
        a: 'Call us — same-day tables are usually available before 7pm and after 9pm.',
      },
      {
        q: 'Do you cater for allergies?',
        a: 'Yes. Tell us when you book and we will tell you which dishes work rather than improvising on the night.',
      },
      {
        q: 'Is there a private room?',
        a: 'There is, seating up to thirty. Ask for the events menu when you call.',
      },
    ],
    contact: {
      hours: 'Daily, noon – 11pm',
      formNote: 'Leave your number and we will call to confirm the booking.',
    },
  },

  PROFESSIONAL: {
    template: 'solaris',
    hero: {
      eyebrow: 'Consultations by appointment',
      headline: 'Advice you can act on, from someone who read the file',
      subhead:
        '{{ORG}} works with businesses and individuals who need a clear answer rather than a longer engagement. Tell us the situation and we will tell you what it involves.',
      primaryCta: { label: 'Arrange a consultation', kind: 'callback' },
      secondaryCta: { label: 'Call the office', kind: 'call' },
    },
    highlights: [
      {
        title: 'Scoped before it starts',
        body: 'You get the approach and the cost in writing before any work begins.',
      },
      {
        title: 'One point of contact',
        body: 'The person you speak to first stays on the matter. No handovers you find out about later.',
      },
      {
        title: 'Straight answers',
        body: 'If your position is weak, you will hear that from us early rather than expensively.',
      },
    ],
    services: [
      {
        name: 'Advisory',
        body: 'A defined question, researched and answered, with the reasoning shown.',
      },
      {
        name: 'Compliance and filings',
        body: 'Deadlines tracked and met, with reminders you do not have to chase.',
      },
      {
        name: 'Ongoing retainer',
        body: 'For businesses that need someone to call before making a decision, not after.',
      },
    ],
    proof: {
      stats: [
        { value: '24 hrs', label: 'To a first response' },
        { value: 'Fixed', label: 'Fees, agreed up front' },
        { value: '15 yrs', label: 'In practice' },
      ],
      quote: {
        text: 'They told us the case was not worth running. That cost them a fee and earned them every piece of work since.',
        author: 'Managing Director',
        role: 'Logistics company, Dubai',
      },
    },
    faq: [
      {
        q: 'What does a first consultation cost?',
        a: 'Tell us the situation on the phone and we will quote for it before you book. No open-ended hourly billing to find out whether we can help.',
      },
      {
        q: 'How quickly can you take something on?',
        a: 'Urgent matters are usually picked up within two working days. Say so when you call.',
      },
      {
        q: 'Do you work with individuals as well as companies?',
        a: 'Yes, though the approach differs. Mention which when you get in touch.',
      },
    ],
    contact: {
      hours: 'Monday to Friday, 9am – 6pm',
      formNote: 'Describe the matter briefly and we will call you back.',
    },
  },

  RETAIL: {
    template: 'solaris',
    hero: {
      eyebrow: 'In stock now',
      headline: 'Ask a person. Get an answer.',
      subhead:
        'Stock, sizes, delivery dates, returns. Call {{ORG}} and someone who can actually check will check, while you are on the line.',
      primaryCta: { label: 'Call the shop', kind: 'call' },
      secondaryCta: { label: 'Get a callback', kind: 'callback' },
    },
    highlights: [
      {
        title: 'Real stock, checked live',
        body: 'Not a website that says "in stock" and an email two days later saying otherwise.',
      },
      { title: 'Delivery you can pin down', body: 'A date and a window, confirmed on the call.' },
      {
        title: 'Returns without an argument',
        body: 'Thirty days, receipt or order number, no interrogation.',
      },
    ],
    services: [
      {
        name: 'Order by phone',
        body: 'Anything on the shelf, paid for on the call and dispatched the same day.',
      },
      {
        name: 'Delivery and collection',
        body: 'Next-day across the city, or hold it at the counter for you.',
      },
      {
        name: 'Bulk and trade',
        body: 'Volume pricing for businesses, quoted properly rather than by the unit.',
      },
    ],
    proof: {
      stats: [
        { value: 'Same day', label: 'Dispatch on phone orders' },
        { value: '30 days', label: 'Returns window' },
        { value: '2,000+', label: 'Lines in stock' },
      ],
      quote: null,
    },
    faq: [
      {
        q: 'Can I order over the phone?',
        a: 'Yes — call and we will take the order and payment on the line, then confirm dispatch by message.',
      },
      {
        q: 'How fast is delivery?',
        a: 'Next day within the city for orders placed before 4pm. We will give you a window, not a week.',
      },
      {
        q: 'What if something is out of stock?',
        a: 'We will tell you when it lands rather than take the order and go quiet.',
      },
    ],
    contact: {
      hours: 'Daily, 9am – 10pm',
      formNote: 'Leave your number and we will ring you back about your order.',
    },
  },

  FITNESS: {
    template: 'solaris',
    hero: {
      eyebrow: 'Trial session available',
      headline: 'Turn up once. We will handle the rest.',
      subhead:
        'Coaching, classes and a plan that survives a working week. Call {{ORG}} for a trial session and an honest read on where to start.',
      primaryCta: { label: 'Book a trial', kind: 'callback' },
      secondaryCta: { label: 'Call the studio', kind: 'call' },
    },
    highlights: [
      {
        title: 'Programmes, not guesswork',
        body: 'A coach writes your plan and adjusts it. You are not left reading a laminated sheet.',
      },
      {
        title: 'Classes that start on time',
        body: 'Small groups, capped, so a session is coaching rather than crowd control.',
      },
      {
        title: 'Cancel without a fight',
        body: 'Monthly terms. No twelve-month lock-in dressed up as a discount.',
      },
    ],
    services: [
      { name: 'Personal training', body: 'One to one, with a plan reviewed every four weeks.' },
      { name: 'Group classes', body: 'Strength, conditioning and mobility, capped at twelve.' },
      {
        name: 'Corporate memberships',
        body: 'Team rates with attendance reporting for the people paying for it.',
      },
    ],
    proof: {
      stats: [
        { value: '12', label: 'Maximum in a class' },
        { value: 'Monthly', label: 'Terms, cancel anytime' },
        { value: '6am–10pm', label: 'Open daily' },
      ],
      quote: {
        text: 'Third gym I have joined and the first where somebody noticed I stopped coming and rang me.',
        author: 'Fatima A.',
        role: 'Member, 2 years',
      },
    },
    faq: [
      {
        q: 'Do you do trial sessions?',
        a: 'Yes, one free session with a coach. Call and we will book you into a class that suits your level.',
      },
      {
        q: 'Am I locked into a contract?',
        a: 'No. Memberships are monthly and you can stop at the end of any month.',
      },
      {
        q: 'I have not trained in years. Is that a problem?',
        a: 'It is the most common way people start here. Say so on the call and we will put you with the right coach.',
      },
    ],
    contact: {
      hours: 'Daily, 6am – 10pm',
      formNote: 'Leave a number and a coach will call to book your trial.',
    },
  },

  GENERIC: {
    template: 'solaris',
    hero: {
      eyebrow: '',
      headline: 'Call us and speak to someone who can help',
      subhead:
        '{{ORG}} answers every call, handles what can be handled on the line, and passes anything else to the person who owns it. Nothing sits in a queue.',
      primaryCta: { label: 'Request a callback', kind: 'callback' },
      secondaryCta: { label: 'Call us now', kind: 'call' },
    },
    highlights: [
      {
        title: 'Answered, not queued',
        body: 'Every call is picked up. Straightforward questions are resolved on the spot.',
      },
      {
        title: 'Passed to a person who knows',
        body: 'When it needs a human, it goes to the one who can decide, with the context already gathered.',
      },
      {
        title: 'Called back when we say',
        body: 'A promised callback is a scheduled callback, not a hope.',
      },
    ],
    services: [
      { name: 'Enquiries', body: 'Answered on the call, with the detail you actually asked for.' },
      { name: 'Bookings and orders', body: 'Taken by phone and confirmed before you hang up.' },
      { name: 'Support', body: 'Escalated to someone who can fix it rather than log it.' },
    ],
    proof: {
      stats: [
        { value: '100%', label: 'Of calls answered' },
        { value: 'Under 1 min', label: 'To reach a person' },
      ],
      quote: null,
    },
    faq: [
      {
        q: 'What are your hours?',
        a: 'Our line is answered during the hours listed below. Outside them, leave a number and we will call back when we open.',
      },
      { q: 'Can I speak to a person?', a: 'Always. Ask at any point and you will be put through.' },
      {
        q: 'How quickly will you call back?',
        a: 'Same working day for anything received before the afternoon.',
      },
    ],
    contact: {
      hours: 'Sunday to Thursday, 9am – 6pm',
      formNote: 'Leave your number and we will call you back.',
    },
  },
};

/** The template a vertical starts on, so a new tenant is not arbitrary. */
export function defaultTemplateForIndustry(industry: Industry): SiteTemplate {
  return LANDING_COPY[industry]?.template ?? 'classic';
}

/**
 * Starter content for a brand-new centre.
 *
 * Called at provisioning time so a tenant created thirty seconds ago has a page
 * worth showing, with its own name in the copy. Everything here is editable
 * afterwards; nothing here is a placeholder pretending to be finished.
 */
export function siteContentForIndustry(industry: Industry, orgName: string): SiteContent {
  const copy = LANDING_COPY[industry] ?? LANDING_COPY.GENERIC;
  const withName = <T>(value: T): T =>
    typeof value === 'string' ? (value.replaceAll('{{ORG}}', orgName) as unknown as T) : value;

  return SiteContent.parse({
    hero: {
      ...copy.hero,
      headline: withName(copy.hero.headline),
      subhead: withName(copy.hero.subhead),
    },
    highlights: copy.highlights.map((h) => ({ ...h, body: withName(h.body) })),
    services: copy.services.map((s) => ({ ...s, body: withName(s.body) })),
    proof: copy.proof,
    faq: copy.faq.map((f) => ({ ...f, a: withName(f.a) })),
    contact: {
      phoneOverride: '',
      email: '',
      address: '',
      hours: copy.contact.hours,
      showForm: true,
      formNote: copy.contact.formNote,
    },
    sections: ['highlights', 'services', 'proof', 'faq', 'contact'],
    footerNote: '',
  });
}

/* ================================== DTOs ================================== */

/** What the tenant's own Website page reads and writes. */
export const SiteDto = z.object({
  template: SiteTemplate,
  style: SiteStyle,
  isPublished: z.boolean(),
  content: SiteContent,
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  /** Where a captured lead goes, so the dialler picks it up. Null = nowhere. */
  leadCampaignId: z.string().nullable(),
  updatedAt: z.coerce.date(),
  /* Denormalised for the editor's preview and the "your page is here" link. */
  slug: z.string(),
  name: z.string(),
  tagline: z.string().nullable(),
  logoUrl: z.string().nullable(),
  themePreset: ThemePreset,
  /** The centre's assigned DID, which the page's call button dials. */
  phoneE164: z.string().nullable(),
  leadCount: z.number().int().nonnegative(),
});
export type SiteDto = z.infer<typeof SiteDto>;

export const UpdateSiteInput = z.object({
  template: SiteTemplate.optional(),
  style: SiteStyle.optional(),
  isPublished: z.boolean().optional(),
  content: SiteContent.optional(),
  metaTitle: z.string().max(120).nullable().optional(),
  metaDescription: z.string().max(300).nullable().optional(),
  leadCampaignId: z.string().nullable().optional(),
  /*
   * Identity and palette live on the Organization but are edited from the same
   * screen, because "what our brand looks like" is one decision and splitting it
   * across two pages only made the Website page tell people to go elsewhere.
   *
   * The palette is not landing-page-only — it themes the whole dashboard — so
   * the editor has to say so.
   */
  tagline: z.string().max(120).nullable().optional(),
  logoUrl: z.string().max(500).nullable().optional(),
  themePreset: ThemePreset.optional(),
  /** A pasted tweakcn export. Null clears it so the preset takes over again. */
  themeTokens: ThemeTokens.nullable().optional(),
});
export type UpdateSiteInput = z.infer<typeof UpdateSiteInput>;

/**
 * What an anonymous visitor is served.
 *
 * A separate type from SiteDto rather than a subset at the call site: this one
 * crosses the authentication boundary, so what it does *not* contain — lead
 * counts, the campaign id, the org id, whether the page is a draft — is the
 * point, and a shape that spells that out is easier to keep honest than a
 * `select` somebody edits later.
 */
export const PublicSiteDto = z.object({
  slug: z.string(),
  name: z.string(),
  tagline: z.string().nullable(),
  logoUrl: z.string().nullable(),
  industry: Industry,
  template: SiteTemplate,
  style: SiteStyle,
  themePreset: ThemePreset,
  themeTokens: ThemeTokens.nullable(),
  content: SiteContent,
  /** Resolved: the content override if set, else the centre's assigned DID. */
  phoneE164: z.string().nullable(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  /** Whether the page will accept a callback request. */
  acceptsLeads: z.boolean(),
  /**
   * The centre's Dograh voice agent, if one is connected. Carries the public
   * embed token and never the API key — see DograhWidgetDto.
   */
  dograh: DograhWidgetDto,
});
export type PublicSiteDto = z.infer<typeof PublicSiteDto>;

export const SiteLeadInput = z.object({
  name: z.string().trim().min(2, 'Please give us a name').max(80),
  phone: z.string().trim().min(6, 'A phone number we can reach you on').max(24),
  /** ISO 3166-1 alpha-2, from the country picker. */
  country: z.string().length(2).default('AE'),
  email: z.string().email('That email does not look right').max(120).optional().or(z.literal('')),
  message: z.string().max(600).optional().or(z.literal('')),
  /** Which part of the page produced it — hero form, contact form or call panel. */
  source: z.enum(['hero', 'contact', 'call-panel']).default('contact'),
  /**
   * Which agent rings them back: the outbound slot's (a callback) or the info
   * slot's (a one-way information call). Omitted means a callback.
   */
  callType: z.enum(['outbound', 'info']).optional(),
  /**
   * Honeypot. A real visitor never sees this field, so anything in it is a bot
   * and the request is accepted-and-discarded rather than rejected — a 400 tells
   * a scraper which field to stop filling.
   */
  company: z.string().max(200).optional(),
});
export type SiteLeadInput = z.infer<typeof SiteLeadInput>;

export const SiteLeadOutput = z.object({
  ok: z.boolean(),
  /** What the page tells the visitor. Server-authored so it can be honest. */
  message: z.string(),
});
export type SiteLeadOutput = z.infer<typeof SiteLeadOutput>;

/** A captured lead, for the tenant's Website page. */
export const SiteLeadRow = z.object({
  id: z.string(),
  name: z.string(),
  phoneE164: z.string(),
  email: z.string().nullable(),
  message: z.string().nullable(),
  source: z.string(),
  /** Set when the lead was queued to a campaign the dialler works. */
  queuedToCampaign: z.boolean(),
  contactId: z.string().nullable(),
  createdAt: z.coerce.date(),
});
export type SiteLeadRow = z.infer<typeof SiteLeadRow>;
