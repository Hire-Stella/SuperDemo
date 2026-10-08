'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Smarter Investing. Stronger Outcomes" band — seven real
 * feature-pipeline cards, not six (see defaults.ts for how the source's own
 * duplicate "Real-Time Insights" heading with two distinct bodies was
 * confirmed against its raw markup rather than assumed to be a crawl
 * artifact). Numbered here as a process rather than left as a bare grid,
 * since the source's own copy reads as a sequence — strategy, insight,
 * optimization, insight, execution, risk, tracking.
 */
export default function Steps() {
  const { STEPS } = useContent();

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-summit-display text-3xl text-summit-ink sm:text-4xl">
            {STEPS.title}
            {STEPS.titleLine2 ? (
              <>
                <br />
                {STEPS.titleLine2}
              </>
            ) : null}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.items.map((item, i) => (
            <Reveal
              key={`${item.title}-${item.number}`}
              delay={(i % 3) * 90}
              className="summit-card p-6"
            >
              <p className="font-summit-mono text-xs text-summit-gold">{item.number}</p>
              <h3 className="font-summit-display mt-3 text-lg text-summit-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-summit-muted">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
