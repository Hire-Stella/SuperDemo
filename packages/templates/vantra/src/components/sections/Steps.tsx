'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source shows these three steps behind a click-to-switch tab, one
 * detail panel visible at a time. Ported as three static numbered cards
 * instead of reproducing that tab state — see defaults.ts's own note.
 */
export default function Steps() {
  const { STEPS } = useContent();
  if (STEPS.items.length === 0) return null;

  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl items-start gap-12 px-6 lg:grid-cols-2">
        <Reveal>
          {STEPS.eyebrow ? (
            <span className="vantra-pill inline-block bg-vantra-surface px-4 py-1.5 text-xs font-semibold text-vantra-ink">
              {STEPS.eyebrow}
            </span>
          ) : null}
          <h2 className="font-vantra-display mt-4 text-4xl text-vantra-ink">{STEPS.title}</h2>
          {STEPS.subhead ? <p className="mt-4 max-w-sm text-vantra-muted">{STEPS.subhead}</p> : null}

          {STEPS.stats.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-vantra-border pt-8">
              {STEPS.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-vantra-display text-2xl text-vantra-ink">{stat.value}</p>
                  <p className="mt-1 text-sm text-vantra-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Reveal>

        <div className="flex flex-col gap-4">
          {STEPS.items.map((step, i) => (
            <Reveal
              key={step.number}
              delay={i * 80}
              className="vantra-card flex gap-4 border border-vantra-border bg-vantra-surface p-6"
            >
              <span className="font-vantra-display shrink-0 text-2xl text-vantra-accent">
                {step.number}
              </span>
              <div>
                <h3 className="font-vantra-display text-lg text-vantra-ink">{step.title}</h3>
                {step.body ? <p className="mt-1.5 text-sm text-vantra-muted">{step.body}</p> : null}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
