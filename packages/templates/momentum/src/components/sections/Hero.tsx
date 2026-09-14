"use client";

import Image from "next/image";
import Link from "next/link";
import { BOOKING_URL, HERO, STATS } from "../../defaults";
import CountUpStat from "../../components/CountUpStat";
import Reveal, { RevealGroup, RevealItem } from "../../components/Reveal";
import { useContent } from "../../context";

export default function Hero() {
  const { BOOKING_URL, HERO, STATS } = useContent();
  return (
    <section
      id="hero-section"
      className="relative isolate overflow-hidden bg-ink pt-40 pb-24 text-cream sm:pt-48"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src={HERO.videoPoster}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/70 to-ink" />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <Reveal>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">
              {HERO.eyebrow}
            </p>
            <h1 className="font-display mt-6 text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              {HERO.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-cream/80 sm:text-lg">
              {HERO.subhead}
            </p>
            <Link
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-white transition-transform hover:scale-105"
            >
              {HERO.cta}
            </Link>
          </Reveal>

          <RevealGroup className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <RevealItem key={stat.label} y={20}>
                <CountUpStat
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <Reveal
          delay={0.2}
          className="relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:justify-self-end"
        >
          <div className="flex gap-1 text-lime">
            {"★★★★★".split("").map((star, index) => (
              <span key={index}>{star}</span>
            ))}
          </div>
          <p className="mt-4 max-w-xs text-base leading-relaxed text-cream/90">
            &ldquo;{HERO.testimonial.quote}&rdquo;
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full">
              <Image
                src={HERO.testimonial.avatar}
                alt={HERO.testimonial.name}
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-cream">
                {HERO.testimonial.name}
              </p>
              <p className="text-xs text-cream/60">{HERO.testimonial.role}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
