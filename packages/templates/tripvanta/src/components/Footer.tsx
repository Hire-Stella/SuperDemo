"use client";

import Image from "next/image";
import Link from "next/link";
import Newsletter from "../components/Newsletter";
import { FOOTER_DESTINATIONS, TEMPLATE_CREDIT } from "../defaults";
import SubscribeChannel from "../components/SubscribeChannel";
import { useContent } from "../context";

// Note: the live source spells "Instagram" as "Instragram" (a typo). We
// decided to fix this obvious typo in the link label since it doesn't
// affect content fidelity the way the intentionally-replicated CMS bugs
// do -- see NOTES.md for the full reasoning.
const SOCIALS = [
  { label: "Facebook", href: "#" },
  { label: "Youtube", href: "#" },
  { label: "Instagram", href: "#" },
];

export default function Footer() {
  const { TEMPLATE_CREDIT } = useContent();
  return (
    <footer>
      <Newsletter />
      <div className="bg-[#1c1305] px-5 py-16 text-white/80 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">
          <div>
            <Image
              src="/t/tripvanta/images/logo.svg"
              alt="Wanderloom"
              width={160}
              height={30}
              className="mb-4 brightness-0 invert"
            />
            <ul className="flex gap-4 text-sm">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              Popular Destination
            </h3>
            <ul className="space-y-2 text-sm">
              {FOOTER_DESTINATIONS.map((d) => (
                <li key={d.slug}>
                  <Link href={`/destination/${d.slug}`} className="hover:text-white">
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              Subscribe To Our Channel
            </h3>
            <SubscribeChannel />
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms-and-condition" className="hover:text-white">
                  Term &amp; Condition
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs text-white/50">
          {/* TEMPLATE_CREDIT: template studio's brand credit, flagged for the
              site owner to keep / replace / remove. The "Buy this template"
              marketplace cross-sell link was intentionally NOT built. */}
          Copyright © {TEMPLATE_CREDIT}. All Right Reserved
        </div>
      </div>
    </footer>
  );
}
