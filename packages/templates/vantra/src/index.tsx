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
 * No `gallery`, `team`: the source has no photo grid and no roster —
 * every band on its home page is either AI-product marketing copy already
 * covered by `highlights`/`about`/`steps`, or one of `stats`,
 * `testimonials`, `pricing`, `comparison`, `faq`, all of which the source
 * genuinely has and this port fills for real. `services` is also unused —
 * the source sells subscription tiers, not an à la carte service menu, and
 * `pricing` already carries that.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'steps',
  'stats',
  'testimonials',
  'pricing',
  'comparison',
  'faq',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'vantra',
  name: 'Vantra',
  description:
    'AI-driven fintech / digital-investing platform — bento feature grid, before/after comparison, bento stat cards, subscription pricing.',
  // The clone, not the site it was cloned from: a literal HTML/CSS/JS mirror
  // of "FintechX" — a free Framer template by Webestica, published on the
  // Framer marketplace for AI investment and portfolio-tracking products —
  // rebranded from its generic placeholder name to the fictional fintech
  // brand "Vantra" in the source repo this was ported from, and kept as
  // this template's own slug.
  source: 'Webestica — "FintechX" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/vantra.png',
  /**
   * `accent` is the source's own literal button/stat-card blue, confirmed by
   * screenshotting the rendered "Primary" stat card and the primary CTA
   * pill (both a light-to-mid blue fill, `rgb(29,29,29)` reserved for ink
   * text/dark cards instead) — the button's own computed `background-color`
   * resolves to a transparent overlay in the source's compiled CSS (its
   * visible fill comes from a separate motion/gradient layer Framer renders
   * beneath it), so the swatch here is read from the rendered pixels rather
   * than a CSS property. `radius` is the source's own literal pill button
   * and nav-bar radius (`border-radius: 100px`, confirmed on both), the same
   * full-pill language aurelia uses and a different register from kiln's
   * 4px near-square or tavola/forno's 16–24px soft card curve. `font` is
   * the source's own UI/body face, "Inter Display" — not its display face
   * "Bricolage Grotesque", for the reason every sibling template gives: a
   * display face reads as a giant headline, not small chat UI text.
   * `transition` has no fixed value in the source's static CSS (its hover
   * motion is JS-driven, like kiln's own scroll reveal), so it is
   * hand-matched here to a standard smooth ease rather than invented from
   * nothing.
   */
  widgetTheme: {
    accent: '#3d63f5',
    onAccent: '#ffffff',
    radius: '100px',
    font: '"Inter Display", "Inter Display Placeholder", sans-serif',
    transition:
      'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
      <div className="vantra-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
