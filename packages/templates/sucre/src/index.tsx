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
 * `pricing` renders as the source's own literal "Sweet memberships" band —
 * three real priced tiers, not before/after copy — repertoire natsu and
 * kiln's own coffee-bar sources had no equivalent for. No `steps`,
 * `comparison` or `team`: the source draws no numbered process, makes no
 * before/after claim, and names no staff roster, and this port does not
 * invent any of them to fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'services',
  'gallery',
  'stats',
  'testimonials',
  'pricing',
  'faq',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'sucre',
  name: 'Sucre',
  description:
    'Blush-and-gold patisserie — full-bleed hero, priced dessert menu, membership tiers, sweet-tooth testimonials.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Cakelab", a free Framer template by Jitu Raut published on the Framer
  // marketplace for bakeries, cake studios and dessert shops — rebranded
  // from "Cakelab" to the fictional patisserie name "Sucre".
  source: 'Jitu Raut — "Cakelab" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/sucre.png',
  /**
   * Derived from the source's own real CSS custom properties and one real
   * button, not guessed.
   *
   * `accent` is the source's own literal button-label and glow colour —
   * `rgb(255,74,125)` (`#ff4a7d`, its own CSS custom property
   * `--token-9d377744…`, confirmed on every pill button's rest-state text
   * colour and matched by the same hue in its own box-shadow glow,
   * `rgba(255,105,147,…)`) — the one filled hue anywhere in a source whose
   * every other surface is cream, blush or cocoa-brown. `onAccent` is the
   * source's own literal cream chip fill those same buttons and its nav bar
   * sit on, `rgb(255,246,245)` (`#fff6f5`, `--token-bb7bf659…`), confirmed
   * six separate times across the source's own inline styles. `radius` is
   * that same nav bar's and every button's own literal
   * `border-bottom-left-radius:999px` (and matching values on all four
   * corners) — a true pill, the same measurement every sibling template's
   * own radius note took from its own real control. `font` is "DM Sans" —
   * the face every one of the source's own nav links, buttons and body
   * paragraphs actually renders in — not the display face "Fraunces" used
   * only for its large serif headlines and price numerals, the same call
   * kiln's own manifest makes for its body face over its display one.
   * `transition` is the source's own real nav-link underline rule, found
   * verbatim in its compiled CSS — `width 0.5s ease` — the only literal
   * duration-and-curve pair anywhere in the source's own hover motion,
   * extended here to the launcher's background and label colour for the
   * same hover.
   */
  widgetTheme: {
    accent: '#ff4a7d',
    onAccent: '#fff6f5',
    radius: '999px',
    font: '"DM Sans", "DM Sans Placeholder", sans-serif',
    transition: 'background-color 0.5s ease, color 0.5s ease',
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
      <div className="sucre-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
