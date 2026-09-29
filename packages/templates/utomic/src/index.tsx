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
export const SUPPORTS = ["hero", "about", "highlights", "services", "steps", "gallery", "stats", "testimonials", "pricing", "team", "faq", "contact"] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'utomic',
  name: 'Utomic',
  description: 'Agency site — services, case studies, pricing and a gradient hero.',
  // The clone, not the site it was cloned from — that URL is not recorded in
  // the source repo for most of these, and guessing it would put an unverified
  // attribution next to a licensing question.
  source: 'Templates-Vedant/template-vedant-utomic-clone',
  supports: SUPPORTS,
  preview: '/previews/utomic.png',
  /**
   * The source never fills a button with its own violet/indigo brand
   * swatches (`--brand-violet`, `--brand-plum`, etc. in `theme.css`) — those
   * are used only for the hero's radial gradient and small eyebrow labels.
   * Its actual, repeated primary-CTA treatment, on every dark section
   * (`components/CtaBanner.tsx`'s "Let's start today", and the matching
   * dark-card pricing CTA in `page.tsx`), is a plain high-contrast pill:
   * `rounded-full bg-white ... text-black`. `accent`/`onAccent` are that
   * literal `bg-white`/`text-black`, `#ffffff`/`#000000`. `radius` is that
   * same button's `rounded-full`. `font` is the root's own body face, Sora
   * (`--font-sans`/`.utomic-root` in `theme.css`) — the button has no
   * separate display face to opt out of. `transition` mirrors
   * `CtaBanner.tsx`'s own `transition-transform hover:-translate-y-0.5`
   * (Tailwind's default 150ms transform easing).
   */
  widgetTheme: {
    accent: '#ffffff',
    onAccent: '#000000',
    radius: '9999px',
    font: '"Sora", ui-sans-serif, system-ui, sans-serif',
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
      <div className="utomic-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
