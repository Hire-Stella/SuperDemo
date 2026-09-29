'use client';

import Link from 'next/link';
import { useContent } from '../../context';

export default function Footer() {
  const { SITE_NAME, FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT } = useContent();

  return (
    <footer className="border-t border-cryptix-border bg-cryptix-bg">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div>
            <p className="font-cryptix-display text-lg text-cryptix-ink">{SITE_NAME}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cryptix-muted">{FOOTER.tagline}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-cryptix-faint uppercase">
              {FOOTER.navTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.navLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-cryptix-muted hover:text-cryptix-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.14em] text-cryptix-faint uppercase">
              {FOOTER.socialsTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              <li>
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cryptix-muted hover:text-cryptix-ink"
                >
                  Twitter (X)
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cryptix-muted hover:text-cryptix-ink"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL_LINKS.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cryptix-muted hover:text-cryptix-ink"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-cryptix-border pt-6 text-xs text-cryptix-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {FOOTER.copyright}
          </p>
          <p>Design by {TEMPLATE_CREDIT}</p>
        </div>
      </div>
    </footer>
  );
}
