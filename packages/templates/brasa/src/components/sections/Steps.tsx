'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The home + about pages' literal "Experience Our Process" band — a plain
 * three-step numbered sequence, present on both routes verbatim. No
 * sibling template's source had an equivalent, which is why `steps` is new
 * to this template's own `SUPPORTS`.
 */
export default function Steps() {
  const { STEPS } = useContent();

  return (
    <section className="bg-brasa-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-brasa-chili uppercase">
            {STEPS.eyebrow}
          </p>
          <h2 className="font-brasa-display mt-4 text-4xl text-brasa-ink sm:text-5xl">
            {STEPS.title}
          </h2>
          {STEPS.subhead ? (
            <p className="mt-4 text-base text-brasa-muted">{STEPS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {STEPS.items.map((step, i) => (
            <Reveal key={step.number} delay={i * 100} className="relative text-center">
              <span className="font-brasa-display text-brasa-marigold/70 block text-6xl leading-none">
                {step.number}
              </span>
              <h3 className="font-brasa-display mt-3 text-xl text-brasa-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brasa-muted">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
