'use client';

import Link from 'next/link';
import { useContent } from '../../context';

export default function Footer() {
  const { SITE_NAME, FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT, CONTACT } = useContent();

  return (
    <footer className="bg-brasa-dark text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div>
            <p className="font-brasa-display text-2xl">{SITE_NAME}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">{FOOTER.tagline}</p>
            <div className="mt-6 flex gap-4">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-xs font-semibold tracking-[0.06em] text-white/60 uppercase transition-colors hover:text-brasa-marigold"
              >
                Instagram
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-xs font-semibold tracking-[0.06em] text-white/60 uppercase transition-colors hover:text-brasa-marigold"
              >
                Facebook
              </a>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-xs font-semibold tracking-[0.06em] text-white/60 uppercase transition-colors hover:text-brasa-marigold"
              >
                TikTok
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
              {FOOTER.quickLinksTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
              Contact
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-white/80">
              {CONTACT.address ? <li>{CONTACT.address}</li> : null}
              {CONTACT.phone ? (
                <li>
                  <a href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`} className="hover:text-white">
                    {CONTACT.phone}
                  </a>
                </li>
              ) : null}
              {CONTACT.email ? (
                <li>
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-white">
                    {CONTACT.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {FOOTER.copyright}
          </p>
          <p>Design by {TEMPLATE_CREDIT}</p>
        </div>
      </div>
    </footer>
  );
}
