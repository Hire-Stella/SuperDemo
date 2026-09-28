'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source home page's hero: one full-bleed cake photo, a two-line serif
 * headline, one sentence subhead, and two real pill buttons ("Explore
 * treats" / "Plan a party"). A flat, uniform dark scrim runs the full photo
 * rather than a gradient strongest behind the headline only, so the subhead
 * and both buttons — set lower, over a busier part of the photo — read
 * exactly as clearly as the line above them (see the contract's own note on
 * this being a real bug an earlier template shipped).
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative flex min-h-[85vh] items-end overflow-hidden">
      {HERO.image ? (
        <Image
          src={HERO.image}
          alt="A finished layered cake at Sucre"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-[rgba(112,71,52,0.55)]" />

      <div className="relative mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.28em] text-white/80 uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-sucre-display max-w-2xl text-4xl leading-[1.1] text-white sm:text-6xl lg:text-7xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mt-6 max-w-md text-base text-white/90 sm:text-lg">{HERO.subhead}</p>
          ) : null}

          {HERO.primaryCta || HERO.secondaryCta ? (
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {HERO.primaryCta ? (
                <Link
                  href={HERO.primaryCta.href}
                  className="sucre-pill inline-flex items-center justify-center bg-sucre-bg px-7 py-3 text-sm font-semibold text-sucre-pink shadow-[0_10px_30px_-8px_rgba(255,105,147,0.5)] transition-colors hover:text-sucre-pink-soft"
                >
                  {HERO.primaryCta.label}
                </Link>
              ) : null}
              {HERO.secondaryCta ? (
                <Link
                  href={HERO.secondaryCta.href}
                  className="sucre-pill inline-flex items-center justify-center border border-white/60 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
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
