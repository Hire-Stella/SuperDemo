'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "Platform overview" band: an eyebrow, heading, subhead and
 * two CTAs above a large dashboard screenshot, set over a soft full-bleed
 * background photo, with three short benefit lines below.
 */
export default function About() {
  const { ABOUT } = useContent();

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {ABOUT.bg ? (
        <div className="absolute inset-0" aria-hidden>
          <Image src={ABOUT.bg} alt="" fill sizes="100vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-vantra-bg via-vantra-bg/70 to-vantra-bg" />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          {ABOUT.eyebrow ? (
            <span className="vantra-pill inline-block bg-vantra-surface px-4 py-1.5 text-xs font-semibold text-vantra-ink">
              {ABOUT.eyebrow}
            </span>
          ) : null}
          <h2 className="font-vantra-display mx-auto mt-4 max-w-lg text-4xl text-vantra-ink">
            {ABOUT.heading}
          </h2>
          {ABOUT.body ? (
            <p className="mx-auto mt-4 max-w-md text-vantra-muted">{ABOUT.body}</p>
          ) : null}

          {ABOUT.cta || ABOUT.secondaryCta ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {ABOUT.cta ? (
                <Link
                  href={ABOUT.cta.href}
                  className="vantra-pill inline-flex items-center gap-2 bg-vantra-dark py-3 pr-2.5 pl-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {ABOUT.cta.label}
                  <span className="vantra-pill flex h-7 w-7 items-center justify-center bg-white">
                    <Image src="/t/vantra/icons/arrow.svg" alt="" width={11} height={8} />
                  </span>
                </Link>
              ) : null}
              {ABOUT.secondaryCta ? (
                <Link
                  href={ABOUT.secondaryCta.href}
                  className="vantra-pill inline-flex items-center px-6 py-3 text-sm font-semibold text-vantra-ink ring-1 ring-vantra-border transition-colors hover:bg-vantra-surface"
                >
                  {ABOUT.secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </Reveal>
      </div>

      {ABOUT.image ? (
        <Reveal delay={100} className="vantra-card relative mx-auto mt-12 aspect-[16/9] max-w-4xl overflow-hidden border border-vantra-border px-6 shadow-[0_30px_80px_-30px_rgba(16,17,18,0.25)] sm:mx-6 sm:px-0 lg:mx-auto">
          <Image
            src={ABOUT.image}
            alt="Platform dashboard overview"
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
        </Reveal>
      ) : null}

      {ABOUT.stats.length > 0 ? (
        <div className="relative mx-auto mt-14 grid max-w-4xl gap-8 px-6 sm:grid-cols-3">
          {ABOUT.stats.map((stat, i) => (
            <Reveal key={stat.value} delay={i * 80} className="text-center sm:text-left">
              <p className="font-vantra-display text-lg text-vantra-ink">{stat.value}</p>
              <p className="mt-2 text-sm text-vantra-muted">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      ) : null}
    </section>
  );
}
