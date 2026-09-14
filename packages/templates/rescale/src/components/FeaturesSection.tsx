"use client";

import Image from "next/image";

import { featuresMarqueeTags, heroFloatingTags, heroMiniStats } from "../defaults";
import { CountUp } from "./CountUp";
import { Reveal } from "./Reveal";
import { useContent } from "../context";

export function FeaturesSection() {
  const { featuresMarqueeTags, heroFloatingTags, heroMiniStats } = useContent();
  return (
    <section id="features" className="relative overflow-hidden bg-rs-bg py-20 sm:py-24">
      <Image
        src="/t/rescale/images/features-image-1.jpg"
        alt=""
        width={1200}
        height={600}
        className="pointer-events-none absolute -top-24 left-1/2 w-[140%] max-w-none -translate-x-1/2 opacity-60"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Product screenshot / spotlight mockup */}
          <Reveal className="relative order-2 lg:order-1">
            <div className="rs-gradient-diagonal-light relative overflow-hidden rounded-3xl border border-black/5 p-3 shadow-xl">
              <Image
                src="/t/rescale/images/hero-dashboard-spotlight.jpg"
                alt="Vectora analytics dashboard"
                width={1183}
                height={812}
                className="w-full rounded-2xl object-cover"
              />

              {/* floating live-metric card */}
              <div className="rs-gradient-glass absolute -bottom-6 -left-6 hidden w-56 rounded-2xl border border-white/60 p-4 shadow-lg sm:block">
                <p className="text-xs font-semibold text-rs-muted">Live performance</p>
                <div className="mt-3 flex items-center justify-between">
                  {heroMiniStats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <CountUp
                        target={stat.target}
                        suffix={stat.suffix}
                        className="rs-heading block text-lg text-rs-ink"
                      />
                      <p className="text-[10px] uppercase tracking-wide text-rs-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* floating feature tags */}
              <div className="absolute -right-4 -top-4 hidden flex-col gap-2 sm:flex">
                {heroFloatingTags.map((tag) => (
                  <span
                    key={tag.label}
                    className="rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-medium text-rs-ink shadow-sm"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} className="order-1 lg:order-2">
            <span className="rs-eyebrow">Features</span>
            <h2 className="rs-heading mt-3 text-4xl text-rs-ink sm:text-5xl">
              <span className="rs-gradient-text">A single dashboard</span> for every growth signal
            </h2>
            <p className="mt-4 max-w-md text-base text-rs-muted">
              Revenue analysis, sales performance, market insights and custom reports — all
              instantly connected so your team always acts on the freshest data.
            </p>

            <ul className="mt-8 flex flex-col gap-3">
              {["Revenue Analysis", "Sales Performance", "Market Insights", "Custom Reports"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-rs-ink">
                    <span className="rs-gradient-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white">
                      ✓
                    </span>
                    {item}
                  </li>
                ),
              )}
            </ul>
          </Reveal>
        </div>
      </div>

      {/* marquee strip */}
      <div className="relative z-10 mt-16 overflow-hidden border-y border-black/5 bg-white py-4">
        <div className="rs-marquee-track flex w-max items-center gap-16 whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-16">
              <span className="text-sm font-semibold uppercase tracking-widest text-rs-brand-dark">
                ✦ Instantly ✦ Connected Growth Partners
              </span>
              {featuresMarqueeTags.map((tag) => (
                <span key={tag} className="text-sm font-semibold uppercase tracking-widest text-rs-ink/60">
                  {tag}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
