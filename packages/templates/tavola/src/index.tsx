import type { SectionKey, TemplateContent, TemplateManifest } from '@stella/template-schema';
import { ContentProvider } from './context';
import { adapt, DEFAULTS, type TemplateProps } from './content';
import Page from './page';

/**
 * What this template can draw.
 *
 * Declared rather than inferred so a product can offer only the templates that
 * suit a tenant. Handing a template content it has nowhere to put drops it
 * silently; a picker that knows the repertoire can say so before anyone picks.
 *
 * No `testimonials`, `steps`, `stats`, `pricing`, `comparison`, `team` or `faq`:
 * the source Framer template has no real content for any of them (no named
 * quotes, no numbered process, no price tiers beyond the menu itself), and
 * this port does not invent any to fill the gap.
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
  id: 'tavola',
  name: 'Tavola',
  description: 'Dark, warm fine-dining — video hero, curated menu, gallery, reservation form.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Qitchen", a free Framer restaurant template published by Gola Templates
  // (creator handle "pawel-gola", gola.supply) — rebranded from "Qitchen" to
  // the fictional restaurant name "Tavola" in the source mirror this was
  // ported from.
  source: 'Gola Templates — "Qitchen" (Framer marketplace, by Pawel Gola)',
  supports: SUPPORTS,
  preview: '/previews/tavola.png',
  /**
   * Derived from the source's own real circular icon-button: literally
   * `background-color: rgba(24,24,24,.5)` over photos (opaque near-black,
   * `rgb(10,11,10)`, elsewhere in the same template), `border-radius: 500px`
   * (a true pill/circle — this template's *text* buttons use an 8px soft
   * square instead, but a floating round launcher matches the icon-button,
   * not the text button), and a cream icon glyph at `rgb(239,231,210)`.
   * `font` is the source's real display serif, "Forum", with a generic
   * fallback appended.
   */
  widgetTheme: {
    accent: '#0a0b0a',
    onAccent: '#efe7d2',
    radius: '999px',
    font: '"Forum", serif',
  },
};

/**
 * The page.
 *
 * Section order is the template's own. Its rhythm is part of what it is, and
 * letting a caller reorder it produces a page that is neither this template nor
 * anything anyone designed.
 */
export function Template({ content }: { content: TemplateContent }) {
  return <TemplateRaw content={adapt(content)} />;
}

/** The template's own copy, verbatim — for the gallery and for comparison. */
export function TemplateRaw({ content = DEFAULTS }: { content?: TemplateProps }) {
  return (
    <ContentProvider content={content}>
      <div className="tavola-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
