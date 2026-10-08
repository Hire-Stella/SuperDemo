'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

/**
 * The source's own nav: a flat white bar with plain text links and one real
 * pill button on the right — the source's own literal "Book An Appointment"
 * control, kept here reading straight off `HERO.primaryCta` rather than a
 * second, separately-tracked copy of the same label and link.
 */
export default function Navbar() {
  const { SITE_NAME, NAV_LINKS, HERO } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-insunet-border/60 bg-insunet-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="#top"
          onClick={close}
          className="font-insunet-display min-w-0 truncate text-xl text-insunet-ink"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-insunet-muted transition-colors hover:text-insunet-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          {HERO.primaryCta ? (
            <Link
              href={HERO.primaryCta.href}
              className="insunet-pill inline-flex items-center justify-center bg-insunet-accent px-5 py-2.5 text-sm font-semibold text-insunet-accent-ink transition-colors hover:bg-insunet-accent/85"
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
          <span className="h-0.5 w-6 rounded-full bg-insunet-ink" />
          <span className="h-0.5 w-6 rounded-full bg-insunet-ink" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-insunet-border/60 bg-insunet-bg px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-semibold text-insunet-muted"
            >
              {link.label}
            </Link>
          ))}
          {HERO.primaryCta ? (
            <Link
              href={HERO.primaryCta.href}
              onClick={close}
              className="insunet-pill mt-2 inline-flex items-center justify-center bg-insunet-accent px-5 py-2.5 text-sm font-semibold text-insunet-accent-ink"
            >
              {HERO.primaryCta.label}
            </Link>
          ) : null}
        </div>
      )}
    </header>
  );
}
