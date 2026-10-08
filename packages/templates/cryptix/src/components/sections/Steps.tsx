'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's "HOW IT WORKS" band: three numbered steps, each with its own
 * screenshot (confirmed by offset order in the SSR HTML — each image
 * immediately precedes that step's own body copy, see defaults.ts's
 * `STEPS`).
 */
export default function Steps() {
  const { STEPS } = useContent();

  return (
    <section id="how-it-works" className="bg-cryptix-surface/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-cryptix-link uppercase">
            {STEPS.eyebrow}
          </p>
          <h2 className="font-cryptix-display mt-4 text-3xl text-cryptix-ink sm:text-4xl">{STEPS.title}</h2>
          {STEPS.subhead ? <p className="mt-4 text-base text-cryptix-muted">{STEPS.subhead}</p> : null}
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {STEPS.items.map((step, i) => (
            <Reveal
              key={step.number}
              delay={i * 100}
              className="cryptix-card flex flex-col gap-5 border border-cryptix-border bg-cryptix-bg p-6"
            >
              <div className="cryptix-card relative aspect-[4/3] overflow-hidden border border-cryptix-border">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div>
                <span className="font-cryptix-mono text-sm text-cryptix-accent">{step.number}</span>
                <h3 className="font-cryptix-display mt-2 text-lg text-cryptix-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cryptix-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
