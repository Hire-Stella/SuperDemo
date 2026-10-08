'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's hero: a centered two-word headline with a small "AI" badge
 * inline between the words, a prose subhead, a filled blue primary CTA and
 * an outlined secondary CTA, three small trust chips, and a large dashboard
 * screenshot floating over a soft meadow-photo horizon with a few decorative
 * cloud cut-outs around it. The blue fill on the primary CTA here (rather
 * than the near-black fill every other section's CTA uses) is the source's
 * own literal choice, confirmed by screenshotting the rendered button.
 */
export default function Hero() {
  const { HERO, SITE_NAME } = useContent();
  const [firstLine, ...restLines] = HERO.titleLines;

  return (
    <section id="top" className="relative overflow-hidden pt-16 pb-0 sm:pt-24">
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          {HERO.eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.28em] text-vantra-muted uppercase">
              {HERO.eyebrow}
            </p>
          ) : null}

          <h1 className="font-vantra-display flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-5xl leading-[1.05] text-vantra-ink sm:text-6xl lg:text-7xl">
            <span>{firstLine}</span>
            {HERO.badge ? (
              <Image
                src={HERO.badge}
                alt=""
                width={56}
                height={56}
                className="inline-block h-10 w-10 shrink-0 align-middle sm:h-14 sm:w-14"
              />
            ) : null}
            {restLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>

          {HERO.subhead ? (
            <p className="mx-auto mt-6 max-w-xl text-lg text-vantra-muted">{HERO.subhead}</p>
          ) : null}

          {HERO.primaryCta || HERO.secondaryCta ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {HERO.primaryCta ? (
                <Link
                  href={HERO.primaryCta.href}
                  className="vantra-pill inline-flex items-center gap-2 bg-vantra-accent py-3 pr-3 pl-6 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(61,99,245,0.6)] transition-opacity hover:opacity-90"
                >
                  {HERO.primaryCta.label}
                  <span className="vantra-pill flex h-7 w-7 items-center justify-center bg-white">
                    <Image src="/t/vantra/icons/arrow.svg" alt="" width={11} height={8} />
                  </span>
                </Link>
              ) : null}
              {HERO.secondaryCta ? (
                <Link
                  href={HERO.secondaryCta.href}
                  className="vantra-pill inline-flex items-center px-6 py-3 text-sm font-semibold text-vantra-ink ring-1 ring-vantra-border transition-colors hover:bg-vantra-surface"
                >
                  {HERO.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}

          {HERO.trustChips.length > 0 ? (
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {HERO.trustChips.map((chip) => (
                <li
                  key={chip.label}
                  className="flex items-center gap-2 text-sm font-medium text-vantra-muted"
                >
                  {chip.icon ? (
                    <Image src={chip.icon} alt="" width={16} height={16} className="h-4 w-4" />
                  ) : null}
                  {chip.label}
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>
      </div>

      {HERO.image ? (
        <Reveal delay={120} className="relative z-10 mx-auto mt-14 max-w-5xl px-6 sm:mt-20">
          <div className="vantra-card relative aspect-[16/9.4] overflow-hidden border border-vantra-border shadow-[0_30px_80px_-30px_rgba(16,17,18,0.35)]">
            <Image
              src={HERO.image}
              alt={`${SITE_NAME} portfolio dashboard`}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority
              className="object-cover"
            />
          </div>

          {HERO.clouds[0] ? (
            <Image
              src={HERO.clouds[0]}
              alt=""
              aria-hidden
              width={220}
              height={128}
              className="pointer-events-none absolute -top-10 -left-10 hidden w-40 opacity-90 sm:block lg:w-56"
            />
          ) : null}
          {HERO.clouds[2] ? (
            <Image
              src={HERO.clouds[2]}
              alt=""
              aria-hidden
              width={220}
              height={132}
              className="pointer-events-none absolute -top-6 -right-8 hidden w-36 opacity-90 sm:block lg:w-48"
            />
          ) : null}
        </Reveal>
      ) : null}

      {HERO.bg ? (
        <div className="relative mt-16 h-40 sm:h-56" aria-hidden>
          <Image src={HERO.bg} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-vantra-bg via-vantra-bg/10 to-transparent" />
        </div>
      ) : null}
    </section>
  );
}
