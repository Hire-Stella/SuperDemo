'use client';

import Link from 'next/link';
import { useContent } from '../../context';

export default function Footer() {
  const { SITE_NAME, FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT, CONTACT } = useContent();

  return (
    <footer className="bg-tavola-ink text-tavola-cream">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl">{SITE_NAME.toUpperCase()}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-tavola-cream/70">
              {FOOTER.tagline}
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-xs tracking-[0.1em] text-tavola-cream/60 uppercase transition-colors hover:text-tavola-gold"
              >
                FB
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-xs tracking-[0.1em] text-tavola-cream/60 uppercase transition-colors hover:text-tavola-gold"
              >
                IG
              </a>
              <a
                href={SOCIAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="text-xs tracking-[0.1em] text-tavola-cream/60 uppercase transition-colors hover:text-tavola-gold"
              >
                X
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-tavola-cream/50 uppercase">
              {FOOTER.quickLinksTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-tavola-cream/80 hover:text-tavola-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-tavola-cream/50 uppercase">
              Reservation
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-tavola-cream/80">
              {CONTACT.address ? <li>{CONTACT.address}</li> : null}
              {CONTACT.phone ? (
                <li>
                  <a
                    href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
                    className="hover:text-tavola-cream"
                  >
                    {CONTACT.phone}
                  </a>
                </li>
              ) : null}
              {CONTACT.email ? (
                <li>
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-tavola-cream">
                    {CONTACT.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-tavola-cream/10 pt-6 text-xs text-tavola-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {FOOTER.copyright}
          </p>
          <p>Design by {TEMPLATE_CREDIT}</p>
        </div>
      </div>
    </footer>
  );
}
