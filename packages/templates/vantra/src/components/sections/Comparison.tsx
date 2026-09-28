'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source renders this as a Before/After toggle — one panel visible at a
 * time, switched by a JS-only tab with no static href. Both panels' real
 * copy is kept side by side here instead, so nothing behind the toggle is
 * lost to a static port (see defaults.ts's own note on this section).
 */
export default function Comparison() {
  const { COMPARISON } = useContent();

  return (
    <section id="comparison" className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="text-center">
          <h2 className="font-vantra-display mx-auto max-w-xl text-3xl text-vantra-ink sm:text-4xl">
            {COMPARISON.heading}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal delay={60} className="vantra-card border border-vantra-border bg-vantra-bg p-8">
            <p className="text-xs font-semibold tracking-[0.14em] text-vantra-muted uppercase">
              {COMPARISON.beforeLabel}
            </p>
            <h3 className="font-vantra-display mt-3 text-xl text-vantra-ink">
              {COMPARISON.beforeHeading}
            </h3>

            {COMPARISON.beforeImage ? (
              <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-vantra-surface">
                <Image
                  src={COMPARISON.beforeImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-contain p-6 opacity-90"
                />
              </div>
            ) : null}

            <ul className="mt-6 flex flex-col gap-3">
              {COMPARISON.before.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-vantra-muted">
                  {COMPARISON.beforeIcon ? (
                    <Image
                      src={COMPARISON.beforeIcon}
                      alt=""
                      width={10}
                      height={10}
                      className="mt-1.5 h-2.5 w-2.5 shrink-0"
                    />
                  ) : null}
                  {line}
                </li>
              ))}
            </ul>

            {COMPARISON.beforeStats.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-vantra-border pt-6">
                {COMPARISON.beforeStats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-vantra-display text-2xl text-vantra-ink">{stat.value}</p>
                    <p className="mt-1 text-xs text-vantra-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Reveal>

          <Reveal
            delay={120}
            className="vantra-card border border-vantra-dark bg-vantra-dark p-8 text-white"
          >
            <p className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">
              {COMPARISON.afterLabel}
            </p>
            <h3 className="font-vantra-display mt-3 text-xl text-white">
              {COMPARISON.afterHeading}
            </h3>

            <ul className="mt-6 flex flex-col gap-3">
              {COMPARISON.after.map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-white/80">
                  {COMPARISON.afterIcon ? (
                    <Image
                      src={COMPARISON.afterIcon}
                      alt=""
                      width={7}
                      height={10}
                      className="mt-1.5 h-2.5 w-2 shrink-0"
                    />
                  ) : null}
                  {line}
                </li>
              ))}
            </ul>

            {COMPARISON.afterStats.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-6">
                {COMPARISON.afterStats.map((stat) => (
                  <div key={stat.label} className="vantra-card bg-white/5 p-4">
                    <p className="font-vantra-display text-xl text-white">{stat.value}</p>
                    <p className="mt-1 text-xs text-white/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
