'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** A real, zero-JS accordion (native `<details>`), rather than natsu's always-open reveal cards. */
export default function Faq() {
  const { FAQ } = useContent();

  return (
    <section className="bg-pearl-surface py-20 sm:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.28em] text-pearl-berry uppercase">
            {FAQ.eyebrow}
          </p>
          <h2 className="font-pearl-display mt-4 text-4xl text-pearl-ink sm:text-5xl">
            {FAQ.title}
          </h2>
          {FAQ.subhead ? <p className="mt-4 text-base text-pearl-muted">{FAQ.subhead}</p> : null}
        </Reveal>

        <div className="mt-10 flex flex-col gap-3 text-left">
          {FAQ.items.map((item) => (
            <Reveal key={item.q}>
              <details className="pearl-cup group border border-pearl-border bg-pearl-bg px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-pearl-display text-base text-pearl-ink marker:content-none">
                  {item.q}
                  <span className="pearl-pill flex h-6 w-6 shrink-0 items-center justify-center bg-pearl-taro-soft text-sm text-white transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-pearl-muted">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
