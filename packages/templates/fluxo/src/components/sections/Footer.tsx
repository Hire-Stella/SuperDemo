'use client';

import Link from 'next/link';
import { useContent } from '../../context';
import { Mark } from '../Mark';

export default function Footer() {
  const { SITE_NAME, FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT } = useContent();

  const socials: { label: string; href: string }[] = [
    { label: 'Facebook', href: SOCIAL_LINKS.facebook },
    { label: 'Instagram', href: SOCIAL_LINKS.instagram },
    { label: 'LinkedIn', href: SOCIAL_LINKS.linkedin },
    { label: 'X', href: SOCIAL_LINKS.twitter },
  ];

  return (
    <footer className="border-t border-fluxo-border bg-fluxo-bg">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          <div>
            <Link href="#top" className="flex items-center gap-2.5">
              <Mark />
              <span className="font-fluxo-display text-lg text-fluxo-ink">{SITE_NAME}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fluxo-muted">
              {FOOTER.tagline}
            </p>
            <div className="mt-6 flex gap-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-xs font-semibold text-fluxo-faint transition-colors hover:text-fluxo-ink"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.1em] text-fluxo-faint uppercase">
              {FOOTER.quickLinksTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {FOOTER.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-fluxo-muted hover:text-fluxo-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.1em] text-fluxo-faint uppercase">
              Company
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-fluxo-muted">
              <li>
                <Link href="#highlights" className="hover:text-fluxo-ink">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#testimonials" className="hover:text-fluxo-ink">
                  Customers
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-fluxo-ink">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-fluxo-border pt-6 text-xs text-fluxo-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {FOOTER.copyright}
          </p>
          <p>Design by {TEMPLATE_CREDIT}</p>
        </div>
      </div>
    </footer>
  );
}
