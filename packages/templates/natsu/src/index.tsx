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
 * `steps` renders as the about page's own literal "How It Started" founding
 * timeline and `stats` as its "Numbers Behind The Cup" counter band —
 * repertoire none of tavola's, forno's, aurelia's or brasa's sources had an
 * equivalent for (yokai's own `stats` is an original design, not a port).
 * `faq` keeps to the one question the source's own accordion actually
 * answers rather than the four it leaves blank. No `pricing` or
 * `comparison`: the source's menu is priced drinks, not tiered plans, and
 * it makes no before/after claim, and this port does not invent either to
 * fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'services',
  'steps',
  'stats',
  'gallery',
  'team',
  'testimonials',
  'faq',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'natsu',
  name: 'Natsu',
  description:
    'Warm cream coffee-shop — full-bleed hero, priced drink & pastry menu, founding timeline, single-barista spotlight.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Ferea", a free Framer coffee-shop template published on the Framer
  // marketplace — rebranded from "Ferea" to the fictional coffee-shop name
  // "Natsucafe" in the source mirror this was ported from, and renamed once
  // more here to the one-word "Natsu" to match this library's own naming
  // convention (Aurelia, Brasa, Forno, Tavola, Yokai).
  source: 'Framer marketplace — "Ferea" (free template)',
  supports: SUPPORTS,
  preview: '/previews/natsu.png',
  /**
   * Derived from the source's own five real CSS custom properties and one
   * real button, not guessed.
   *
   * `accent`/`onAccent` are the source's own literal primary-button fill
   * and label colour — `rgb(172,109,54)` (`#ac6d36`, confirmed 6 separate
   * times across the source's inline styles, its accent colour) under
   * `rgb(243,239,234)` (`#f3efea`) text, read directly off its own
   * "order now" button node. `radius` is that same button's own literal
   * `border-bottom-left-radius:100px` (and matching values on all four
   * corners) — a true pill at the button's own height, the same
   * measurement every sibling template's own radius note took from its
   * own real control. `font` is "Akshar" — the face that button's own text
   * node actually renders in (`font-weight:700`), not the body face "Fira
   * Sans Extra Condensed", the same call brasa made for its own display
   * face over its body one. `transition` is the source's own real
   * mobile-nav hamburger icon transition — `transform 600ms
   * cubic-bezier(0.4, 0, 0.2, 1)` — the only literal duration-and-curve
   * pair anywhere in the source's compiled CSS (its buttons themselves
   * swap Framer variant classes with no CSS transition of their own).
   */
  widgetTheme: {
    accent: '#ac6d36',
    onAccent: '#f3efea',
    radius: '100px',
    font: '"Akshar", "Akshar Placeholder", sans-serif',
    transition:
      'transform 600ms cubic-bezier(0.4, 0, 0.2, 1), background-color 600ms cubic-bezier(0.4, 0, 0.2, 1)',
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
      <div className="natsu-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
