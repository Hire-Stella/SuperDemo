import type { SectionKey, TemplateContent, TemplateManifest } from '@stella/template-schema';
import { ContentProvider } from './context';
import { adapt, DEFAULTS, type TemplateProps } from './content';
import Page from './page';

/**
 * What this template can draw.
 *
 * Declared rather than inferred so a product can offer only the templates
 * that suit a tenant. Handing a template content it has nowhere to put
 * drops it silently; a picker that knows the repertoire can say so before
 * anyone picks.
 *
 * No `about`, `steps`, `pricing`, `comparison`, `team` or `faq`: the source
 * has no distinct "about us" band on its home page (its brand voice lives
 * inside the feature copy instead), no numbered onboarding steps, no
 * price-tier table on the home page itself (its `/pricing` route was never
 * scraped), no before/after claim, no team roster and no FAQ accordion —
 * and this port does not invent any of them to fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'highlights',
  'services',
  'stats',
  'gallery',
  'testimonials',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'fluxo',
  name: 'Fluxo',
  description:
    'Indigo-and-violet merchant payments product page — dashboard hero, live stat cards, checkout-link mockup, integrations marquee.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Paywave" — a free Framer template by Flowbyherox, published on the
  // Framer marketplace for merchant payment platforms and invoicing SaaS —
  // rebranded here from "Paywave" to the fictional payments brand "Fluxo".
  source: 'Flowbyherox — "Paywave" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/fluxo.png',
  /**
   * `accent` is the source's own literal button/link fill, confirmed
   * against its compiled CSS custom property
   * `--token-1ff69bc5…: rgb(17, 14, 52)` — a deep indigo, not the violet
   * used for smaller highlight accents elsewhere on the page. `radius` is
   * the source's own literal pill button corner, `border-radius: 100px`,
   * confirmed on every `Primary - large`/`Primary - small` button in its
   * SSR HTML. `font` is this port's own display face, "Instrument Sans" —
   * see theme.css for why the source's own faces (Inter, Satoshi, Switzer)
   * are not reused here.
   */
  widgetTheme: {
    accent: '#110e34',
    onAccent: '#ffffff',
    radius: '999px',
    font: '"Instrument Sans", "Instrument Sans Placeholder", sans-serif',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
  },
};

/**
 * The page.
 *
 * Section order is the template's own. Its rhythm is part of what it is,
 * and letting a caller reorder it produces a page that is neither this
 * template nor anything anyone designed.
 */
export function Template({ content }: { content: TemplateContent }) {
  return <TemplateRaw content={adapt(content)} />;
}

/** The template's own copy, verbatim — for the gallery and for comparison. */
export function TemplateRaw({ content = DEFAULTS }: { content?: TemplateProps }) {
  return (
    <ContentProvider content={content}>
      <div className="fluxo-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
