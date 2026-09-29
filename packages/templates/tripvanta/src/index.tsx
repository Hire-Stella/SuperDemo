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
export const SUPPORTS = ["hero", "about", "highlights", "steps", "gallery", "stats", "testimonials", "faq", "contact"] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'tripvanta',
  name: 'Tripvanta',
  description: 'Travel and destination led — imagery first, itinerary sections, video.',
  // The clone, not the site it was cloned from — that URL is not recorded in
  // the source repo for most of these, and guessing it would put an unverified
  // attribution next to a licensing question.
  source: 'Templates-Pruthviraj/tripvanta-clone',
  supports: SUPPORTS,
  preview: '/previews/tripvanta.png',
  /**
   * Derived from the source's own hero primary CTA in `page.tsx` — the
   * "Explore now"-style link: `rounded-full bg-[var(--fg)] ... text-white`,
   * the same treatment repeated on every primary CTA site-wide (see also
   * `CtaArrowBadge.tsx`'s own `onDark`/`bg-[var(--fg)]` split, written for
   * exactly this button). `accent`/`onAccent` are that literal
   * `--fg`/white, `#291c05` (`theme.css`) under `#ffffff` — a warm near-black,
   * not the neutral `--muted` grey. `radius` is the button's own
   * `rounded-full`. `font`: the button carries no `font-display` class, and
   * `.tripvanta-root` sets no `font-family` of its own outside that class —
   * `--font-body` is declared in the `@theme inline` block but never once
   * applied to anything — so its real, rendered face is the browser/host's
   * own default sans stack. `transition` mirrors the button's own real
   * `transition-transform hover:scale-105` (Tailwind's default 150ms
   * transform easing).
   */
  widgetTheme: {
    accent: '#291c05',
    onAccent: '#ffffff',
    radius: '9999px',
    font: 'ui-sans-serif, system-ui, sans-serif',
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
      <div className="tripvanta-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
