'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * This template's own hero grammar — the fifth and last one in the library.
 * Not tavola's centred text over a full-bleed video, not forno's or
 * aurelia's clean two-column split both contained inside one `max-w-6xl`,
 * and not brasa's rotated photo stack: Yokai's text column stays inside the
 * page gutter while the photo column is a plain, unpadded grid cell in a
 * section that itself has no max-width wrapper — which is all it takes for
 * that cell's right edge to land on the true viewport edge, no negative-
 * margin trick required. A small second photo overlaps it in this
 * template's own "tag" frame (see theme.css's `.yokai-frame`), with a
 * couple of rising steam wisps above it — the continuous motion this
 * template owns instead of brasa's spin, forno's float or aurelia's
 * marquee — and a static stamped seal sits opposite it, deliberately not
 * spinning the way brasa's own badge does.
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative bg-yokai-ink">
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
        <div className="relative z-10 flex items-center px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-28 xl:pl-24">
          <Reveal className="max-w-lg">
            {HERO.eyebrow ? (
              <p className="yokai-frame inline-block border border-yokai-lantern/60 bg-yokai-lantern/10 px-4 py-1.5 text-xs font-bold tracking-[0.08em] text-yokai-lantern uppercase">
                {HERO.eyebrow}
              </p>
            ) : null}
            <h1 className="font-yokai-display mt-5 text-5xl leading-[1.05] text-yokai-paper sm:text-6xl lg:text-[4rem]">
              {HERO.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            {HERO.subhead ? (
              <p className="mt-6 max-w-md text-base leading-relaxed text-yokai-muted">
                {HERO.subhead}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {HERO.primaryCta ? (
                <Link
                  href={HERO.primaryCta.href}
                  className="yokai-btn inline-flex items-center justify-center bg-yokai-lantern px-8 py-3.5 text-sm font-bold tracking-[0.04em] text-yokai-ink uppercase transition-transform hover:scale-[1.03]"
                >
                  {HERO.primaryCta.label}
                </Link>
              ) : null}
              {HERO.secondaryCta ? (
                <Link
                  href={HERO.secondaryCta.href}
                  className="yokai-btn inline-flex items-center justify-center border border-yokai-border px-8 py-3.5 text-sm font-bold tracking-[0.04em] text-yokai-text uppercase transition-colors hover:border-yokai-paper"
                >
                  {HERO.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </Reveal>
        </div>

        <div className="relative h-[380px] sm:h-[480px] lg:h-auto lg:min-h-[640px]">
          {HERO.image ? (
            <Reveal delay={120} className="absolute inset-0 block h-full w-full">
              <Image
                src={HERO.image}
                alt="The counter at Yokai"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-yokai-ink/30 lg:to-yokai-ink/50" />
            </Reveal>
          ) : null}

          {HERO.inset ? (
            <div
              className="yokai-frame absolute bottom-6 left-6 h-32 w-32 overflow-hidden border-4 border-yokai-paper shadow-xl sm:bottom-8 sm:left-8 sm:h-44 sm:w-44"
              aria-hidden="true"
            >
              <Image
                src={HERO.inset.src}
                alt={HERO.inset.alt}
                fill
                sizes="176px"
                className="object-cover"
              />
              <span
                className="yokai-steam absolute top-[-10px] left-3 h-6 w-3 rounded-full bg-yokai-paper/70 blur-[3px]"
                style={
                  { '--yokai-steam-duration': '4.2s', '--yokai-steam-delay': '0s' } as CSSProperties
                }
              />
              <span
                className="yokai-steam absolute top-[-6px] left-9 h-5 w-2.5 rounded-full bg-yokai-paper/60 blur-[3px]"
                style={
                  { '--yokai-steam-duration': '5s', '--yokai-steam-delay': '1.2s' } as CSSProperties
                }
              />
              <span
                className="yokai-steam absolute top-[-8px] left-16 h-5 w-2.5 rounded-full bg-yokai-paper/50 blur-[3px]"
                style={
                  {
                    '--yokai-steam-duration': '4.6s',
                    '--yokai-steam-delay': '2.1s',
                  } as CSSProperties
                }
              />
            </div>
          ) : null}

          {HERO.seal?.label ? (
            <div
              className="yokai-seal absolute top-6 right-6 flex h-20 w-20 -rotate-6 items-center justify-center border-2 border-yokai-ink bg-yokai-lantern text-center shadow-lg sm:top-10 sm:right-10 sm:h-24 sm:w-24"
              aria-hidden="true"
            >
              <span className="font-yokai-display text-[0.7rem] leading-tight text-yokai-ink uppercase">
                {HERO.seal.label}
                <br />
                Daily
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
