import type { SectionKey, TemplateContent, TemplateManifest } from '@stella/template-schema';
import { ContentProvider } from './context';
import { adapt, DEFAULTS, type TemplateProps } from './content';
import Page from './page';

/**
 * What this template can draw.
 *
 * Declared rather than inferred so a product can offer only the templates
 * that suit a tenant. No `services`, `gallery`, `stats`, `comparison` or
 * `team`: the source has no priced menu of services, no photo wall, no
 * animated counters, no before/after claim, and no roster — this port does
 * not invent any of them to fill the gap.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'steps',
  'testimonials',
  'pricing',
  'faq',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'cryptix',
  name: 'Cryptix',
  description:
    'Dark, glowing crypto-exchange landing page — live price ticker, non-custodial security messaging, tiered pricing.',
  // The clone, not the site it was cloned from: a literal HTML/CSS mirror of
  // "Cryptix" — a free Framer template by Arthur, published on the Framer
  // marketplace for crypto exchanges, wallets and Web3 trading products.
  source: 'Arthur — "Cryptix" (Framer marketplace, free template)',
  supports: SUPPORTS,
  preview: '/previews/cryptix.png',
  /**
   * `accent` is the source's own literal primary-button fill,
   * `rgb(0, 255, 178)` — confirmed against its SSR HTML's inline
   * `background-color` on the hero's "Get started now" button, glowing
   * mint-green against the near-black page rather than any sibling
   * template's colour. `onAccent` is that same button's own literal text
   * colour, `rgb(0, 0, 0)` — black-on-mint, not white-on-accent. `radius`
   * is the source's own `border-radius: 48px` on every pill button,
   * expressed here as a true pill so it holds at any button height.
   * `transition` mirrors this template's own Reveal easing (see
   * `Reveal.tsx`) rather than a generic linear hover.
   */
  widgetTheme: {
    accent: '#00ffb2',
    onAccent: '#000000',
    radius: '999px',
    font: '"Manrope", "Manrope Placeholder", sans-serif',
    transition: 'background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
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

/** The template exactly as cloned. Every fallback, and the gallery's preview. */
export function TemplateRaw({ content = DEFAULTS }: { content?: TemplateProps }) {
  return (
    <ContentProvider content={content}>
      <div className="cryptix-root">
        <Page />
      </div>
    </ContentProvider>
  );
}

export { DEFAULTS, adapt };
export type { TemplateProps };
