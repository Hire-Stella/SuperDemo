import Script from 'next/script';
import type { SectionKey, TemplateContent, TemplateManifest } from '@stella/template-schema';
import { BODY_HTML, SHARED_CSS, SITE_SCRIPTS_JS, STYLE_CSS } from './mirror-content';

export { TalkToStellaWidget } from './talk-to-stella';

/**
 * Not a re-authored port. Every other template in this library is rebuilt
 * against the shared `TemplateContent` schema so one tenant's copy can fill
 * a design built for somebody else's site. This one is the opposite case on
 * purpose: it is the centre's *own* real, already-live site — a KHDA-approved
 * institute's actual marketing page — scraped byte-for-byte from
 * github.com/Hire-Stella/oscar-education (`framer-mirror/home/{body.html,
 * style.css}` + the shared `framer-mirror/shared.css`), the exact way that
 * repo's own `components/MirrorPage.tsx` renders it: raw CSS in a `<style>`
 * tag, raw markup via `dangerouslySetInnerHTML`. `mirror-content.ts` holds
 * those four files verbatim as string constants — regenerate it from the
 * source repo rather than hand-editing if the real site ever changes. The
 * only bytes altered from the original export are asset path prefixes
 * (`/fonts/`, `/images/`, `/framer-runtime` → `/t/oscar/…`), so this can be
 * self-hosted under `apps/web/public/t/oscar/` alongside every other
 * template's assets.
 *
 * `content` is accepted (the registry always passes one) and ignored: a
 * literal mirror has nowhere to put substituted copy, and the whole point
 * here is to show the centre's real page, not a reflowed one.
 */
export const SUPPORTS = [
  'hero',
  'about',
  'highlights',
  'steps',
  'services',
  'pricing',
  'team',
  'testimonials',
  'faq',
  'contact',
] as const satisfies readonly SectionKey[];

export const manifest: TemplateManifest = {
  id: 'oscar',
  name: 'Oscar',
  description: "A literal mirror of Oscar Education's own live site — not a re-skin.",
  source: "Oscar Education — the centre's own site, scraped verbatim (KHDA-approved vocational training institute, Dubai, est. 1993)",
  supports: SUPPORTS,
  preview: '/previews/oscar.png',
  /**
   * Same citation as before this became a literal mirror: the nav's real pill
   * CTA (`background-color: rgb(27, 52, 40)`, `border-top-right-radius:
   * 100px`, `box-shadow` in `rgb(73, 126, 100)`) on the page's own cream
   * (`rgb(244, 240, 229)`), and the page's real display face, "Bricolage
   * Grotesque" (45 headline occurrences in the source's own CSS).
   */
  widgetTheme: {
    accent: '#1b3428',
    onAccent: '#f4f0e5',
    radius: '100px',
    font: '"Bricolage Grotesque", sans-serif',
  },
};

/** Registry entry point. `content` is intentionally unused — see file header. */
export function Template(_props: { content: TemplateContent }) {
  return <TemplateRaw />;
}

/**
 * The literal mirror.
 *
 * `id="main"` and the `data-framer-hydrate-v2` payload inside `BODY_HTML` are
 * the real Framer export's own hooks — its runtime (loaded below, self-hosted
 * from `/t/oscar/framer-runtime/`) finds and hydrates them itself. Nothing
 * here constructs that wiring; it only has to get out of the way and load the
 * same three things the source site's own `app/layout.tsx` loads, in the same
 * order and the same `afterInteractive` timing, since the runtime script
 * reads DOM the other two put there.
 */
export function TemplateRaw() {
  return (
    <div className="oscar-root">
      <style dangerouslySetInnerHTML={{ __html: SHARED_CSS + STYLE_CSS }} />
      <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />
      <Script id="oscar-framer-site-scripts" strategy="afterInteractive">
        {SITE_SCRIPTS_JS}
      </Script>
      <Script
        type="module"
        src="/t/oscar/framer-runtime/script_main.Dzqxzedm.mjs"
        strategy="afterInteractive"
      />
    </div>
  );
}
