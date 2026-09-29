'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own three-phrase process list from the "Your partner for
 * life's journey" band, reordered and numbered into an actual sequence (see
 * defaults.ts's `STEPS` note).
 */
export default function Steps() {
  const { STEPS } = useContent();

  return (
    <section className="bg-insunet-surface py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.24em] text-insunet-teal uppercase">
            {STEPS.eyebrow}
          </p>
          <h2 className="font-insunet-display mt-4 text-3xl text-insunet-ink sm:text-4xl">
            {STEPS.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {STEPS.items.map((step, i) => (
            <Reveal key={step.number} delay={i * 100} className="insunet-card bg-white p-7">
              <span className="insunet-pill flex h-10 w-10 items-center justify-center bg-insunet-accent text-sm font-semibold text-insunet-accent-ink">
                {step.number}
              </span>
              <h3 className="font-insunet-display mt-5 text-lg text-insunet-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-insunet-muted">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
