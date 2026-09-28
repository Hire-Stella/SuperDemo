'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

/**
 * The source nav: a fixed glass bar (`backdrop-filter: blur(10px)` over
 * `rgba(8,7,14,0.8)`, confirmed in its inline styles) with plain text links
 * and one mint pill CTA on the right — kept literal here as a sticky,
 * blurred dark bar rather than a flat one, a different register from
 * kiln's flat white-on-scroll bar.
 */
export default function Navbar() {
  const { SITE_NAME, NAV_LINKS, HERO } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-cryptix-border/60 bg-cryptix-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="#top"
          onClick={close}
          className="font-cryptix-display min-w-0 truncate text-lg text-cryptix-ink"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-cryptix-muted transition-colors hover:text-cryptix-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          {HERO.primaryCta ? (
            <Link
              href={HERO.primaryCta.href}
              className="cryptix-pill cryptix-glow inline-flex items-center justify-center bg-cryptix-accent px-5 py-2.5 text-sm font-semibold text-cryptix-accent-ink transition-transform hover:scale-[1.03]"
            >
              {HERO.primaryCta.label}
            </Link>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="flex flex-col gap-1.5 md:hidden"
        >
          <span className="h-0.5 w-6 bg-cryptix-ink" />
          <span className="h-0.5 w-6 bg-cryptix-ink" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-cryptix-border/60 bg-cryptix-bg px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-cryptix-muted hover:text-cryptix-ink"
            >
              {link.label}
            </Link>
          ))}
          {HERO.primaryCta ? (
            <Link
              href={HERO.primaryCta.href}
              onClick={close}
              className="cryptix-pill inline-flex items-center justify-center bg-cryptix-accent px-5 py-2.5 text-sm font-semibold text-cryptix-accent-ink"
            >
              {HERO.primaryCta.label}
            </Link>
          ) : null}
        </div>
      )}
    </header>
  );
}
