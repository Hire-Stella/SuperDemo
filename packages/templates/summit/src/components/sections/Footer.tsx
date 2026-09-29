'use client';

import Link from 'next/link';
import { useContent } from '../../context';

/**
 * The source's own simple footer: brand name, tagline, a quick-links
 * column and a copyright line — plus its two social icons, kept as bare,
 * unconfigured placeholder roots rather than the template author's own
 * personal links (see defaults.ts's `SOCIAL_LINKS` note).
 */
export default function Footer() {
  const { SITE_NAME, FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT } = useContent();

  return (
    <footer className="border-t border-white/10 bg-summit-bg">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="font-summit-display text-xl text-summit-ink">{SITE_NAME}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-summit-muted">
              {FOOTER.tagline}
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={SOCIAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="text-xs font-semibold tracking-[0.1em] text-summit-faint uppercase transition-colors hover:text-summit-gold"
              >
                X
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-xs font-semibold tracking-[0.1em] text-summit-faint uppercase transition-colors hover:text-summit-gold"
              >
                Instagram
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-summit-faint uppercase">
              {FOOTER.quickLinksTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-summit-muted transition-colors hover:text-summit-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-summit-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            {new Date().getFullYear()} {FOOTER.copyright}
          </p>
          <p>Design by {TEMPLATE_CREDIT}</p>
        </div>
      </div>
    </footer>
  );
}
