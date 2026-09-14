"use client";

import Link from "next/link";
import { useState } from "react";

import { bookCallHref, navLinks, primaryCtaHref, primaryCtaLabel } from "../defaults";
import { IconCalendar, IconClose, IconGrid, IconMenu } from "./icons";
import { Wordmark } from "./Wordmark";
import { useContent } from "../context";

export function Navbar() {
  const { bookCallHref, navLinks, primaryCtaHref, primaryCtaLabel } = useContent();
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = () => setMobileOpen(false);

  return (
    <header className="sticky top-3 z-50 px-3 sm:top-4 sm:px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border border-black/5 bg-white/90 px-4 py-2.5 shadow-lg shadow-black/5 backdrop-blur-md sm:px-5">
        <Link href="/#top" onClick={close} className="flex shrink-0 items-center">
          <Wordmark className="text-lg sm:text-xl" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-rs-ink/80 transition-colors hover:text-rs-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle quick links"
            className="flex h-10 w-10 items-center justify-center rounded-full text-rs-ink/70 transition-colors hover:bg-black/5"
          >
            <IconGrid className="h-4 w-4" />
          </button>
          <Link
            href={bookCallHref}
            aria-label="Book a call"
            className="rs-gradient-brand flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-[1.05]"
          >
            <IconCalendar className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 lg:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile"
          className="rs-fade mx-auto mt-2 max-w-7xl rounded-3xl border border-black/5 bg-white px-6 py-5 shadow-lg lg:hidden"
        >
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} onClick={close} className="text-base font-medium text-rs-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryCtaHref}
              onClick={close}
              className="rs-gradient-brand inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={bookCallHref}
              onClick={close}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-rs-ink"
            >
              <IconCalendar className="h-4 w-4" />
              Book a Call
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
