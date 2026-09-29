'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source scatters these five cards around the heading in an asymmetric
 * "wings" layout (two cards flank the heading, three more sit in a row
 * below it) with each card its own fill — light / dark / dark / accent-blue
 * gradient / light. Ported here as a plain responsive bento grid rather
 * than replicating the exact overlap, the same simplification Highlights
 * makes for its own bento rhythm; the per-card fill order is kept.
 */
const TREATMENTS = [
  'bg-vantra-surface text-vantra-ink',
  'bg-vantra-dark text-white',
  'bg-vantra-dark text-white',
  'bg-gradient-to-br from-vantra-accent-light to-vantra-accent text-white',
  'bg-vantra-surface text-vantra-ink',
] as const;

export default function Stats() {
  const { STATS } = useContent();
  if (STATS.items.length === 0) return null;

  return (
    <section id="stats" className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          {STATS.eyebrow ? (
            <span className="vantra-pill inline-block bg-vantra-surface px-4 py-1.5 text-xs font-semibold text-vantra-ink">
              {STATS.eyebrow}
            </span>
          ) : null}
          <h2 className="font-vantra-display mt-4 text-4xl text-vantra-ink">{STATS.title}</h2>
          {STATS.subhead ? <p className="mt-4 text-vantra-muted">{STATS.subhead}</p> : null}
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STATS.items.map((stat, i) => {
            const treatment = TREATMENTS[i % TREATMENTS.length];
            const isLight = treatment.includes('vantra-surface');
            return (
              <Reveal
                key={stat.label}
                delay={(i % 3) * 80}
                className={`vantra-card flex min-h-[220px] flex-col justify-between p-6 ${treatment}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-vantra-display text-base">{stat.label}</p>
                  {stat.icon ? (
                    <span
                      className={`vantra-pill flex h-9 w-9 shrink-0 items-center justify-center ${
                        isLight ? 'bg-vantra-accent' : 'bg-white/15'
                      }`}
                    >
                      <Image
                        src={stat.icon}
                        alt=""
                        width={18}
                        height={18}
                        className={isLight ? 'invert' : ''}
                      />
                    </span>
                  ) : null}
                </div>
                <div>
                  <p className="font-vantra-display text-3xl">{stat.value}</p>
                  {stat.body ? (
                    <p className={`mt-2 text-sm ${isLight ? 'text-vantra-muted' : 'text-white/70'}`}>
                      {stat.body}
                    </p>
                  ) : null}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
