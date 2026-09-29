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
export const SUPPORTS = ["hero", "about", "highlights", "services", "testimonials", "pricing", "faq", "contact"] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'stackgrid',
  name: 'Stackgrid',
  description: 'Technical and dense — ASCII motifs, integration diagram, developer tone.',
  // The clone, not the site it was cloned from — that URL is not recorded in
  // the source repo for most of these, and guessing it would put an unverified
  // attribution next to a licensing question.
  source: 'Templates-Vedant/template-vedant-stackgrid-clone',
  supports: SUPPORTS,
  preview: '/previews/stackgrid.png',
  /**
   * Derived from the source's own hero primary CTA — `components/Button.tsx`,
   * used unmodified (`<Button href={hero.primaryCta.href}>`) in `page.tsx`.
   * That component's own comment says it plainly: "a solid black pill-less
   * rectangle for the primary action" — `bg-[var(--sg-black)]
   * text-[var(--sg-white)]`, no `rounded-*` class anywhere in `base` or its
   * `primary` variant. `accent`/`onAccent` are that literal
   * `--sg-black`/`--sg-white` (`#000000`/`#ffffff`, `theme.css`). `radius`
   * is `0px` for the same reason the button is "pill-less": a true square
   * corner, not a library-wide pill assumed onto a developer-toned site
   * that has none. `font` is the root's own body face — the button carries
   * no `sg-display` class, so it inherits `.stackgrid-root`'s
   * `var(--font-google-sans-flex), var(--font-inter)` rather than the
   * Instrument Serif display face. `transition` mirrors the button's own
   * `transition-colors duration-200` (Tailwind's default 200ms color
   * easing).
   */
  widgetTheme: {
    accent: '#000000',
    onAccent: '#ffffff',
    radius: '0px',
    font: '"Google Sans Flex", "Inter", sans-serif',
    transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
      <div className="stackgrid-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
