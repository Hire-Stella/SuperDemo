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
export const SUPPORTS = ["hero", "about", "highlights", "steps", "gallery", "stats", "testimonials", "pricing", "team", "faq", "contact"] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'zova',
  name: 'Zova',
  description: 'Full SaaS marketing page — video hero, benefits, pricing, blog, contact.',
  // The clone, not the site it was cloned from — that URL is not recorded in
  // the source repo for most of these, and guessing it would put an unverified
  // attribution next to a licensing question.
  source: 'Templates-Vedant/template-vedant-zova-saas-clone',
  supports: SUPPORTS,
  preview: '/previews/zova.png',
  /**
   * Derived from the source's own `.zv-btn-primary` class (`theme.css`),
   * used verbatim for the hero's own CTA (`components/HeroSection.tsx`):
   * `background-image: linear-gradient(111deg, #545454 0%, #000000 100%)`
   * under `color: #ffffff` — a gradient, not a flat fill. `accent` takes
   * that gradient's own black anchor, matched by the source's own literal
   * solid ink, `--zv-ink` (`#0a0a0a`, also its `::selection` background) —
   * not the lighter `#545454` starting stop, which never appears on its
   * own. `onAccent` is that same button's literal `#ffffff`. `radius` is
   * `.zv-btn-primary`'s own `border-radius: 9999px`. `font` is the root's
   * body face, Inter (`--font-sans`/`.zova-root` in `theme.css`) — the
   * button carries neither the `zv-heading` (Geist) nor `zv-eyebrow`
   * (Manrope) classes. `transition` mirrors the button's own real
   * `transition-transform hover:scale-[1.03]` as used on the hero CTA
   * (Tailwind's default 150ms transform easing).
   */
  widgetTheme: {
    accent: '#0a0a0a',
    onAccent: '#ffffff',
    radius: '9999px',
    font: '"Inter", ui-sans-serif, system-ui, sans-serif',
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
      <div className="zova-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
