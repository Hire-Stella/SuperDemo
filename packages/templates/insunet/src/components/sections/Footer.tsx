'use client';

import Link from 'next/link';
import { useContent } from '../../context';

/**
 * The source's own three-column footer plus its bare social row (see
 * defaults.ts's `SOCIAL_LINKS` note).
 */
export default function Footer() {
  const { SITE_NAME, FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT, CONTACT } = useContent();

  return (
    <footer className="border-t border-insunet-border/60 bg-insunet-bg">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <p className="font-insunet-display text-xl text-insunet-ink">{SITE_NAME}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-insunet-muted">
              {FOOTER.tagline}
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-xs font-semibold tracking-[0.08em] text-insunet-muted uppercase transition-colors hover:text-insunet-primary"
              >
                Facebook
              </a>
              <a
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter/X"
                className="text-xs font-semibold tracking-[0.08em] text-insunet-muted uppercase transition-colors hover:text-insunet-primary"
              >
                Twitter/X
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-xs font-semibold tracking-[0.08em] text-insunet-muted uppercase transition-colors hover:text-insunet-primary"
              >
                Instagram
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.1em] text-insunet-teal uppercase">
              {FOOTER.quickLinksTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-insunet-muted hover:text-insunet-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.1em] text-insunet-teal uppercase">
              {FOOTER.legalLinksTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-insunet-muted hover:text-insunet-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-6 flex flex-col gap-2 text-sm text-insunet-muted">
              {CONTACT.address ? <li>{CONTACT.address}</li> : null}
              {CONTACT.phone ? <li>{CONTACT.phone}</li> : null}
              {CONTACT.email ? <li>{CONTACT.email}</li> : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-insunet-border/60 pt-6 text-xs text-insunet-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {FOOTER.copyright}
          </p>
          <p>Design by {TEMPLATE_CREDIT}</p>
        </div>
      </div>
    </footer>
  );
}
