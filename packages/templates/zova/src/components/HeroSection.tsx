"use client";

import Image from "next/image";
import Link from "next/link";

import { ctaHref, ctaLabel, heroEyebrow, heroHeadingLines, heroImage, heroRating, heroSubhead, heroVideo, heroVideoPoster } from "../defaults";
import { IconArrowRight, IconStar } from "./icons";
import { useContent } from "../context";

export function HeroSection() {
  const { ctaHref, ctaLabel, heroEyebrow, heroHeadingLines, heroImage, heroRating, heroSubhead, heroVideo, heroVideoPoster } = useContent();
  return (
    <section className="zv-hero-wash relative overflow-hidden pt-16 pb-8 sm:pt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="text-center lg:text-left">
          <span className="zv-fade-up inline-flex items-center gap-2 rounded-full border border-zv-line bg-white px-4 py-1.5 text-xs font-medium text-zv-ink/80 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
            {heroEyebrow}
          </span>

          <h1 className="zv-heading zv-fade-up mt-6 text-4xl leading-[1.08] text-zv-ink sm:text-5xl lg:text-6xl">
            <span className="block">{heroHeadingLines[0]}</span>
            <span className="block">
              {heroHeadingLines[1]} <span className="zv-highlight">{heroHeadingLines[2]}</span>
            </span>
          </h1>

          <div className="zv-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href={ctaHref}
              className="zv-btn-primary inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.03]"
            >
              {ctaLabel}
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#contact"
              className="zv-btn-outline inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
            >
              Contact sales
            </Link>
          </div>
        </div>

        <div className="zv-fade-up flex flex-col items-center gap-6 lg:items-start">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl">
            <video
              src={heroVideo}
              poster={heroVideoPoster}
              autoPlay
              loop
              muted
              playsInline
              className="h-auto w-full"
            />
          </div>
          <p className="max-w-sm text-center text-base text-zv-muted sm:text-lg lg:text-left">{heroSubhead}</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: heroRating.stars }).map((_, i) => (
                <IconStar key={i} className="h-4 w-4" />
              ))}
            </div>
            <p className="text-sm text-zv-muted">
              <span className="font-semibold text-zv-ink">{heroRating.value}</span> {heroRating.label}
            </p>
          </div>
        </div>
      </div>

      <div className="zv-fade-up mx-auto mt-16 max-w-5xl px-6">
        <div className="overflow-hidden rounded-3xl border border-zv-line bg-zv-card shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <Image
            src={heroImage}
            alt="Zova dashboard showing total invested amount and revenue chart"
            width={2880}
            height={2048}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
