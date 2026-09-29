'use client';

import Link from 'next/link';
import { useContent } from '../../context';

export default function Footer() {
  const { SITE_NAME, FOOTER, SOCIAL_LINKS, CONTACT } = useContent();

  return (
    <footer className="border-t border-pearl-border bg-pearl-surface">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div>
            <p className="font-pearl-display text-xl text-pearl-taro">{SITE_NAME}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-pearl-muted">
              {FOOTER.tagline}
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-xs font-bold tracking-[0.08em] text-pearl-muted uppercase transition-colors hover:text-pearl-taro"
              >
                Instagram
              </a>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-xs font-bold tracking-[0.08em] text-pearl-muted uppercase transition-colors hover:text-pearl-taro"
              >
                TikTok
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-[0.14em] text-pearl-muted uppercase">
              {FOOTER.quickLinksTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-pearl-ink hover:text-pearl-taro">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-[0.14em] text-pearl-muted uppercase">
              Contact
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-pearl-ink">
              {CONTACT.address ? <li>{CONTACT.address}</li> : null}
              {CONTACT.hours ? <li>{CONTACT.hours}</li> : null}
              {CONTACT.phone ? (
                <li>
                  <a
                    href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`}
                    className="hover:text-pearl-taro"
                  >
                    {CONTACT.phone}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-pearl-border pt-6 text-xs text-pearl-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {FOOTER.copyright}
          </p>
          <p>An original Stella template — no Framer source.</p>
        </div>
      </div>
    </footer>
  );
}
