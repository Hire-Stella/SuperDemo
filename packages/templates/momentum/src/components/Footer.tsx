"use client";

import Link from "next/link";
import { FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT } from "../defaults";
import { RevealGroup, RevealItem } from "../components/Reveal";
import { useContent } from "../context";

export default function Footer() {
  const { FOOTER, SOCIAL_LINKS, TEMPLATE_CREDIT } = useContent();
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <RevealGroup className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <RevealItem y={20} className="lg:col-span-2">
            <p className="font-display text-2xl font-semibold">{FOOTER.logo}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
              {FOOTER.tagline}
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-xs transition-colors hover:border-accent hover:text-accent"
              >
                FB
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-xs transition-colors hover:border-accent hover:text-accent"
              >
                IG
              </a>
              <a
                href={SOCIAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-xs transition-colors hover:border-accent hover:text-accent"
              >
                X
              </a>
            </div>
          </RevealItem>

          <RevealItem y={20}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cream/50">
              {FOOTER.quickLinksTitle}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {FOOTER.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-cream/80 hover:text-cream">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </RevealItem>

          <RevealItem y={20}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cream/50">
              {FOOTER.programsTitle}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {FOOTER.programs.map((program) => (
                <li key={program.label}>
                  <Link href={program.href} className="text-cream/80 hover:text-cream">
                    {program.label}
                  </Link>
                </li>
              ))}
            </ul>
          </RevealItem>
        </RevealGroup>

        <div className="mt-16 flex flex-col gap-2 border-t border-cream/10 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{FOOTER.copyright}</p>
          <p>Design by {TEMPLATE_CREDIT}</p>
        </div>
      </div>
    </footer>
  );
}
