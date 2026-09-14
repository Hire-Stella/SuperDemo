"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useSanvera } from "../context";

export default function Navbar() {
  const { BRAND_NAME, NAV_LINKS } = useSanvera();
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <a href="#home" className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-[var(--cream)]">
          <Image src="/t/sanvera/images/logo-mark.png" alt="" width={28} height={28} className="h-5 w-5" />
          {BRAND_NAME}
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--cream)]"
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {/* Source site's own nav label -- kept verbatim for fidelity. */}
          Manu
          <span className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-[var(--cream)]" />
            <span className="h-0.5 w-5 bg-[var(--cream)]" />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mx-6 mt-2 rounded-3xl bg-[var(--maroon-deep)] px-8 py-8 md:mx-10"
          >
            <ul className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-2xl font-bold text-[var(--cream)] transition-colors hover:text-[var(--orange)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
