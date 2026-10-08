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
 * `steps` and `team` both render as the source's own real bands: a
 * three-phrase process list folded into the home page's "About" band, and a
 * three-person roster from the source's separate `/about` route (see
 * defaults.ts). No `pricing`, `gallery` or `comparison`: the source prices
 * no plan tiers, keeps no photo gallery anywhere on the site, and makes no
 * before/after claim, so this port does not invent any of them to fill the
 * repertoire out.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'steps',
  'services',
  'highlights',
  'stats',
  'testimonials',
  'team',
  'faq',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'insunet',
  name: 'Insunet',
  description:
    'Friendly insurtech landing page — cut-out hero photography on a colour panel, coverage-type cards, claims-first trust messaging, and a get-a-quote form.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Insunet Lite" — a free Framer template by FramerBite, published on the
  // Framer marketplace for insurance agencies and brokers, kept under its
  // own real brand name rather than renamed.
  source: 'FramerBite — "Insunet Lite" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/insunet.png',
  /**
   * Derived from the source's own real CSS custom properties and one real
   * button, not guessed.
   *
   * `accent` is the source's own literal hero-button fill colour —
   * `rgb(124,237,81)` (`#7ced51`, its own CSS custom property
   * `--token-22b40143…`, confirmed on the "Book An Appointment" button's own
   * inline style) — a bright, optimistic green against a source whose other
   * major hue, `rgb(0,153,255)` blue, is reserved for links and small icons
   * throughout the rest of the page. `onAccent` is that same button's own
   * literal label colour, `rgb(0,0,0)` — plain black text on the green
   * fill, not white, confirmed in the same inline style. `radius` is that
   * button's own literal `border-radius:58px` on a control that size — a
   * true pill once generalised, not aurelia's or sucre's `999px` computed
   * differently but the same visual language. `font` is "Instrument Sans" —
   * this port's own body face (see theme.css's own note on why the source's
   * three original fonts were not carried over) — not the display face
   * "Bricolage Grotesque" used only for large headlines, the same call
   * every sibling template's manifest makes for its body face over its
   * display one. `transition` has no literal source value to port — the
   * source's own hover states run entirely through its client-only Framer
   * runtime with no static CSS transition anywhere in its compiled
   * stylesheet — so this is hand-matched to a plain, fast ease, the same
   * disclosed gap sucre's and kiln's own manifests flag for their sources'
   * equivalent JS-only interactions.
   */
  widgetTheme: {
    accent: '#7ced51',
    onAccent: '#000000',
    radius: '999px',
    font: '"Instrument Sans", "Instrument Sans Placeholder", sans-serif',
    transition: 'background-color 0.3s ease, color 0.3s ease',
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
      <div className="insunet-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
