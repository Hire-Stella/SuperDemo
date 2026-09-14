"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { BOOKING_URL, NAV_LINKS, SITE_NAME } from "../defaults";
import { useContent } from "../context";

export default function Navbar() {
  const { BOOKING_URL, NAV_LINKS, SITE_NAME } = useContent();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <motion.nav
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-5xl items-center justify-between rounded-3xl border border-white/10 bg-ink/80 px-5 py-3 text-cream shadow-lg shadow-black/25 backdrop-blur-xl">
        <Link
          href="#hero-section"
          className="font-display text-xl font-semibold tracking-wide"
        >
          {SITE_NAME}
        </Link>

        <ul className="hidden items-center gap-8 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-cream/80 transition-colors hover:text-cream"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Link
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          className="flex flex-col gap-1.5 md:hidden"
        >
          <span className="h-0.5 w-6 bg-cream" />
          <span className="h-0.5 w-6 bg-cream" />
        </button>
      </motion.nav>

      {open && (
        <div className="mx-auto mt-2 flex max-w-5xl flex-col gap-4 rounded-3xl border border-white/10 bg-ink/95 p-6 text-cream backdrop-blur-xl md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-base text-cream/90"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent px-5 py-2 text-center text-sm font-medium text-white"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
