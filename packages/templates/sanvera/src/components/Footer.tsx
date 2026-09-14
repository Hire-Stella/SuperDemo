"use client";

import Image from "next/image";
import { useSanvera } from "../context";

export default function Footer() {
  const { BRAND_NAME, FOOTER, NAV_LINKS } = useSanvera();
  return (
    <footer className="bg-[var(--maroon-footer)] px-6 pt-16 pb-8 text-[var(--cream)] md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="relative h-40 w-32 overflow-hidden rounded-2xl">
            <Image src={FOOTER.image} alt={BRAND_NAME} fill sizes="128px" className="object-cover" />
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <ul className="flex flex-col gap-2 text-right">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-display text-sm font-bold uppercase tracking-wide text-[var(--cream)] hover:text-[var(--orange)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              {FOOTER.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--cream)]/30 text-xs hover:bg-[var(--cream)]/10"
                >
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 select-none text-center">
          <span className="font-display block text-[16vw] font-bold uppercase leading-none tracking-tight sm:text-[130px]">
            {BRAND_NAME}
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--cream)]/15 pt-6 text-xs text-[var(--cream)]/70 sm:flex-row">
          <p>{FOOTER.copyright}</p>
          <a href="#home" className="hover:text-[var(--cream)]">
            Back to Top
          </a>
        </div>
      </div>
    </footer>
  );
}
