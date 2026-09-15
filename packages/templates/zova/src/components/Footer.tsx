"use client";

import Image from "next/image";
import Link from "next/link";

import { ctaHref, ctaLabel, footerColumns, footerCopyright, footerCredit } from "../defaults";
import { useContent } from "../context";

export function Footer() {
  const { ctaHref, ctaLabel, footerColumns, footerCopyright, footerCredit } = useContent();
  return (
    <footer className="border-t border-zv-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="rounded-3xl bg-zv-card px-8 py-10 sm:px-12 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <Image src="/t/zova/logo.png" alt="Zova" width={32} height={32} className="h-8 w-8 rounded-lg" />
                <span className="zv-heading text-base text-zv-ink">Zova</span>
              </div>
              <p className="zv-eyebrow mt-5">Stay connected</p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zv-muted">
                Real-time insight for modern finance. Get the latest product updates and financial
                clarity tips in your inbox.
              </p>
              <Link
                href={ctaHref}
                className="zv-btn-primary mt-5 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold"
              >
                {ctaLabel}
              </Link>
            </div>

            {footerColumns.map((column) => (
              <div key={column.heading}>
                <p className="text-sm font-semibold text-zv-ink">{column.heading}</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-zv-muted transition-colors hover:text-zv-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-zv-line pt-8 text-xs text-zv-muted sm:flex-row">
            <p>{footerCredit}</p>
            <p>{footerCopyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
