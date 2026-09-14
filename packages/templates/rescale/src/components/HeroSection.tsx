"use client";

import Image from "next/image";
import Link from "next/link";

import { heroBadge, heroClientLogos, heroHeading, heroSubcopy, primaryCtaHref } from "../defaults";
import { useContent } from "../context";

const badgeCount = heroBadge.split(" ")[0];
const badgeRest = heroBadge.slice(badgeCount.length).trim();

export function HeroSection() {
  const { heroBadge, heroClientLogos, heroHeading, heroSubcopy, primaryCtaHref } = useContent();
  return (
    <section id="top" className="rs-gradient-soft relative overflow-hidden pt-20 pb-20 sm:pt-24 lg:pt-32">
      <div id="hero" className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <div className="rs-fade-up mx-auto inline-flex items-center gap-2.5 rounded-full border border-black/5 bg-white/80 py-1.5 pr-4 pl-1.5 shadow-sm backdrop-blur-sm">
          <span className="rs-gradient-brand inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white">
            <Image src="/t/rescale/images/hero-badge-icon.svg" alt="" width={13} height={13} />
            {badgeCount}
          </span>
          <span className="text-[11px] font-semibold tracking-[0.12em] text-rs-muted uppercase">
            {badgeRest}
          </span>
        </div>

        <h1 className="rs-heading rs-fade-up mt-7 text-5xl leading-[1.05] text-rs-ink sm:text-6xl lg:text-7xl">
          {heroHeading.line1}{" "}
          <span className="rs-gradient-text">{heroHeading.highlight1}</span>
          <br />
          {heroHeading.line2}{" "}
          <span className="inline-block rounded-[999px] border border-rs-brand/35 px-4 py-0.5 align-middle">
            <span className="rs-gradient-text">{heroHeading.highlight2}</span>
          </span>{" "}
          {heroHeading.line3}
        </h1>

        <p className="rs-fade-up mx-auto mt-7 max-w-xl text-base text-rs-muted sm:text-lg">
          {heroSubcopy}
        </p>

        <div className="rs-fade-up mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={primaryCtaHref}
            className="rs-gradient-brand inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.03]"
          >
            Start Free Trial
          </Link>
          <Link
            href="/#how-it-works"
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-rs-ink shadow-sm transition-transform hover:scale-[1.03]"
          >
            How it Works
          </Link>
        </div>

        <div className="mt-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-rs-muted/70 uppercase">
            Growing Partnership Around the World
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-8 overflow-hidden">
        <div className="rs-marquee-track flex w-max items-center gap-16">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 pr-16">
              {heroClientLogos.map((logo) => (
                <Image
                  key={logo}
                  src={logo}
                  alt="Partner logo"
                  width={110}
                  height={26}
                  className="h-6 w-auto opacity-70"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Decorative field: soft colour wash plus the glossy 3D shapes that drift
          over the top of the hero on the live site. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/t/rescale/images/bg-blur-shape-1.png"
          alt=""
          fill
          className="scale-110 object-cover"
          priority
        />
        <Image
          src="/t/rescale/images/bg-blur-shape-4.png"
          alt=""
          fill
          className="scale-125 object-cover opacity-45"
        />
        {/* keeps the centre light so the headline stays high-contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(closest-side_at_50%_38%,rgba(255,255,255,0.82),rgba(255,255,255,0)_75%)]" />
        <Image
          src="/t/rescale/images/hero-floating-card-1.png"
          alt=""
          width={150}
          height={150}
          className="rs-float absolute top-[18%] left-[4%] hidden w-24 lg:block xl:w-32"
        />
        <Image
          src="/t/rescale/images/hero-floating-card-2.png"
          alt=""
          width={150}
          height={150}
          className="rs-float-slow absolute top-[26%] right-[5%] hidden w-24 lg:block xl:w-32"
        />
      </div>
    </section>
  );
}
