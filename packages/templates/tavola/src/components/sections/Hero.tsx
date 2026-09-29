'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source home page's hero: a full-bleed looping video, a two-line
 * headline ("Sushi" / "Sensation" — recovered from a per-letter blur-reveal
 * animation, not a plain text scrape), and three photo cards linking to
 * Menu / Reservation / Our Restaurant, each with the source's literal
 * circular dark "arrow" badge in its corner.
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative overflow-hidden bg-tavola-ink text-tavola-cream">
      <div className="absolute inset-0">
        <video
          className="h-full w-full object-cover"
          src={HERO.video}
          autoPlay
          loop
          muted
          playsInline
        />
        {/*
          Not a smooth top-to-bottom fade: a fade that dips toward the middle
          (e.g. 70% → 55% → 100%) is *lightest* exactly where the centred
          headline sits, which is backwards. This stays dark through the
          whole text band and only eases at the very top edge.
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-tavola-ink/55 via-tavola-ink/75 to-tavola-ink" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pt-40 pb-20 text-center sm:pt-48">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.3em] text-tavola-gold uppercase">
            {HERO.eyebrow}
          </p>
          <h1 className="font-display mt-6 text-6xl leading-[1.02] sm:text-7xl lg:text-8xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mx-auto mt-6 max-w-lg text-base text-tavola-cream/80">{HERO.subhead}</p>
          ) : null}

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {HERO.primaryCta ? (
              <Link
                href={HERO.primaryCta.href}
                className="tavola-btn inline-flex items-center justify-center border border-tavola-cream/15 bg-[#f2f2f2] px-8 py-3.5 text-xs font-semibold tracking-[0.1em] text-tavola-gold uppercase transition-transform hover:scale-[1.03]"
              >
                {HERO.primaryCta.label}
              </Link>
            ) : null}
            {HERO.secondaryCta ? (
              <Link
                href={HERO.secondaryCta.href}
                className="tavola-btn inline-flex items-center justify-center border border-tavola-cream/25 px-8 py-3.5 text-xs font-semibold tracking-[0.1em] text-tavola-cream uppercase transition-colors hover:border-tavola-cream/60"
              >
                {HERO.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </Reveal>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {HERO.badges.map((badge, i) => (
            <Reveal key={badge.label} delay={i * 100}>
              <Link
                href={badge.href}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[3/4]"
              >
                <Image
                  src={badge.image}
                  alt={badge.label}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tavola-ink/70 via-transparent to-transparent" />
                <div className="tavola-badge absolute right-3 bottom-3 flex items-center gap-2 border border-tavola-muted/60 bg-tavola-ink/50 py-1.5 pr-4 pl-1.5 backdrop-blur-sm">
                  <span className="tavola-badge flex h-8 w-8 shrink-0 items-center justify-center bg-tavola-ink text-tavola-cream">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
                      <path
                        d="M7 17 17 7M8 7h9v9"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-xs font-medium tracking-[0.08em] text-tavola-cream uppercase">
                    {badge.label}
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
