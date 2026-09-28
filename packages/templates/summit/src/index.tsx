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
 * No `gallery`, `comparison` or `team`: the source has no photo grid, no
 * before/after claim and no roster anywhere on its one real page, and this
 * port does not invent any of them to fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'services',
  'steps',
  'stats',
  'testimonials',
  'pricing',
  'faq',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'summit',
  name: 'Summit',
  description:
    'Dark, gold-glow AI wealth platform — portfolio-growth hero, robo-advisor feature bands, plan pricing and a looping investor testimonial wall.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Aset" — a free Framer template by Green Yang, published on the Framer
  // marketplace for AI-driven asset management and robo-advisor products —
  // rebranded here from "Aset" to the fictional wealth-management brand name
  // "Summit".
  source: 'Green Yang — "Aset" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/summit.png',
  /**
   * The source draws its one real filled accent as a warm gold-to-umber
   * gradient (`#fabb00` → `#3e2013`, confirmed against its own compiled
   * `--token-*` custom properties) rather than a flat hue — `accent` here is
   * the gradient's brightest, most legible stop (`#fabb00`) since the
   * widget can only take one solid colour. `onAccent` is near-black
   * (`#171717`, the source's own page-background token) rather than pure
   * white, since gold reads better under dark text than white text.
   * `radius` is the source's own literal button corner, `20px` — a full pill
   * on a compact control, not the `10px` its larger feature cards use. `font`
   * is the source's own real body face for UI chrome, "Figtree" — not its
   * display face "Bricolage Grotesque", for the reason every sibling
   * template gives: a display face reads as a giant headline, not small
   * chat UI text. `transition` is this template's own reveal easing curve,
   * reused here for the same snappy, confident feel.
   */
  widgetTheme: {
    accent: '#fabb00',
    onAccent: '#171717',
    radius: '20px',
    font: '"Figtree", sans-serif',
    transition: 'background-color 0.6s cubic-bezier(0.22, 1, 0.36, 1), color 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
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
      <div className="summit-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
