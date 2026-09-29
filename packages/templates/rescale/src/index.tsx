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
  id: 'rescale',
  name: 'Rescale',
  description: 'SaaS marketing — process, integrations, performance stats, pricing, journal.',
  // The clone, not the site it was cloned from — that URL is not recorded in
  // the source repo for most of these, and guessing it would put an unverified
  // attribution next to a licensing question.
  source: 'Templates-Vedant/template-vedant-rescale-clone',
  supports: SUPPORTS,
  preview: '/previews/rescale.png',
  /**
   * Derived from the source's own hero CTA, `HeroSection.tsx`'s "Start Free
   * Trial" link — `rs-gradient-brand ... text-white`, a two-stop gradient
   * rather than a flat fill. `accent` takes the gradient's own solid anchor,
   * `--rs-brand-dark` (`#4251a6`, `theme.css`) — the same literal colour the
   * source itself falls back to everywhere else a single, non-gradient
   * brand colour is needed (its own `::selection`, every hover/focus border
   * and label across `ContactForm`, `PricingSection`, `IntegrationSection`),
   * not the lighter mid-tone `--rs-brand` which never appears solid on its
   * own. `onAccent` is that same button's own literal `text-white`.
   * `radius` is the button's own `rounded-full`. `font` is the root's body
   * face, Inter (`--font-sans`/`.rescale-root` in `theme.css`) — the button
   * carries no `rs-heading` class, so it never opts into the Manrope
   * display face. `transition` mirrors the button's own real
   * `transition-transform hover:scale-[1.03]` (Tailwind's default 150ms
   * transform easing).
   */
  widgetTheme: {
    accent: '#4251a6',
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
      <div className="rescale-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
