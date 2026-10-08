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
 * `steps` renders as the source's own literal "Experience Our Process"
 * three-step band and `team` as its "Meet Our Master Chef" roster —
 * repertoire none of tavola's, forno's or aurelia's sources had an
 * equivalent for. No `stats`, `pricing`, `comparison` or `faq`: the source
 * has no counter band, no price tiers (its menu is unpriced dishes, not
 * combo deals or plans), no before/after claim, and no FAQ, and this port
 * does not invent any to fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'services',
  'steps',
  'gallery',
  'team',
  'testimonials',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'brasa',
  name: 'Brasa',
  description:
    'Bright, fire-lit Mexican street food — tilted photo-stack hero, unpriced dish cards, chef roster.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Mexzo", a free Framer Mexican-restaurant template published on the
  // Framer marketplace by Zab Themes — rebranded from "Mexzo" to the
  // fictional restaurant name "Brasa" in the source mirror this was ported
  // from.
  source: 'Zab Themes — "Mexzo" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/brasa.png',
  /**
   * Derived from the source's own two real button shapes, not conflated.
   *
   * Its main CTA ("Make A Reservation") is literally unrounded — no
   * `border-radius` rule exists anywhere in the source's compiled class
   * list for that control, confirmed by reading its own `<style>` block
   * rather than assuming a soft corner every other template in this
   * library happens to use. Its only real circles are icon-only: the
   * gallery slideshow's prev/next controls, literally
   * `width:40px;height:40px;border-radius:40px` — a true circle on a
   * square box. `radius` below takes that circle, the same reasoning
   * tavola gave for its own launcher: a floating round button matches a
   * source's real icon-button, not its square text button.
   *
   * `accent`/`onAccent` are the source's own literal button fill and label
   * colour — `rgb(248,191,5)` (`#f8bf05`, confirmed 272 separate times
   * across the source's inline styles, its single most-used colour) under
   * `rgb(35,35,35)` (`#232323`) text, read directly off its "Reservation
   * Button Text" node. `font` is the body face, "Plus Jakarta Sans" —
   * deliberately not the display face "Germania One", which reads as a
   * shouted headline and not small chat UI text, the same call forno and
   * aurelia made for their own display faces. `transition` matches this
   * template's own clip-path wipe reveal (see Reveal.tsx) rather than any
   * sibling's fade, bounce or blur curve.
   */
  widgetTheme: {
    accent: '#f8bf05',
    onAccent: '#232323',
    radius: '999px',
    font: '"Plus Jakarta Sans", "Plus Jakarta Sans Placeholder", sans-serif',
    transition: 'transform 0.25s cubic-bezier(0.65, 0, 0.35, 1), background-color 0.2s ease',
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
      <div className="brasa-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
