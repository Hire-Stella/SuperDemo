'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's three full-width alternating panels — "TOTAL CONTROL",
 * "BUILT FOR SPEED", "SECURITY FIRST" — each pairing one eyebrow/heading/
 * body/CTA with the source's own flagship dashboard screenshot (the same
 * asset reused across all three, confirmed against the SSR HTML; see
 * defaults.ts's `SHOWCASE_PANELS`). The first panel is this template's
 * `about` band — the only one of the three the schema can personalize.
 */
export default function Showcase() {
  const { SHOWCASE_PANELS } = useContent();

  return (
    <section className="bg-cryptix-bg py-20 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-24 px-6">
        {SHOWCASE_PANELS.map((panel, i) => (
          <div
            key={panel.heading}
            className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
          >
            <Reveal>
              <p className="text-xs font-semibold tracking-[0.2em] text-cryptix-link uppercase">
                {panel.eyebrow}
              </p>
              <h2 className="font-cryptix-display mt-4 text-3xl text-cryptix-ink sm:text-4xl">
                {panel.heading}
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-cryptix-muted">{panel.body}</p>
              {panel.cta ? (
                <Link
                  href={panel.cta.href}
                  className="cryptix-pill mt-8 inline-flex items-center justify-center border border-cryptix-border px-7 py-3 text-sm font-semibold text-cryptix-ink transition-colors hover:border-cryptix-accent hover:text-cryptix-accent"
                >
                  {panel.cta.label}
                </Link>
              ) : null}
            </Reveal>

            <Reveal delay={100} className="cryptix-card relative aspect-[16/10] overflow-hidden border border-cryptix-border">
              <Image
                src={panel.image}
                alt={panel.heading}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
