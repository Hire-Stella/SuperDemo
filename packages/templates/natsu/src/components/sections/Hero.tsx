'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The home page's real hero: a full-bleed photo behind a centered
 * headline built from the source's own two literal accent lines
 * ("Freshly" / "Brewed"), plus a small spinning arc-text badge
 * ("DISCOVER MORE • DISCOVER MORE • ...") over the photo's corner — the
 * source's own real `<textPath>` badge, recovered from its compiled
 * markup rather than hand-guessed (see theme.css's `.natsu-spin`).
 *
 * A flat, uniform scrim runs across the entire photo rather than a
 * top-to-bottom gradient — a gradient that is weakest exactly behind the
 * headline is the contrast bug an earlier template in this library shipped
 * with, found only by checking a real screenshot.
 */
export default function Hero() {
  const { HERO } = useContent();

  return (
    <section id="top" className="relative overflow-hidden bg-natsu-ink">
      {HERO.image ? (
        <div className="absolute inset-0">
          <Image src={HERO.image} alt="" fill sizes="100vw" priority className="object-cover" />
          <div className="absolute inset-0 bg-natsu-ink/70" />
        </div>
      ) : null}

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-28 text-center sm:py-36">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.32em] text-natsu-gold uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-natsu-display mt-5 text-6xl leading-[0.95] text-natsu-bg sm:text-8xl">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-natsu-bg/80">
              {HERO.subhead}
            </p>
          ) : null}

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            {HERO.primaryCta ? (
              <Link
                href={HERO.primaryCta.href}
                className="natsu-pill inline-flex items-center justify-center bg-natsu-caramel px-8 py-3.5 text-sm font-semibold tracking-[0.03em] text-natsu-bg uppercase transition-transform hover:scale-[1.03]"
              >
                {HERO.primaryCta.label}
              </Link>
            ) : null}
            {HERO.secondaryCta ? (
              <Link
                href={HERO.secondaryCta.href}
                className="natsu-pill inline-flex items-center justify-center border border-natsu-bg/40 px-8 py-3.5 text-sm font-semibold tracking-[0.03em] text-natsu-bg uppercase transition-colors hover:border-natsu-bg"
              >
                {HERO.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </Reveal>

        <div
          className="absolute right-4 bottom-4 flex h-24 w-24 items-center justify-center sm:right-10 sm:bottom-10 sm:h-28 sm:w-28"
          aria-hidden="true"
        >
          <span className="natsu-spin absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <defs>
                <path
                  id="natsu-badge-arc"
                  d="M 50,50 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0"
                />
              </defs>
              <text fill="#f3efea" fontSize="7.6" letterSpacing="1.2">
                <textPath href="#natsu-badge-arc">
                  DISCOVER MORE &#8226; DISCOVER MORE &#8226; DISCOVER MORE &#8226;{' '}
                </textPath>
              </text>
            </svg>
          </span>
          <span className="natsu-pill flex h-12 w-12 items-center justify-center border border-natsu-bg/50 bg-natsu-caramel/90 text-natsu-bg">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}
