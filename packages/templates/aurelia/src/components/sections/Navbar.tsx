'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

export default function Navbar() {
  const { SITE_NAME, NAV_LINKS, RESERVE_LABEL } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-aurelia-border/60 bg-aurelia-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="#top"
          onClick={close}
          className="font-aurelia-display min-w-0 truncate text-2xl text-aurelia-plum"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-aurelia-muted transition-colors hover:text-aurelia-plum"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="#contact"
          onClick={close}
          className="aurelia-pill hidden items-center bg-aurelia-gold px-5 py-2.5 text-xs font-bold tracking-[0.06em] text-aurelia-ink uppercase transition-transform hover:scale-[1.04] md:inline-flex"
        >
          {RESERVE_LABEL}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="flex flex-col gap-1.5 md:hidden"
        >
          <span className="h-0.5 w-6 rounded-full bg-aurelia-ink" />
          <span className="h-0.5 w-6 rounded-full bg-aurelia-ink" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-aurelia-border/60 bg-aurelia-bg px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-semibold text-aurelia-muted"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="#contact"
            onClick={close}
            className="aurelia-pill inline-flex items-center justify-center bg-aurelia-gold px-5 py-3 text-xs font-bold tracking-[0.06em] text-aurelia-ink uppercase"
          >
            {RESERVE_LABEL}
          </Link>
        </div>
      )}
    </header>
  );
}
