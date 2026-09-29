'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

export default function Navbar() {
  const { SITE_NAME, NAV_LINKS, ORDER_LABEL } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-natsu-ink/10 bg-natsu-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="#top"
          onClick={close}
          className="font-natsu-display min-w-0 truncate text-2xl lowercase text-natsu-ink"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-natsu-ink transition-colors hover:text-natsu-caramel"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="#contact"
          onClick={close}
          className="natsu-pill hidden items-center border border-natsu-ink bg-natsu-caramel px-6 py-2.5 text-xs font-semibold tracking-[0.04em] text-natsu-bg uppercase transition-transform hover:scale-[1.03] md:inline-flex"
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
          <span className="h-0.5 w-6 bg-natsu-ink" />
          <span className="h-0.5 w-6 bg-natsu-ink" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-natsu-ink/10 bg-natsu-bg px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-natsu-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#contact"
            onClick={close}
            className="natsu-pill inline-flex items-center justify-center border border-natsu-ink bg-natsu-caramel px-6 py-3 text-xs font-semibold tracking-[0.04em] text-natsu-bg uppercase"
          >
            {ORDER_LABEL}
          </Link>
        </div>
      )}
    </header>
  );
}
