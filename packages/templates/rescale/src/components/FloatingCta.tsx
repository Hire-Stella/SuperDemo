"use client";

import Link from "next/link";

import { primaryCtaHref, primaryCtaLabel } from "../defaults";
import { IconArrowUpRight } from "./icons";
import { useContent } from "../context";

export function FloatingCta() {
  const { primaryCtaHref, primaryCtaLabel } = useContent();
  return (
    <Link
      href={primaryCtaHref}
      className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.04] sm:right-6 sm:bottom-6"
    >
      {primaryCtaLabel}
      <IconArrowUpRight className="h-4 w-4" />
    </Link>
  );
}
