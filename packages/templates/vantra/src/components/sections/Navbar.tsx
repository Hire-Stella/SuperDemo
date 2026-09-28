'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

/**
 * The source nav: a floating white pill bar (not full-bleed) with the links
 * in plain text and a filled dark pill CTA carrying a small circular arrow
 * badge — the same arrow badge every filled button on the page repeats (see
 * Hero.tsx). Kept floating with side margin rather than edge-to-edge, the
 * source's own literal treatment.
 */
export default function Navbar() {
  const { SITE_NAME, NAV_LINKS, NAV_CTA } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-4 z-50 px-4">
      <div className="vantra-pill mx-auto flex max-w-5xl items-center justify-between gap-4 border border-vantra-border bg-vantra-bg/95 px-3 py-2.5 shadow-[0_1px_2px_rgba(16,17,18,0.06)] backdrop-blur">
        <Link
          href="#top"
          onClick={close}
          className="font-vantra-display min-w-0 shrink-0 truncate pl-2 text-xl text-vantra-ink"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="vantra-pill px-4 py-2 text-sm font-medium text-vantra-muted transition-colors hover:bg-vantra-surface hover:text-vantra-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href={NAV_CTA.href}
          onClick={close}
          className="vantra-pill hidden shrink-0 items-center gap-2 bg-vantra-dark py-2 pr-2 pl-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:inline-flex"
        >
          {NAV_CTA.label}
          <span className="vantra-pill flex h-6 w-6 items-center justify-center bg-white">
            <Image src="/t/vantra/icons/arrow.svg" alt="" width={11} height={8} />
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="vantra-pill flex h-9 w-9 flex-col items-center justify-center gap-1.5 border border-vantra-border md:hidden"
        >
          <span className="h-0.5 w-4 bg-vantra-ink" />
          <span className="h-0.5 w-4 bg-vantra-ink" />
        </button>
      </div>

      {open ? (
        <div className="vantra-card mx-auto mt-2 flex max-w-5xl flex-col gap-1 border border-vantra-border bg-vantra-bg p-3 shadow-lg md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="vantra-pill px-4 py-2.5 text-sm font-medium text-vantra-muted hover:bg-vantra-surface hover:text-vantra-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={NAV_CTA.href}
            onClick={close}
            className="vantra-pill mt-1 inline-flex items-center justify-center gap-2 bg-vantra-dark py-2.5 text-sm font-semibold text-white"
          >
            {NAV_CTA.label}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
