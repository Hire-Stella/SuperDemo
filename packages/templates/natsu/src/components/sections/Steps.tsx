'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The about page's own three-point founding timeline ("How It Started") —
 * no sibling template's source had an equivalent, which is why `steps` is
 * new to this template's own `SUPPORTS`.
 */
export default function Steps() {
  const { STEPS } = useContent();

  return (
    <section className="bg-natsu-bg py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-caramel uppercase">
            {STEPS.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-4xl text-natsu-ink sm:text-5xl">
            {STEPS.title}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {STEPS.items.map((step, i) => (
            <Reveal key={step.number} delay={i * 100} className="relative text-center">
              <span className="font-natsu-display block text-5xl leading-none text-natsu-gold">
                {step.number}
              </span>
              <h3 className="font-natsu-display mt-3 text-xl text-natsu-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-natsu-muted">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
