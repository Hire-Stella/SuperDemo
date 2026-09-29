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
 * No `highlights`, `steps`, `gallery`, `stats`, `testimonials`, `pricing`,
 * `comparison`, `team` or `faq`: the source is a deliberately spare
 * four-band poster site — hero, an opening-hours table, a priced menu, and
 * a directions band — with no feature grid, no numbered process, no photo
 * gallery beyond its one hero shot, no counters, no quotes, no tiered
 * plans, no before/after claim, no roster and no FAQ anywhere on the page.
 * This port does not invent any of them to fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'services',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'folio',
  name: 'Folio',
  description:
    'Print-poster neighborhood café — full-bleed photo hero, giant auto-fit headlines, ruled hours table and menu board.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "TWOFIVE - CAFE" — a free Framer template published on the Framer
  // marketplace, described by its own listing as "a print poster turned
  // website" — rebranded here from "TwoFive" to the fictional neighborhood
  // café name "Folio".
  source: 'Framer marketplace — "TWOFIVE - CAFE" (free template)',
  supports: SUPPORTS,
  preview: '/previews/folio.png',
  /**
   * Derived from the source's own three real CSS custom properties and one
   * real button, not guessed.
   *
   * `accent` is the source's own literal `body{--token-582fe791-...:#2334d9}`
   * — its single loud accent hue, used for every headline, eyebrow and the
   * one filled button on the page, confirmed against the source's own SSR
   * CSS. `onAccent` is that same button's own literal white label colour
   * (`--token-b80062ec-...:#fff`), read directly off its "Get Directions"
   * node. `radius` is that button's own literal `border-radius:100px` — a
   * true pill at the button's own height, confirmed in the source's
   * compiled CSS (`.framer-3sr6vi`) — genuinely distinct from kiln's tight
   * near-square `4px`. `font` is "League Spartan" — the source's only real
   * typeface; every League Spartan weight found in the source's own SSR
   * markup (700, 800) traces back to this one family, unlike natsu's or
   * kiln's two-face display/body pairing. `transition` is hand-matched, not
   * ported: the source's real interactivity runs on Framer's client-side
   * runtime with no fixed duration or curve anywhere in its static CSS, so
   * this is a plain, fast ease chosen to match the poster's snappy,
   * no-nonsense register rather than any literal source value.
   */
  widgetTheme: {
    accent: '#2334d9',
    onAccent: '#ffffff',
    radius: '100px',
    font: '"League Spartan", "League Spartan Placeholder", sans-serif',
    transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
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
      <div className="folio-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
