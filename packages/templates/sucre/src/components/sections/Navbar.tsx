'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

/**
 * The source's own nav: a cream pill bar floating over the hero, with a
 * soft pink-tinted drop shadow (`box-shadow: 0 … rgba(255,105,147,…)`) —
 * kept literal here as a `shadow-[…]` utility rather than a flat border,
 * since the source's own bar has no border at all, only that glow.
 */
export default function Navbar() {
  const { SITE_NAME, NAV_LINKS } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-4 z-50 mx-auto max-w-3xl px-4">
      <div className="sucre-pill flex items-center justify-between gap-4 bg-sucre-bg px-6 py-3 shadow-[0_10px_30px_-8px_rgba(255,105,147,0.35)]">
        <Link
          href="#top"
          onClick={close}
          className="font-sucre-display min-w-0 truncate text-lg text-sucre-ink"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-sucre-rose transition-colors hover:text-sucre-pink"
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
          <span className="h-0.5 w-5 rounded-full bg-sucre-ink" />
          <span className="h-0.5 w-5 rounded-full bg-sucre-ink" />
        </button>
      </div>

      {open ? (
        <div className="sucre-card mt-2 flex flex-col gap-3 bg-sucre-bg px-6 py-5 shadow-[0_10px_30px_-8px_rgba(255,105,147,0.35)] md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-semibold text-sucre-rose"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
