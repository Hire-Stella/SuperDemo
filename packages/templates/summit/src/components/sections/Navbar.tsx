'use client';

import { ArrowRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useContent } from '../../context';

/**
 * The source nav: a transparent bar over the dark hero, plain text links
 * and a filled "Get Started" pill with the source's own real arrow glyph —
 * kept literal rather than the frosted/blurred bar several siblings give
 * their own light-mode navs.
 */
export default function Navbar() {
  const { SITE_NAME, NAV_LINKS, HERO } = useContent();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-summit-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="#top"
          onClick={close}
          className="font-summit-display min-w-0 truncate text-xl text-summit-ink"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-summit-muted transition-colors hover:text-summit-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {HERO.primaryCta ? (
          <Link
            href={HERO.primaryCta.href}
            className="summit-pill hidden items-center gap-2 bg-white/85 px-5 py-2.5 text-sm font-semibold text-summit-bg transition-colors hover:bg-white md:inline-flex"
          >
            {HERO.primaryCta.label}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
          className="text-summit-ink md:hidden"
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-white/10 bg-summit-bg px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="text-sm font-medium text-summit-muted"
            >
              {link.label}
            </Link>
          ))}
          {HERO.primaryCta ? (
            <Link
              href={HERO.primaryCta.href}
              onClick={close}
              className="summit-pill inline-flex items-center justify-center gap-2 bg-white/85 px-5 py-2.5 text-sm font-semibold text-summit-bg"
            >
              {HERO.primaryCta.label}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      )}
    </header>
  );
}
