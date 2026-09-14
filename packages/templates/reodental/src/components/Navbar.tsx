"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import LabelTrackButton from "./LabelTrackButton";
import { BRAND_NAME, CONTACT_PHONE, CONTACT_PHONE_HREF, NAV_LINKS } from "../defaults";
import { useContent } from "../context";

export default function Navbar() {
  const { BRAND_NAME, CONTACT_PHONE, CONTACT_PHONE_HREF, NAV_LINKS } = useContent();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/t/reodental/images/logo-tooth-icon.png"
            alt={`${BRAND_NAME} logo`}
            width={28}
            height={28}
          />
          <span className="text-lg font-semibold tracking-tight text-ink">
            {BRAND_NAME}
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={CONTACT_PHONE_HREF}
            className="text-sm font-medium text-ink"
          >
            {CONTACT_PHONE}
          </a>
          <LabelTrackButton
            href="/book-appointment"
            icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          >
            Book a Visit
          </LabelTrackButton>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong md:hidden"
        >
          <span className="sr-only">Menu</span>☰
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border px-6 pb-6 md:hidden"
        >
          <div className="flex flex-col gap-4 pt-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted"
              >
                {link.label}
              </Link>
            ))}
            <a href={CONTACT_PHONE_HREF} className="text-sm font-medium text-ink">
              {CONTACT_PHONE}
            </a>
            <LabelTrackButton href="/book-appointment" className="w-fit">
              Book a Visit
            </LabelTrackButton>
          </div>
        </motion.div>
      )}
    </header>
  );
}
