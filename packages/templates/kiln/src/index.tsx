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
 * No `steps`, `stats`, `testimonials`, `pricing`, `comparison`, `team` or
 * `faq`: the source has no numbered process band, no animated counters, no
 * quote carousel, no price-tier plans (its menu is priced drinks, not
 * bundles), no before/after claim, no roster, and no FAQ — and this port
 * does not invent any of them to fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'services',
  'gallery',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'kiln',
  name: 'Kiln',
  description:
    'Swiss-minimal, monochrome third-wave coffee bar — full-bleed hero, single-origin bean feature, bare-digit menu.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Drip" — a free Framer template by Caglan, published on the Framer
  // marketplace for third-wave coffee shops and home brewers — rebranded
  // here from "Drip" to the fictional coffee bar name "Kiln".
  source: 'Caglan — "Drip" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/kiln.png',
  /**
   * The source draws no filled accent colour anywhere — every interactive
   * element (nav links, the source's own default Framer link colour aside)
   * is rendered in its own near-black ink, literally `rgb(10, 10, 10)`
   * (`#0a0a0a`, the same token used for every heading and the menu's own
   * price digits) on white, confirmed against the source's own SSR HTML
   * and inline `--framer-text-color` tokens. `radius` is the source's own
   * literal `border-radius: 4px` — the only non-inherited, non-zero corner
   * value anywhere in its CSS, a tight, near-square corner rather than a
   * pill (aurelia) or a soft card curve (tavola, forno). `font` is the
   * source's own body face, "Switzer" — not its display face "Clash
   * Grotesk", for the reason every sibling template gives: a display face
   * reads as a giant headline, not small chat UI text. `transition` is the
   * source's own literal link-hover rule, found verbatim in its compiled
   * CSS: `color .4s cubic-bezier(.44,0,.56,1)`, extended here to the
   * button's background for the same hover.
   */
  widgetTheme: {
    accent: '#0a0a0a',
    onAccent: '#ffffff',
    radius: '4px',
    font: '"Switzer", "Switzer Placeholder", sans-serif',
    transition:
      'background-color 0.4s cubic-bezier(0.44, 0, 0.56, 1), color 0.4s cubic-bezier(0.44, 0, 0.56, 1)',
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
      <div className="kiln-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
