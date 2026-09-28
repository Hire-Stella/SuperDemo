'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/** A real, zero-JS accordion (native `<details>`), matching the repo's own pattern for this. */
export default function Faq() {
  const { FAQ } = useContent();
  if (FAQ.items.length === 0) return null;

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div>
          <Reveal>
            <h2 className="font-vantra-display text-4xl text-vantra-ink">{FAQ.title}</h2>
            {FAQ.subhead ? <p className="mt-4 text-vantra-muted">{FAQ.subhead}</p> : null}
          </Reveal>

          {FAQ.stillHaveQuestions ? (
            <Reveal
              delay={80}
              className="vantra-card mt-8 border border-vantra-border bg-vantra-surface p-6"
            >
              {FAQ.stillHaveQuestions.avatars.length > 0 ? (
                <div className="flex items-center">
                  {FAQ.stillHaveQuestions.avatars.map((avatar, i) => (
                    <Image
                      key={avatar}
                      src={avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full border-2 border-vantra-surface object-cover"
                      style={i > 0 ? { marginLeft: '-0.6rem' } : undefined}
                    />
                  ))}
                  <span className="vantra-pill ml-2 flex h-10 w-10 items-center justify-center border-2 border-vantra-surface bg-vantra-accent text-xs font-semibold text-white">
                    You
                  </span>
                </div>
              ) : null}
              <h3 className="font-vantra-display mt-4 text-lg text-vantra-ink">
                {FAQ.stillHaveQuestions.heading}
              </h3>
              {FAQ.stillHaveQuestions.body ? (
                <p className="mt-1 text-sm text-vantra-muted">{FAQ.stillHaveQuestions.body}</p>
              ) : null}
              {FAQ.stillHaveQuestions.cta ? (
                <Link
                  href={FAQ.stillHaveQuestions.cta.href}
                  className="vantra-pill mt-5 inline-flex items-center gap-2 bg-vantra-dark py-2.5 pr-2.5 pl-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {FAQ.stillHaveQuestions.cta.label}
                  <span className="vantra-pill flex h-6 w-6 items-center justify-center bg-white">
                    <Image src="/t/vantra/icons/arrow.svg" alt="" width={11} height={8} />
                  </span>
                </Link>
              ) : null}
            </Reveal>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {FAQ.items.map((item, i) => (
            <Reveal key={item.q} delay={(i % 5) * 40}>
              <details
                className="vantra-card group border border-vantra-border bg-vantra-bg px-6 py-4 open:bg-vantra-surface"
                open={i === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-vantra-ink marker:content-none">
                  {item.q}
                  <span className="vantra-pill flex h-7 w-7 shrink-0 items-center justify-center bg-vantra-dark text-sm text-white transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-vantra-muted">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
