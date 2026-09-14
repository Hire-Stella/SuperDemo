"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import CtaArrowBadge from "../components/CtaArrowBadge";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about-us", label: "About Us" },
  { href: "/destination", label: "Destinations" },
  { href: "/gallery", label: "Gallery" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[var(--bg)]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image src="/t/tripvanta/images/logo.svg" alt="Wanderloom" width={160} height={30} priority />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[var(--fg)] ${
                  pathname === link.href ? "text-[var(--fg)]" : "text-[var(--muted)]"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/contact"
          className="hidden items-center rounded-full bg-[var(--fg)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105 md:inline-flex"
        >
          Plan Your Trip
          <CtaArrowBadge onDark />
        </Link>

        <button
          aria-label="Toggle menu"
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`h-0.5 w-6 bg-[var(--fg)] transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-[var(--fg)] transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-[var(--fg)] transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {open && (
        <div className="border-t border-black/5 px-5 pb-5 md:hidden">
          <ul className="flex flex-col gap-4 pt-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-base font-medium" onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-[var(--fg)] px-5 py-2.5 text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                Plan Your Trip
                <CtaArrowBadge onDark />
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
