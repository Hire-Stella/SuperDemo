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
export const SUPPORTS = ["hero", "highlights", "services", "steps", "stats", "testimonials", "team", "faq", "contact"] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'reodental',
  name: 'Reodental',
  description: 'Clinical and calm — treatments, team, trust stats. Suits clinics and practices.',
  // The clone, not the site it was cloned from — that URL is not recorded in
  // the source repo for most of these, and guessing it would put an unverified
  // attribution next to a licensing question.
  source: 'Templates-Pruthviraj/reodental-clone',
  supports: SUPPORTS,
  preview: '/previews/reodental.png',
  /**
   * Derived from the source's own primary CTA, `LabelTrackButton` with
   * `variant="primary"` (`components/LabelTrackButton.tsx`) as it actually
   * renders in `page.tsx`: both real instances — the hero's "Book an
   * appointment" and the contact band's identical CTA — override the
   * component's bare-primary `bg-ink` with `!bg-cream !text-ink`, since both
   * sit on the dark `bg-ink` hero/contact bands. `accent`/`onAccent` are
   * that actual rendered pair, `--color-cream` (`#fafaf8`) under
   * `--color-ink` (`#121212`) from `theme.css` — not `--color-gold`, which
   * the source uses only for small-caps eyebrow labels, never a button.
   * `radius` is the button's own `rounded-full`. `font` is the root's body
   * face, Geist Sans (`--font-geist-sans`, see `.reodental-root` in
   * `theme.css`). `transition` mirrors the button's own `transition-colors`
   * class (Tailwind's default 150ms color easing).
   */
  widgetTheme: {
    accent: '#fafaf8',
    onAccent: '#121212',
    radius: '9999px',
    font: '"Geist", ui-sans-serif, system-ui, sans-serif',
    transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
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
      <div className="reodental-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
