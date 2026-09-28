'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source home page's hero: one full-bleed photo, one headline, one
 * all-caps prose subhead — and, verbatim from the source's own markup, no
 * button of any kind (see defaults.ts's `HERO.primaryCta` note). A flat,
 * uniform dark scrim runs the full photo rather than a gradient strongest
 * behind the headline only, so the subhead — set lower, over a busier part
 * of the espresso-bar photo — reads exactly as clearly as the line above it.
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative flex min-h-[85vh] items-end overflow-hidden">
      {HERO.image ? (
        <Image
          src={HERO.image}
          alt="Espresso bar at Kiln"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-kiln-ink/55" />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.28em] text-white/80 uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-kiln-display max-w-3xl text-4xl leading-[1.1] text-white uppercase sm:text-6xl lg:text-7xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mt-6 max-w-xl text-sm tracking-[0.02em] text-white/90 uppercase sm:text-base">
              {HERO.subhead}
            </p>
          ) : null}

          {HERO.primaryCta || HERO.secondaryCta ? (
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {HERO.primaryCta ? (
                <Link
                  href={HERO.primaryCta.href}
                  className="kiln-card inline-flex items-center justify-center bg-white px-7 py-3 text-xs font-semibold tracking-[0.1em] text-kiln-ink uppercase transition-colors hover:bg-white/85"
                >
                  {HERO.primaryCta.label}
                </Link>
              ) : null}
              {HERO.secondaryCta ? (
                <Link
                  href={HERO.secondaryCta.href}
                  className="kiln-card inline-flex items-center justify-center border border-white/50 px-7 py-3 text-xs font-semibold tracking-[0.1em] text-white uppercase transition-colors hover:border-white"
                >
                  {HERO.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
