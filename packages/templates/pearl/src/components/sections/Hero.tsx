'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * This template's own hero grammar: a full-bleed photo behind a flat,
 * uniform dark-plum scrim running the *entire* photo — never a gradient
 * weakest exactly behind the headline, the contrast bug an earlier sibling
 * template shipped and every template since checks against — with a small
 * round "bubble" inset photo bottom-left (a true `.pearl-pill` circle, not
 * yokai's diagonal-tag inset frame) and a few small dots rising past it,
 * this template's own continuous motion standing in for tapioca pearls
 * floating up through milk tea.
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative flex min-h-[85vh] items-end overflow-hidden">
      {HERO.image ? (
        <Image
          src={HERO.image}
          alt="Fresh iced milk teas at Pearl"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-pearl-ink/60" />

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <div className="flex flex-col items-end gap-10 sm:flex-row sm:items-end sm:justify-between">
          <Reveal className="max-w-xl">
            {HERO.eyebrow ? (
              <p className="pearl-pill inline-block border border-white/40 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.08em] text-white uppercase">
                {HERO.eyebrow}
              </p>
            ) : null}
            <h1 className="font-pearl-display mt-5 text-5xl leading-[1.05] text-white sm:text-6xl lg:text-[4rem]">
              {HERO.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            {HERO.subhead ? (
              <p className="mt-6 max-w-md text-base leading-relaxed text-white/90">
                {HERO.subhead}
              </p>
            ) : null}

            {HERO.primaryCta || HERO.secondaryCta ? (
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {HERO.primaryCta ? (
                  <Link
                    href={HERO.primaryCta.href}
                    className="pearl-pill inline-flex items-center justify-center bg-pearl-berry-soft px-8 py-3.5 text-xs font-bold tracking-[0.08em] text-pearl-ink uppercase transition-transform hover:scale-[1.03]"
                  >
                    {HERO.primaryCta.label}
                  </Link>
                ) : null}
                {HERO.secondaryCta ? (
                  <Link
                    href={HERO.secondaryCta.href}
                    className="pearl-pill inline-flex items-center justify-center border border-white/50 px-8 py-3.5 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:border-white"
                  >
                    {HERO.secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </Reveal>

          {HERO.inset ? (
            <Reveal delay={140} className="relative hidden shrink-0 sm:block">
              <div className="pearl-pill relative h-40 w-40 overflow-hidden border-4 border-white shadow-xl sm:h-48 sm:w-48">
                <Image
                  src={HERO.inset.src}
                  alt={HERO.inset.alt}
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
              <span
                className="pearl-rise absolute top-0 left-4 h-3 w-3 rounded-full bg-pearl-sugar"
                style={
                  { '--pearl-rise-duration': '3.4s', '--pearl-rise-delay': '0s' } as CSSProperties
                }
                aria-hidden="true"
              />
              <span
                className="pearl-rise absolute top-4 left-14 h-2.5 w-2.5 rounded-full bg-pearl-sugar"
                style={
                  { '--pearl-rise-duration': '4.1s', '--pearl-rise-delay': '1s' } as CSSProperties
                }
                aria-hidden="true"
              />
              <span
                className="pearl-rise absolute top-2 left-28 h-2 w-2 rounded-full bg-pearl-sugar"
                style={
                  { '--pearl-rise-duration': '3.8s', '--pearl-rise-delay': '2s' } as CSSProperties
                }
                aria-hidden="true"
              />
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
