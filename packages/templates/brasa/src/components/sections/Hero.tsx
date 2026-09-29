'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The home page's real hero: a repeating promo ribbon, a headline built
 * from the source's own real sentence (see defaults.ts), and — instead of
 * one clean rectangle — a tilted two-photo stack, the source's own literal
 * `rotate(-10deg)` treatment on its dish photography, carried up into the
 * hero itself. A small spinning badge (hand-matched from the source's
 * JS-driven "Rotating Image" layer, see theme.css's `.brasa-spin`)
 * overlaps the stack's top corner, the way the source's own badge overlaps
 * its hero photo.
 *
 * This is the fourth, genuinely different hero grammar in the library:
 * neither tavola's centered text over a full-bleed video, nor forno's or
 * aurelia's clean two-column split — this one lets its photography spill
 * out of its own box, rotated and overlapping, rather than sitting flush
 * inside it.
 */
export default function Hero() {
  const { HERO } = useContent();
  const stackA = HERO.stack[0];
  const stackB = HERO.stack[1];

  return (
    <section id="top" className="relative overflow-hidden bg-brasa-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pt-16 pb-20 sm:pt-20 sm:pb-28 lg:grid-cols-2">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="brasa-frame inline-block border-2 border-brasa-chili bg-brasa-chili px-4 py-1.5 text-xs font-bold tracking-[0.08em] text-white uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}
          <h1 className="font-brasa-display mt-5 text-5xl leading-[1.05] text-brasa-ink sm:text-6xl lg:text-[4.5rem]">
            {HERO.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {HERO.subhead ? (
            <p className="mt-6 max-w-md text-base leading-relaxed text-brasa-muted">
              {HERO.subhead}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {HERO.primaryCta ? (
              <Link
                href={HERO.primaryCta.href}
                className="brasa-frame inline-flex items-center justify-center border-2 border-brasa-marigold bg-brasa-marigold px-8 py-3.5 text-sm font-bold tracking-[0.04em] text-brasa-ink uppercase transition-transform hover:scale-[1.03]"
              >
                {HERO.primaryCta.label}
              </Link>
            ) : null}
            {HERO.secondaryCta ? (
              <Link
                href={HERO.secondaryCta.href}
                className="brasa-frame inline-flex items-center justify-center border-2 border-brasa-ink/25 px-8 py-3.5 text-sm font-bold tracking-[0.04em] text-brasa-ink uppercase transition-colors hover:border-brasa-ink"
              >
                {HERO.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </Reveal>

        <Reveal delay={120} className="relative pt-6 pb-10 pl-6">
          {HERO.image ? (
            <div className="brasa-frame relative aspect-[4/5] w-full overflow-hidden border-4 border-brasa-ink">
              <Image
                src={HERO.image}
                alt="Brasa dining room"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          ) : null}

          {stackA ? (
            <div
              className="brasa-tilt-a brasa-frame absolute -bottom-6 -left-2 h-32 w-32 overflow-hidden border-[6px] border-brasa-marigold bg-brasa-chili shadow-xl sm:h-40 sm:w-40"
              aria-hidden="true"
            >
              <Image
                src={stackA.src}
                alt={stackA.alt}
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          ) : null}

          {stackB ? (
            <div
              className="brasa-tilt-b brasa-frame absolute top-0 left-0 h-24 w-24 overflow-hidden border-[6px] border-brasa-marigold bg-brasa-chili shadow-xl sm:h-28 sm:w-28"
              aria-hidden="true"
            >
              <Image
                src={stackB.src}
                alt={stackB.alt}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
          ) : null}

          {HERO.badge?.text ? (
            <div
              className="brasa-circle absolute top-4 right-0 flex h-20 w-20 items-center justify-center border-2 border-brasa-ink bg-brasa-chili text-center sm:h-24 sm:w-24"
              aria-hidden="true"
            >
              <span className="brasa-spin absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <defs>
                    <path
                      id="brasa-badge-arc"
                      d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                    />
                  </defs>
                  <text fill="#f7efd4" fontSize="8.6" letterSpacing="1.5">
                    <textPath href="#brasa-badge-arc">{HERO.badge.text}</textPath>
                  </text>
                </svg>
              </span>
              <span className="font-brasa-display relative text-[0.6rem] leading-none text-brasa-bg uppercase">
                Fresh
              </span>
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
