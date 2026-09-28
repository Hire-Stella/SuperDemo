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
 * `stats` renders as the source's own animated counter band and `team` as its
 * "Our Chefs" roster — repertoire neither tavola's nor forno's source had an
 * equivalent for. No `steps`, `pricing`, `comparison` or `faq`: the source has
 * no numbered process, no price-tier plans (its menu is priced dishes, not
 * bundles the way forno's combo deals were), no before/after claim, and no
 * FAQ band, and this port does not invent any to fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'services',
  'gallery',
  'stats',
  'team',
  'testimonials',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'aurelia',
  name: 'Aurelia',
  description:
    'Warm, jewel-toned all-day bistro — rated hero, sentence-style reservation form, chef roster.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Restaura", a free Framer restaurant template published on the Framer
  // marketplace by Salim of Webestica — rebranded from "Restaura" to the
  // fictional restaurant name "Aurelia" in the source mirror this was ported
  // from.
  source: 'Salim / Webestica — "Restaura" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/aurelia.png',
  /**
   * Derived from the source's own real primary button: literally
   * `background-color: rgb(251, 192, 41)` (`#fbc029`, the same gold used for
   * the source's rating stars and its animated stat numbers) with
   * `rgb(24, 3, 24)` (`#180318`, this template's own ink) label text, on a
   * `border-radius: 150px` wrapper around a ~56px-tall control — a true
   * pill, the same family as forno's button shape but a different colour
   * pairing entirely. `font` is the source's own body face, "Inter" —
   * deliberately not its display serif "Gilda Display", for the same reason
   * forno gave: a display face reads as a giant headline, not small chat
   * UI text. `transition` matches this template's own unhurried blur-fade
   * reveal (see Reveal.tsx) — an easing curve neither tavola's plain fade
   * nor forno's bouncy overshoot uses.
   */
  widgetTheme: {
    accent: '#fbc029',
    onAccent: '#180318',
    radius: '999px',
    font: '"Inter", "Inter Placeholder", sans-serif',
    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease',
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
      <div className="aurelia-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
