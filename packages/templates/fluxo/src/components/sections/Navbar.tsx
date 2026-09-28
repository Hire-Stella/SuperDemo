'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';
import { Mark } from '../Mark';

/**
 * The source nav: a flat white bar, plain text links, and a filled pill
 * "Get started" CTA (`Primary - large`/`Primary - small` in its own
 * compiled CSS) — kept literal down to the pill radius and the border
 * hairline under the bar.
 */
export default function Navbar() {
  const { SITE_NAME, NAV_LINKS, HERO } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-fluxo-border bg-fluxo-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="#top" onClick={close} className="flex min-w-0 items-center gap-2.5">
          <Mark />
          <span className="font-fluxo-display truncate text-lg text-fluxo-ink">{SITE_NAME}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-fluxo-muted transition-colors hover:text-fluxo-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          {HERO.primaryCta ? (
            <Link
              href={HERO.primaryCta.href}
              className="fluxo-pill inline-flex items-center justify-center bg-fluxo-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-fluxo-primary-hover"
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
          <span className="h-0.5 w-6 rounded-full bg-fluxo-ink" />
          <span className="h-0.5 w-6 rounded-full bg-fluxo-ink" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-fluxo-border bg-fluxo-bg px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-fluxo-muted"
            >
              {link.label}
            </Link>
          ))}
          {HERO.primaryCta ? (
            <Link
              href={HERO.primaryCta.href}
              onClick={close}
              className="fluxo-pill inline-flex items-center justify-center bg-fluxo-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              {HERO.primaryCta.label}
            </Link>
          ) : null}
        </div>
      )}
    </header>
  );
}
