'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** The four-stage "leaf to cup" process band — no sibling template's own repertoire has an equivalent for a shaken, not brewed, drink. */
export default function Steps() {
  const { STEPS } = useContent();

  return (
    <section id="process" className="bg-pearl-bg py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold tracking-[0.28em] text-pearl-berry uppercase">
            {STEPS.eyebrow}
          </p>
          <h2 className="font-pearl-display mt-4 text-4xl text-pearl-ink sm:text-5xl">
            {STEPS.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.items.map((step, i) => (
            <Reveal key={step.number} delay={i * 100} className="relative text-center">
              <span className="pearl-pill mx-auto flex h-14 w-14 items-center justify-center bg-pearl-sugar font-pearl-display text-lg text-white">
                {step.number}
              </span>
              <h3 className="font-pearl-display mt-4 text-xl text-pearl-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-pearl-muted">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
