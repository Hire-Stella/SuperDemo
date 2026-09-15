"use client";

import Link from "next/link";
import Ascii from "../components/Ascii";
import Container from "../components/Container";
import { OWNER_DETAILS_TO_REPLACE, asciiArt, footerColumns, site } from "../defaults";
import { useContent } from "../context";

/**
 * The footer: wordmark + tagline and the two link columns on a hairline
 * top edge, the ASCII tower centred beneath them, then the copyright and
 * social row on a second hairline.
 */
export default function Footer() {
  const { OWNER_DETAILS_TO_REPLACE, asciiArt, footerColumns, site } = useContent();
  return (
    <footer className="mt-auto" style={{ background: "var(--sg-bg)" }}>
      <div className="sg-hair sg-hair-x">
        <Container>
          <div className="flex flex-col gap-12 py-14 md:flex-row md:justify-between">
            <div className="flex max-w-[300px] flex-col gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-[15px] text-[var(--sg-text)]"
              >
                <span
                  aria-hidden
                  className="inline-block size-[9px]"
                  style={{ background: "var(--sg-black)" }}
                />
                {site.name}
              </Link>
              <p className="sg-small">{site.tagline}</p>
            </div>

            <div className="flex gap-16">
              {footerColumns.map((column) => (
                <div key={column.title} className="flex flex-col gap-3">
                  <h3 className="text-[13px] text-[var(--sg-text-label)]">
                    {column.title}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {column.links.map((link) => (
                      <li key={`${column.title}-${link.href}`}>
                        <Link
                          href={link.href}
                          className="text-[13px] text-[var(--sg-text-subtle)] transition-colors duration-200 hover:text-[var(--sg-text)]"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* The tower is decorative and clips rather than wraps on narrow
          viewports, exactly as it does on the live site. */}
      <div className="flex justify-center overflow-hidden py-10">
        <Ascii art={asciiArt.footerTower} color="var(--sg-ascii-grey)" />
      </div>

      <div className="sg-hair sg-hair-x">
        <Container>
          <div className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
            <p className="sg-small">{site.copyright}</p>
            <ul className="flex items-center gap-5">
              {OWNER_DETAILS_TO_REPLACE.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-[var(--sg-text-subtle)] transition-colors duration-200 hover:text-[var(--sg-text)]"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>
    </footer>
  );
}
