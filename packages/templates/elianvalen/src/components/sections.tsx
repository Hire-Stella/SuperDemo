"use client";

import Image from "next/image";
import Link from "next/link";

import { campaignCards, contactTeaser, curatedBand, genderBanners, shippingRules } from "../defaults";
import { useContent } from "../context";

/** Two-line 40px section heading; second line renders muted-adjacent. */
export function SectionHeading({
  lines,
  className = "",
  tone = "dark",
}: {
  lines: string[];
  className?: string;
  tone?: "dark" | "light";
}) {
  const { campaignCards, contactTeaser, curatedBand, genderBanners, shippingRules } = useContent();
  return (
    <h2
      className={`ev-heading ${tone === "light" ? "text-white" : "text-ink"} ${className}`}
    >
      {lines.map((line, i) => (
        <span key={line + i} className="block">
          {line}
        </span>
      ))}
    </h2>
  );
}

export function TextLink({
  href,
  children,
  tone = "dark",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href={href}
      className={`ev-underline inline-block text-[16px] ${
        tone === "light" ? "text-white" : "text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

/** Split Men's / Women's campaign banner pair. */
export function GenderBanners({ variant = "collection" }: { variant?: "collection" | "products" }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2">
      {genderBanners.map((b) => (
        <div key={b.href} className="ev-zoom relative h-[326px] overflow-hidden">
          <Image
            src={b.image}
            alt={b.alt}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="ev-scrim-up absolute inset-x-0 bottom-0 h-2/3 opacity-70" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="text-[clamp(20px,2.2vw,26px)] text-white">
              {variant === "products" ? b.productsTitle : b.title}
            </p>
            <TextLink href={b.href} tone="light">
              {b.cta}
            </TextLink>
          </div>
        </div>
      ))}
    </section>
  );
}

/** Shipping rules + contact teaser — the paired info block. */
export function InfoSections() {
  return (
    <section className="mx-auto max-w-[1265px] px-5 py-20 lg:px-0">
      <div className="grid gap-10 border-b border-line pb-16 lg:grid-cols-[320px_minmax(0,1fr)_auto] lg:gap-16">
        <SectionHeading lines={shippingRules.heading} />
        <div className="space-y-6 lg:max-w-[520px]">
          {shippingRules.points.map((p) => (
            <p key={p} className="ev-body">
              {p}
            </p>
          ))}
        </div>
        <div className="lg:pt-1">
          <TextLink href={shippingRules.cta.href}>{shippingRules.cta.label}</TextLink>
        </div>
      </div>

      <div className="grid gap-10 pt-16 lg:grid-cols-[320px_minmax(0,1fr)_auto] lg:gap-16">
        <SectionHeading lines={contactTeaser.heading} />
        <p className="ev-body lg:max-w-[520px]">{contactTeaser.blurb}</p>
        <div className="lg:pt-1">
          <TextLink href={contactTeaser.cta.href}>{contactTeaser.cta.label}</TextLink>
        </div>
      </div>
    </section>
  );
}

/** Full-bleed dark band with the repeating chevron field. */
export function CuratedBand() {
  return (
    <section className="relative flex min-h-[440px] items-center justify-center overflow-hidden bg-ev-dark px-6 py-24 lg:min-h-[560px]">
      <div className="ev-stripes absolute inset-0 opacity-90" aria-hidden="true" />
      <div className="ev-scrim absolute inset-0 opacity-40" aria-hidden="true" />
      <h2 className="relative text-center">
        {curatedBand.lines.map((line) => (
          <span
            key={line}
            className="ev-heading block text-white"
          >
            {line}
          </span>
        ))}
      </h2>
    </section>
  );
}

/** The three closing campaign cards (ELI / Kiot / Chito 2026). */
export function CampaignCards() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3">
      {campaignCards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="ev-zoom group relative h-[420px] overflow-hidden lg:h-[900px]"
        >
          <Image
            src={card.image}
            alt={card.alt}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            className="object-cover"
          />
          <div className="ev-scrim-up absolute inset-x-0 bottom-0 h-1/2 opacity-80" />
          <h3 className="absolute inset-x-0 bottom-10 text-center text-[clamp(20px,2.2vw,26px)] text-white">
            {card.title}
          </h3>
        </Link>
      ))}
    </section>
  );
}
