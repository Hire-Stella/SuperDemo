import type { SectionKey, TemplateContent, TemplateManifest } from '@stella/template-schema';
import { ContentProvider } from './context';
import { adapt, DEFAULTS, type TemplateProps } from './content';
import Page from './page';

/**
 * What this template can draw.
 *
 * Declared rather than inferred so a product can offer only the templates
 * that suit a tenant — see brasa's own index.tsx for the fuller version of
 * this reasoning.
 *
 * `steps` renders as this template's own four-stage "leaf to cup" process
 * band and `stats` as a plain four-number band. No `pricing`, `comparison`
 * or `team`: Pearl's menu is priced drinks, not tiered plans, it makes no
 * before/after claim, and — being a small counter, not a kitchen — it never
 * grew a named roster to show off. Nothing here is invented to pad out a
 * repertoire nothing else in this design earns.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'services',
  'steps',
  'gallery',
  'stats',
  'testimonials',
  'faq',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'pearl',
  name: 'Pearl',
  description:
    'Playful small-batch bubble tea & specialty-drinks bar — round bubble hero, colour-tabbed menu, leaf-to-cup process.',
  // An original template, not a port. A genuine search of Framer's free
  // bakery-and-cafe marketplace category (14 free listings, including
  // "Deux", "Coffee & Cafe Shop", "Beanro" and "Common Grounds") turned up
  // nothing that was both a boba / specialty-drinks concept and distinct
  // from this library's own natsu ("Ferea", a warm cream coffee shop) or
  // kiln ("Drip", a monochrome coffee bar) — every free listing found was
  // either a bakery, a sit-down restaurant, or another plain coffee shop.
  // Built instead from Google Fonts (Fredoka + Nunito) and real photography
  // downloaded from Unsplash's free tier — nothing hotlinked.
  source: 'Original — no Framer source; Google Fonts + Unsplash (free tier), downloaded locally',
  supports: SUPPORTS,
  preview: '/previews/pearl.png',
  /**
   * This template's own real button shape, not a sibling's borrowed one: a
   * true pill (`border-radius: 999px`) on every button and badge — the
   * dome of a boba cup's lid, not kiln's near-square `4px`, not yokai's
   * diagonal "tag" corner, and a rounder pill than natsu's own 100px
   * (see theme.css's `.pearl-pill` for the card-level `.pearl-cup` shape
   * this button radius deliberately does not reuse).
   *
   * `accent`/`onAccent` are this template's own literal palette: `#7a5c9e`
   * ("taro", the single saturated accent behind every button and tag in
   * theme.css's `@theme inline` block — darkened one step from the lighter
   * decorative `#8b6fb0` tint specifically so `#7a5c9e` clears 4.5:1 against
   * white text, see the contrast note in theme.css) under `#ffffff` — a
   * taro purple, not natsu's cream-and-caramel, kiln's all-monochrome, or
   * any other sibling's red, gold or plum. `font` is the body face,
   * "Nunito" — deliberately not the display face "Fredoka", a rounded
   * bubble-lettered face legible as a giant headline and not as small chat
   * UI text, the same call every sibling template made for its own display
   * face. `transition` is this template's own reveal curve (see
   * theme.css's `.pearl-reveal`) applied to the hover state: a soft
   * overshoot "bubble pop", not yokai's no-overshoot settle, forno's
   * rotate-and-scale bounce, or tavola's plain fade.
   */
  widgetTheme: {
    accent: '#7a5c9e',
    onAccent: '#ffffff',
    radius: '999px',
    font: '"Nunito", "Nunito Placeholder", sans-serif',
    transition: 'transform 0.3s cubic-bezier(0.22, 1.61, 0.36, 1), background-color 0.2s ease',
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
      <div className="pearl-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
