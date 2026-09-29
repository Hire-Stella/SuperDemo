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
 */
export const SUPPORTS = ["hero", "about", "faq", "contact"] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'elianvalen',
  name: 'Elian Valen',
  description: 'Editorial portfolio — restrained type, large imagery, project led.',
  // The clone, not the site it was cloned from — that URL is not recorded in
  // the source repo for most of these, and guessing it would put an unverified
  // attribution next to a licensing question.
  source: 'Templates-Vedant/template-vedant-elianvalen-clone',
  supports: SUPPORTS,
  preview: '/previews/elianvalen.png',
  /**
   * This template has no filled "button" chrome anywhere in its editorial
   * hero or CTA copy — every in-page CTA (`TextLink` in
   * `components/sections.tsx`) is an underlined text link, not a button.
   * The only real filled buttons in the source are commerce actions:
   * `ProductDetail.tsx`'s "Add to cart" (`bg-ink ... text-white`, no
   * `rounded-*` class) and `CartDrawer.tsx`'s checkout button, both the
   * same literal treatment. `accent`/`onAccent` are that button's own
   * `bg-ink`/`text-white`, i.e. `var(--ev-ink)` (`#0e0e0e`) under `#ffffff`.
   * `radius` is `0px` because neither button carries any `rounded-*`
   * class — square corners, matching the template's restrained editorial
   * aesthetic. `font` is the root's own body face, Inter (`.elianvalen-root`
   * sets `font-family: var(--font-inter)...`; the button inherits it rather
   * than opting into the eyebrow's Poppins). `transition` mirrors the
   * button's own real `transition-opacity` hover (`hover:opacity-85`).
   */
  widgetTheme: {
    accent: '#0e0e0e',
    onAccent: '#ffffff',
    radius: '0px',
    font: '"Inter", ui-sans-serif, system-ui, sans-serif',
    transition: 'opacity 0.15s ease',
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
      <div className="elianvalen-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
