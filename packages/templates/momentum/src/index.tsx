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
export const SUPPORTS = ["hero", "about", "highlights", "services", "steps", "stats", "pricing", "faq", "contact"] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'momentum',
  name: 'Momentum',
  description: 'Bold fitness landing — big stats, numbered programme, pricing tiers.',
  // The clone, not the site it was cloned from — that URL is not recorded in
  // the source repo for most of these, and guessing it would put an unverified
  // attribution next to a licensing question.
  source: 'Templates-Pruthviraj/momentum-fit-clone',
  supports: SUPPORTS,
  preview: '/previews/momentum.png',
  /**
   * Derived from the source's own hero CTA (`components/sections/Hero.tsx`,
   * the "Book a session"-style link): `rounded-full bg-accent ... text-white`.
   * `accent`/`onAccent` are that button's own `bg-accent`/`text-white`, i.e.
   * `--color-accent` from `theme.css` (`#ff5c1a`, this template's one
   * signature orange) under literal white. `radius` is that same button's
   * `rounded-full`, a true pill. `font` is the body face, DM Sans
   * (`--font-body`/`--font-dm-sans` in `theme.css`) — the button's own text
   * carries no `font-display` class, so it never opts into the Cormorant
   * serif used for headings. `transition` mirrors the button's own real
   * `transition-transform hover:scale-105` (Tailwind's default 150ms
   * transform easing).
   */
  widgetTheme: {
    accent: '#ff5c1a',
    onAccent: '#ffffff',
    radius: '9999px',
    font: '"DM Sans", "DM Sans Placeholder", sans-serif',
    transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
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
      <div className="momentum-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
