'use client';

import { useContent } from '../../context';

/**
 * The source footer: a solid inverted band in the page's own accent blue,
 * a giant auto-fit wordmark in cream, and a bottom row of copyright,
 * status line and two legal links — all in the source's own literal
 * cream-on-blue colour pairing (`--token-5fd15df0-...` on
 * `--token-582fe791-...`), confirmed against its SSR HTML.
 */
export default function Footer() {
  const { SITE_NAME, FOOTER, TEMPLATE_CREDIT } = useContent();

  return (
    <footer className="bg-folio-accent">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-12 px-6 py-20">
        <p
          className="font-folio-display text-center text-folio-cream uppercase"
          style={{ fontSize: 'clamp(2.5rem, 12vw, 6rem)' }}
        >
          {SITE_NAME}
        </p>

        <div className="flex w-full flex-col items-center gap-4 border-t border-white/20 pt-6 text-[11px] text-folio-cream uppercase sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {FOOTER.copyright}
          </p>
          <p>{FOOTER.tagline}</p>
          <div className="flex gap-4">
            {FOOTER.legalLinks.map((link) => (
              <a key={link.label} href={link.href} className="hover:opacity-70">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-folio-cream/70 uppercase">Design: {TEMPLATE_CREDIT}</p>
      </div>
    </footer>
  );
}
