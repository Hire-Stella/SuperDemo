'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

export default function Navbar() {
  const { SITE_NAME, NAV_LINKS, ORDER_LABEL } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-forno-border bg-forno-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="#top"
          onClick={close}
          className="font-forno-display min-w-0 truncate text-2xl text-forno-red"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-forno-text transition-colors hover:text-forno-red"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="#menu"
          onClick={close}
          className="forno-pill hidden items-center bg-forno-red px-5 py-2.5 text-xs font-bold tracking-[0.06em] text-white uppercase transition-transform hover:scale-[1.04] md:inline-flex"
        >
          {ORDER_LABEL}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="flex flex-col gap-1.5 md:hidden"
        >
          <span className="h-0.5 w-6 rounded-full bg-forno-ink" />
          <span className="h-0.5 w-6 rounded-full bg-forno-ink" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-forno-border bg-forno-bg px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-semibold text-forno-text"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#menu"
            onClick={close}
            className="forno-pill inline-flex items-center justify-center bg-forno-red px-5 py-3 text-xs font-bold tracking-[0.06em] text-white uppercase"
          >
            {ORDER_LABEL}
          </Link>
        </div>
      )}
    </header>
  );
}
