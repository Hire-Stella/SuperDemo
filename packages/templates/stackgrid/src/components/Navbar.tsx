"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinksLeft, navLinksRight, site } from "../defaults";
import { useContent } from "../context";

/**
 * The sticky 70px header. Layout on the live site is a three-column
 * grid — links left, wordmark dead centre, links right — collapsing to
 * a wordmark plus disclosure button under 900px.
 */
export default function Navbar() {
  const { navLinksLeft, navLinksRight, site } = useContent();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Lock the page while the sheet is up, and let Escape dismiss it.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href.startsWith("/#") ? false : pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (href: string) =>
    `text-[13px] transition-colors duration-200 hover:text-[var(--sg-text)] ${
      isActive(href) ? "text-[var(--sg-text)]" : "text-[var(--sg-text-subtle)]"
    }`;

  return (
    <header
      className="sticky top-0 z-50 h-[70px] w-full backdrop-blur-[6px]"
      style={{ background: "rgba(253, 253, 253, 0.86)" }}
    >
      <div
        className="sg-hair sg-hair-x mx-auto flex h-[70px] w-full items-center justify-between"
        style={{
          maxWidth: "var(--sg-max)",
          paddingLeft: "var(--sg-gutter)",
          paddingRight: "var(--sg-gutter)",
        }}
      >
        {/* Left rail — hidden on mobile, where the wordmark takes over. */}
        <nav aria-label="Primary" className="hidden flex-1 items-center gap-6 md:flex">
          {navLinksLeft.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] tracking-[-0.01em] text-[var(--sg-text)] md:flex-none"
          aria-label={`${site.name} — home`}
        >
          <span
            aria-hidden
            className="inline-block size-[9px]"
            style={{ background: "var(--sg-black)" }}
          />
          {site.name}
        </Link>

        <nav
          aria-label="Secondary"
          className="hidden flex-1 items-center justify-end gap-6 md:flex"
        >
          {navLinksRight.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="sg-mobile-nav"
          className="sg-hair flex size-[34px] items-center justify-center md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="flex flex-col gap-[4px]">
            <span
              className="block h-[1px] w-[15px] transition-transform duration-200"
              style={{
                background: "var(--sg-text)",
                transform: open ? "translateY(2.5px) rotate(45deg)" : undefined,
              }}
            />
            <span
              className="block h-[1px] w-[15px] transition-transform duration-200"
              style={{
                background: "var(--sg-text)",
                transform: open ? "translateY(-2.5px) rotate(-45deg)" : undefined,
              }}
            />
          </span>
        </button>
      </div>

      {open && (
        <div
          id="sg-mobile-nav"
          className="md:hidden"
          style={{ background: "var(--sg-bg)" }}
        >
          <nav
            aria-label="Mobile"
            className="sg-hair sg-hair-x flex flex-col"
            style={{
              paddingLeft: "var(--sg-gutter)",
              paddingRight: "var(--sg-gutter)",
            }}
          >
            {[...navLinksLeft, ...navLinksRight].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                // Dismiss on tap: navigating to the current route would
                // not re-render this away on its own.
                onClick={() => setOpen(false)}
                className="border-b border-[var(--sg-border)] py-4 text-[15px] text-[var(--sg-text)] last:border-b-0"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
