"use client";

import Link from "next/link";

import { bookCallHref, bookCallLabel, navLinks, socialLinks } from "../defaults";
import { socialIcon } from "./icons";
import { NewsletterForm } from "./NewsletterForm";
import { Wordmark } from "./Wordmark";
import { useContent } from "../context";

const footerNavA = [
  { label: "Home", href: "/#top" },
  ...navLinks.filter((link) =>
    ["Features", "How it Works", "Integration", "Performance", "Pricing", "FAQ"].includes(link.label),
  ),
];

const footerNavB = [
  ...navLinks.filter((link) => ["About Us", "Client Insights", "Journal"].includes(link.label)),
  { label: bookCallLabel, href: bookCallHref },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  const { bookCallHref, bookCallLabel, navLinks, socialLinks } = useContent();
  return (
    <footer className="overflow-hidden">
      <div className="flex justify-center overflow-hidden bg-rs-bg py-6 sm:py-10">
        <p aria-hidden="true" className="rs-wordmark-fit rs-gradient-text font-display font-extrabold lowercase">
          vectora
        </p>
      </div>

      <div className="rs-gradient-footer text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
            <div>
              <Wordmark variant="mono" className="text-white" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/75">
                Making AI accessible to businesses worldwide — turn data into strategic advantages,
                driving growth and success.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = socialIcon(social.icon);
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-white hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-white/60 uppercase">Navigate</p>
              <ul className="mt-4 flex flex-col gap-3">
                {footerNavA.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/80 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-white/60 uppercase opacity-0 lg:opacity-100">
                &nbsp;
              </p>
              <ul className="mt-4 flex flex-col gap-3 lg:mt-4">
                {footerNavB.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/80 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-white/60 uppercase">Stay in the Loop</p>
              <p className="mt-4 text-sm text-white/75">Be first to know what&rsquo;s next</p>
              <NewsletterForm />
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-8 text-xs text-white/70 sm:flex-row">
            <p>© {new Date().getFullYear()} Vectora. All rights reserved.</p>
            <p>Budapest · London · Amsterdam</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
