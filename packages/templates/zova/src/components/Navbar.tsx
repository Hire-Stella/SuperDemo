"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ctaHref, ctaLabel, navLinks } from "../defaults";
import { IconClose, IconMenu } from "./icons";
import { useContent } from "../context";

export function Navbar() {
  const { ctaHref, ctaLabel, navLinks } = useContent();
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border border-zv-line bg-white/90 px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md sm:px-4">
        <Link href="/" onClick={close} className="flex shrink-0 items-center gap-2 pl-1">
          <Image src="/t/zova/logo.png" alt="Zova" width={32} height={32} className="h-8 w-8 rounded-lg" />
          <span className="zv-heading text-base text-zv-ink">Zova</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-zv-ink/75 transition-colors hover:text-zv-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href={ctaHref}
            className="zv-btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.03]"
          >
            {ctaLabel}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zv-line lg:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile"
          className="zv-fade mx-auto mt-2 flex max-w-5xl flex-col gap-1 rounded-3xl border border-zv-line bg-white p-5 shadow-lg lg:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={close}
              className="rounded-xl px-3 py-2.5 text-base font-medium text-zv-ink transition-colors hover:bg-zv-card"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={ctaHref}
            onClick={close}
            className="zv-btn-primary mt-3 inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold"
          >
            {ctaLabel}
          </Link>
        </nav>
      )}
    </header>
  );
}
