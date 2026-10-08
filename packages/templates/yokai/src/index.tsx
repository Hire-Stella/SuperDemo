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
 * `stats` renders as this template's own plain four-number band. No `steps`,
 * `pricing`, `comparison`, `team` or `faq`: Yokai is an original concept
 * (see defaults.ts for why — no free Framer source turned up that was both
 * distinct from this library's other four and rich enough to mirror), and
 * a numbered process, price tiers, a before/after claim, a named roster and
 * an FAQ band were simply never part of the eight sections this design was
 * built with. Nothing here is invented to pad out a repertoire nothing else
 * in this template earns.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'services',
  'gallery',
  'stats',
  'testimonials',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'yokai',
  name: 'Yokai',
  description:
    'Late-night Japanese ramen & izakaya counter — edge-bleed hero, unpriced-no-more menu, steam over a static seal.',
  // An original template, not a port. A genuine search of Framer's free
  // restaurant/food marketplace turned up nothing both distinct from this
  // library's other four sources and rich enough in real sections to
  // mirror literally (see defaults.ts's header comment for the templates
  // considered and why each was set aside). Built instead from Google Fonts
  // (Yuji Boku + IBM Plex Sans), an original palette, and real photography
  // downloaded from Unsplash's free tier — nothing hotlinked.
  source: 'Original — no Framer source; Google Fonts + Unsplash (free tier), downloaded locally',
  supports: SUPPORTS,
  preview: '/previews/yokai.png',
  /**
   * This template's own real button shape, not a sibling's borrowed one:
   * the primary CTA ("Reserve a Stool") carries `border-radius: 0 12px 0
   * 12px` — a diagonal "tag" corner, sharp on the top-left and bottom-right,
   * rounded on the other two (see theme.css's `.yokai-tag`, applied at a
   * smaller radius to buttons than to photo frames). The only true circle
   * anywhere in this template is the small hanko-style seal badge in the
   * hero (`.yokai-seal`, `border-radius: 999px`) — a floating round
   * launcher matches that icon-only badge, the same reasoning tavola,
   * forno, aurelia and brasa each gave for their own launcher radius, not
   * this template's diagonal text-button shape.
   *
   * `accent`/`onAccent` are this template's own literal palette: `#ff4b2b`
   * ("lantern", the single accent behind every button and tag in
   * theme.css's `@theme inline` block) under `#f3e9d8` ("paper", the warm
   * off-white used for text on dark and for card fills) — a lit-lantern
   * red on warm paper, not gold-on-black (tavola), red/orange/yellow-on-
   * white (forno), plum-and-gold (aurelia) or marigold-and-chili-on-cream
   * (brasa). `font` is the body face, "IBM Plex Sans" — deliberately not
   * the display face "Yuji Boku", a brush-calligraphy face legible as a
   * giant headline and not as small chat UI text, the same call every
   * sibling template made for its own display face. `transition` is a
   * smooth deceleration curve with no overshoot, matching this template's
   * own lift-and-settle reveal (see Reveal.tsx) rather than brasa's clip
   * wipe, forno's bounce or aurelia's blur.
   */
  widgetTheme: {
    accent: '#ff4b2b',
    onAccent: '#f3e9d8',
    radius: '0 12px 0 12px',
    font: '"IBM Plex Sans", "IBM Plex Sans Placeholder", sans-serif',
    transition: 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), background-color 0.2s ease',
  },
};

/**
 * The page.
 *
 * Section order is the template's own. Its rhythm is part of what it is, and
 * letting a caller reorder it produces a page that is neither this template
 * nor anything anyone designed.
 */
export function Template({ content }: { content: TemplateContent }) {
  return <TemplateRaw content={adapt(content)} />;
}

/** The template's own copy, verbatim — for the gallery and for comparison. */
export function TemplateRaw({ content = DEFAULTS }: { content?: TemplateProps }) {
  return (
    <ContentProvider content={content}>
      <div className="yokai-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
