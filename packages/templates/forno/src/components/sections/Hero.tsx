'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source home page's hero: no background photo at all — a plain page
 * background, a two-line headline, a subhead, one CTA pill, and a single
 * big pizza product photo floating beside the text with six small
 * ingredient graphics scattered around it, each bobbing on its own timer
 * (recovered from the source's own "Ingredients Stack" layer). Because the
 * headline never sits over a photo, this hero carries none of tavola's
 * scrim-over-video legibility risk.
 */
const FLOAT_POSITIONS = [
  { top: '2%', left: '4%', rotate: '-10deg', duration: '7s', delay: '0s', size: 64 },
  { top: '8%', left: '78%', rotate: '8deg', duration: '6s', delay: '0.6s', size: 56 },
  { top: '38%', left: '0%', rotate: '6deg', duration: '8s', delay: '1.1s', size: 60 },
  { top: '42%', left: '86%', rotate: '-6deg', duration: '6.5s', delay: '0.3s', size: 60 },
  { top: '78%', left: '6%', rotate: '-4deg', duration: '7.5s', delay: '0.9s', size: 56 },
  { top: '80%', left: '80%', rotate: '10deg', duration: '6.8s', delay: '1.4s', size: 64 },
];

export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative overflow-hidden bg-forno-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:grid-cols-2">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-bold tracking-[0.22em] text-forno-red uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-forno-display mt-3 text-5xl leading-[1.05] text-forno-ink sm:text-6xl lg:text-7xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mt-6 max-w-md text-base text-forno-muted">{HERO.subhead}</p>
          ) : null}

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {HERO.primaryCta ? (
              <Link
                href={HERO.primaryCta.href}
                className="forno-pill inline-flex items-center justify-center bg-forno-red px-8 py-3.5 text-sm font-bold tracking-[0.04em] text-white uppercase shadow-[0_10px_24px_-8px_rgba(255,0,60,0.55)] transition-transform hover:scale-[1.03]"
              >
                {HERO.primaryCta.label}
              </Link>
            ) : null}
            {HERO.secondaryCta ? (
              <Link
                href={HERO.secondaryCta.href}
                className="forno-pill inline-flex items-center justify-center border border-forno-border px-8 py-3.5 text-sm font-bold tracking-[0.04em] text-forno-ink uppercase transition-colors hover:border-forno-red hover:text-forno-red"
              >
                {HERO.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </Reveal>

        <Reveal delay={120} className="relative mx-auto aspect-square w-full max-w-md">
          {HERO.ingredients.map((src, i) => {
            const p = FLOAT_POSITIONS[i % FLOAT_POSITIONS.length]!;
            return (
              <div
                key={src}
                className="forno-float absolute z-0 opacity-90"
                style={
                  {
                    top: p.top,
                    left: p.left,
                    width: p.size,
                    height: p.size,
                    '--forno-float-rot': p.rotate,
                    '--forno-float-duration': p.duration,
                    '--forno-float-delay': p.delay,
                  } as CSSProperties
                }
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain" />
              </div>
            );
          })}
          {HERO.image ? (
            <div className="relative z-10 aspect-square w-full drop-shadow-[0_30px_40px_rgba(26,26,26,0.18)]">
              <Image
                src={HERO.image}
                alt="A wood-fired pizza, sliced"
                fill
                sizes="(min-width: 1024px) 480px, 80vw"
                className="object-contain"
                priority
              />
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
