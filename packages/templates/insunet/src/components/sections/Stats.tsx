'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Trusted by 23,000+ people" band: three metrics beside a
 * photograph, hand-matched rather than literally ported (see defaults.ts's
 * `STATS` note on the source's JS-only counter and its one real static
 * figure, "23,000+", kept verbatim as the first value here).
 */
export default function Stats() {
  const { STATS } = useContent();

  return (
    <section className="bg-insunet-bg py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="insunet-card relative order-2 aspect-[4/3] overflow-hidden bg-insunet-surface lg:order-1">
            {STATS.image ? (
              <Image
                src={STATS.image}
                alt="A couple shaking hands with their insurance advisor"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            ) : null}
          </Reveal>

          <Reveal delay={100} className="order-1 lg:order-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
              {STATS.eyebrow}
            </p>
            <h2 className="font-insunet-display mt-4 text-3xl text-insunet-ink sm:text-4xl">
              {STATS.title}
            </h2>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-insunet-border/60 pt-8">
              {STATS.items.map((stat) => (
                <div key={stat.label}>
                  <p className="font-insunet-display text-3xl text-insunet-ink sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold tracking-[0.04em] text-insunet-muted uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
