'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

export default function Navbar() {
  const { SITE_NAME, NAV_LINKS, BOOK_LABEL } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-tavola-ink/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="#top"
          onClick={close}
          className="font-display min-w-0 truncate text-xl tracking-wide text-tavola-cream"
        >
          {SITE_NAME.toUpperCase()}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-xs font-medium tracking-[0.14em] text-tavola-cream/80 uppercase transition-colors hover:text-tavola-cream"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="#contact"
          onClick={close}
          className="tavola-btn hidden items-center border border-tavola-cream/15 bg-[#f2f2f2] px-5 py-2.5 text-xs font-medium tracking-[0.1em] text-tavola-gold uppercase transition-transform hover:scale-[1.03] md:inline-flex"
        >
          {BOOK_LABEL}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="flex flex-col gap-1.5 md:hidden"
        >
          <span className="h-px w-6 bg-tavola-cream" />
          <span className="h-px w-6 bg-tavola-cream" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-tavola-cream/10 bg-tavola-ink px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium tracking-[0.1em] text-tavola-cream/90 uppercase"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#contact"
            onClick={close}
            className="tavola-btn inline-flex items-center justify-center border border-tavola-cream/15 bg-[#f2f2f2] px-5 py-3 text-xs font-medium tracking-[0.1em] text-tavola-gold uppercase"
          >
            {BOOK_LABEL}
          </Link>
        </div>
      )}
    </header>
  );
}
