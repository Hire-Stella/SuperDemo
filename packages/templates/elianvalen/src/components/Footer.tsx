"use client";

import Link from "next/link";

import { footerColumns, site } from "../defaults";
import { NewsletterForm } from "./NewsletterForm";
import { Wordmark } from "./Wordmark";
import { useContent } from "../context";

export function Footer() {
  const { footerColumns, site } = useContent();
  return (
    <footer className="mt-auto bg-ev-dark text-white">
      <div className="mx-auto max-w-[1425px] px-6 py-14 lg:px-6">
        <Wordmark className="ev-wordmark-fit block w-full leading-[0.9] text-white" script />

        <div className="mt-10 max-w-md">
          <p className="mb-3 text-[13px] text-white/60">
            Join the LIGNE PURE list for collection releases and studio notes.
          </p>
          <NewsletterForm />
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-[repeat(4,172px)_1fr]">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p className="text-[16px] text-white">{col.title}</p>
              <ul className="mt-2 space-y-1">
                {col.items.map((item) => (
                  <li key={item.label} className="text-[14px] text-white/80">
                    {item.href ? (
                      item.href.startsWith("/") ? (
                        <Link href={item.href} className="ev-underline hover:text-white">
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className="ev-underline hover:text-white"
                          {...(item.href.startsWith("http")
                            ? { target: "_blank", rel: "noreferrer noopener" }
                            : {})}
                        >
                          {item.label}
                        </a>
                      )
                    ) : (
                      item.label
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 lg:pl-10">
            {site.copyright.map((line) => (
              <p key={line} className="text-[14px] leading-relaxed text-white/70">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
