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
 * `highlights` renders as the source's own "Find Your Nearest Pizza Spot"
 * location finder rather than a review-badge strip, `pricing` as its five
 * combo-deal cards, and `testimonials` as its six attributed chef/critic
 * quotes — a repertoire tavola's source had no equivalent content for. No
 * `about`, `steps`, `gallery`, `stats`, `comparison`, `team` or `faq`: the
 * source has no narrative "our story" band, no numbered process, no separate
 * photo gallery outside the dish photography already used in `services`, and
 * no FAQ, and this port does not invent any to fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'highlights',
  'services',
  'pricing',
  'testimonials',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'forno',
  name: 'Forno',
  description: 'Bold, playful pizzeria — floating hero art, combo deals, chef reviews, location finder.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Pepper", a free Framer restaurant template published on the Framer
  // marketplace by Cristian Mielu (of UIhub.design) — rebranded from
  // "Pepper" to the fictional pizzeria name "Forno" in the source mirror
  // this was ported from.
  source: 'Cristian Mielu / UIhub.design — "Pepper" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/forno.png',
  /**
   * Derived from the source's own real primary button: literally
   * `background-color: rgb(255, 0, 60)` (the same red the source's own
   * favicon mark uses) with white (`rgb(255,255,255)`) label text, and a
   * fully rounded pill — the source's button wrapper carries
   * `border-radius: 24px` around an inner `border-radius: 48px` fill,
   * which on a ~44px-tall control is a true pill, not a soft square.
   * `font` is the source's own body sans, "Gabarito" — deliberately not
   * its bubble display face "Cherry Bomb One", which is legible as a giant
   * headline and not as small chat UI text. `transition` is a bouncy
   * overshoot easing, matching this template's own playful animation
   * language (see Reveal.tsx) rather than tavola's plain linear-ish ease.
   */
  widgetTheme: {
    accent: '#ff003c',
    onAccent: '#ffffff',
    radius: '999px',
    font: '"Gabarito", sans-serif',
    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease',
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
      <div className="forno-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
