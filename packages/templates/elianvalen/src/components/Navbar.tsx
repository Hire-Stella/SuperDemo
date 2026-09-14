"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { navLinks, site } from "../defaults";
import { useCart } from "./CartProvider";
import { ChevronDown, Close } from "./icons";
import { Wordmark } from "./Wordmark";
import { useContent } from "../context";

/**
 * Cosmetic market switcher — mirrors the live site's header control. It only
 * changes the label; there is no pricing or currency conversion behind it.
 */
const MARKETS: { code: string; currency: string; flag: string | null }[] = [
  { code: site.locale.code, currency: site.locale.currency, flag: site.locale.flag },
  { code: "GB", currency: "GBP (£)", flag: null },
  { code: "FR", currency: "EUR (€)", flag: null },
];

export function Navbar() {
  const { navLinks, site } = useContent();
  const pathname = usePathname();
  const { count, open, ready } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [market, setMarket] = useState(MARKETS[0]);

  const closeMenus = () => {
    setMobileOpen(false);
    setMarketOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-15 max-w-[1265px] items-center gap-6 px-5 py-4 lg:px-0">
        <Link
          href="/"
          aria-label="LIGNE PURE — home"
          onClick={closeMenus}
          className="shrink-0"
        >
          <Wordmark className="text-[15px] tracking-[0.14em] sm:text-[17px]" />
        </Link>

        <nav aria-label="Main" className="ml-6 hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={pathname === link.href}
              onClick={closeMenus}
              className="ev-underline text-[14px] text-ink transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 sm:gap-6">
          {/* Locale / currency selector — display only, no pricing logic */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setMarketOpen((v) => !v)}
              aria-expanded={marketOpen}
              aria-label="Select market and currency"
              className="flex items-center gap-2 text-[14px] text-ink-soft transition-opacity hover:opacity-70"
            >
              {market.flag && (
                <Image
                  src={market.flag}
                  alt=""
                  width={21}
                  height={16}
                  className="h-4 w-[21px] object-cover"
                />
              )}
              <span>
                {market.code} - {market.currency}
              </span>
              <ChevronDown
                className={`transition-transform ${marketOpen ? "rotate-180" : ""}`}
              />
            </button>
            {marketOpen && (
              <ul className="ev-fade absolute right-0 top-full z-50 mt-3 w-44 border border-line bg-white py-1 shadow-lg">
                {MARKETS.map((m) => (
                  <li key={m.code}>
                    <button
                      type="button"
                      onClick={() => {
                        setMarket(m);
                        setMarketOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-cream"
                    >
                      {m.flag ? (
                        <Image
                          src={m.flag}
                          alt=""
                          width={21}
                          height={16}
                          className="h-4 w-[21px] object-cover"
                        />
                      ) : (
                        <span aria-hidden="true" className="h-4 w-[21px] bg-line" />
                      )}
                      {m.code} - {m.currency}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={open}
            className="flex items-center gap-1 text-[14px] text-ink transition-opacity hover:opacity-70"
            aria-label={`Open cart, ${ready ? count : 0} items`}
          >
            <span aria-hidden="true">[</span>
            <span>Cart</span>
            <span className="tabular-nums">{ready ? count : 0}</span>
            <span aria-hidden="true">]</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <Close className="h-5 w-5" />
            ) : (
              <span className="flex h-5 w-5 flex-col justify-center gap-[5px]">
                <span className="block h-px w-full bg-ink" />
                <span className="block h-px w-full bg-ink" />
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile"
          className="ev-fade border-t border-line bg-white px-5 py-4 lg:hidden"
        >
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenus}
                  className="text-[15px] text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-2 pt-2 text-[13px] text-muted">
              <Image
                src={site.locale.flag}
                alt=""
                width={21}
                height={16}
                className="h-4 w-[21px] object-cover"
              />
              {site.locale.label}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
