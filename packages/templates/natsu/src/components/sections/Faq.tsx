'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The home page's own FAQ band — kept to the one question the source
 * itself actually answers (see defaults.ts), rather than padded out to a
 * five-item accordion with four invented answers.
 */
export default function Faq() {
  const { FAQ } = useContent();

  return (
    <section className="bg-natsu-bg py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.28em] text-natsu-caramel uppercase">
            {FAQ.eyebrow}
          </p>
          <h2 className="font-natsu-display mt-4 text-4xl text-natsu-ink sm:text-5xl">
            {FAQ.title}
          </h2>
          {FAQ.subhead ? <p className="mt-4 text-base text-natsu-muted">{FAQ.subhead}</p> : null}
        </Reveal>

        <div className="mt-10 flex flex-col gap-4 text-left">
          {FAQ.items.map((item) => (
            <Reveal
              key={item.q}
              className="natsu-soft border border-natsu-ink/10 bg-natsu-surface p-6"
            >
              <p className="font-natsu-display text-lg text-natsu-ink">{item.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-natsu-muted">{item.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
