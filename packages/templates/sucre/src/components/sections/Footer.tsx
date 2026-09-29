'use client';

import Link from 'next/link';
import { useContent } from '../../context';

/**
 * The source's own three-column footer — "Quicks" (nav links), "Others"
 * (legal links) and a contact block — plus its social row, literal apart
 * from the substitution defaults.ts's `SOCIAL_LINKS` note explains.
 */
export default function Footer() {
  const { SITE_NAME, FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT, CONTACT } = useContent();

  return (
    <footer className="border-t border-sucre-border/60 bg-sucre-bg">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <p className="font-sucre-display text-xl text-sucre-ink">{SITE_NAME}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sucre-muted">
              {FOOTER.tagline}
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-xs font-semibold tracking-[0.1em] text-sucre-rose uppercase transition-colors hover:text-sucre-pink"
              >
                Instagram
              </a>
              <a
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter/X"
                className="text-xs font-semibold tracking-[0.1em] text-sucre-rose uppercase transition-colors hover:text-sucre-pink"
              >
                Twitter/X
              </a>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Youtube"
                className="text-xs font-semibold tracking-[0.1em] text-sucre-rose uppercase transition-colors hover:text-sucre-pink"
              >
                Youtube
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-sucre-rose uppercase">
              {FOOTER.quickLinksTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sucre-muted hover:text-sucre-pink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-sucre-rose uppercase">
              {FOOTER.legalLinksTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sucre-muted hover:text-sucre-pink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-sucre-muted">
              {CONTACT.address ? <li>{CONTACT.address}</li> : null}
              {CONTACT.phone ? <li>{CONTACT.phone}</li> : null}
              {CONTACT.email ? <li>{CONTACT.email}</li> : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-sucre-border/60 pt-6 text-xs text-sucre-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {FOOTER.copyright}
          </p>
          <p>Design by {TEMPLATE_CREDIT}</p>
        </div>
      </div>
    </footer>
  );
}
