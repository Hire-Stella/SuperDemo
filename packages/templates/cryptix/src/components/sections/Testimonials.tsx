'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's testimonials carousel shows a "1/3" page indicator but its
 * static markup only ever populates one slide's quote (see defaults.ts's
 * note on `TESTIMONIALS`) — ported as a single centered card rather than a
 * fake multi-slide carousel with invented quotes.
 */
export default function Testimonials() {
  const { TESTIMONIALS } = useContent();

  return (
    <section id="testimonials" className="bg-cryptix-surface/40 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-cryptix-link uppercase">
            {TESTIMONIALS.eyebrow}
          </p>
          <h2 className="font-cryptix-display mt-4 text-3xl text-cryptix-ink sm:text-4xl">
            {TESTIMONIALS.title}
          </h2>
          {TESTIMONIALS.subhead ? (
            <p className="mt-4 text-base text-cryptix-muted">{TESTIMONIALS.subhead}</p>
          ) : null}
        </Reveal>

        <div className="mt-12 flex flex-col gap-6">
          {TESTIMONIALS.items.map((t) => (
            <Reveal
              key={t.author}
              className="cryptix-card border border-cryptix-border bg-cryptix-bg p-8 text-left sm:p-10"
            >
              <p className="font-cryptix-display text-xl leading-snug text-cryptix-ink sm:text-2xl">
                “{t.quote}”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cryptix-accent/15 font-cryptix-mono text-sm text-cryptix-accent">
                  {t.author.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-cryptix-ink">{t.author}</p>
                  {t.role ? <p className="text-xs text-cryptix-faint">{t.role}</p> : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
