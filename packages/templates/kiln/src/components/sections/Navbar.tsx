'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

/**
 * The source nav: a flat, transparent bar over the hero with plain
 * text links and no CTA button at all — kept literal rather than adding a
 * pill button the source never had. Flat white on scroll here (no
 * `backdrop-blur`), a different, harder-edged register from aurelia's
 * frosted bar.
 */
export default function Navbar() {
  const { SITE_NAME, NAV_LINKS } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-kiln-border/40 bg-kiln-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link
          href="#top"
          onClick={close}
          className="font-kiln-display min-w-0 truncate text-xl tracking-[0.02em] text-kiln-ink uppercase"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-xs font-medium tracking-[0.14em] text-kiln-muted uppercase transition-colors hover:text-kiln-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="flex flex-col gap-1.5 md:hidden"
        >
          <span className="h-0.5 w-6 bg-kiln-ink" />
          <span className="h-0.5 w-6 bg-kiln-ink" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-kiln-border/40 bg-kiln-bg px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-xs font-semibold tracking-[0.14em] text-kiln-muted uppercase"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
