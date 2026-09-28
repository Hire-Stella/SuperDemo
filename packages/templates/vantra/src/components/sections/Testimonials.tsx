'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source scrolls these as a two-row marquee ticker; ported as a plain
 * wrapped grid instead (see TrustTicker.tsx's own note on why a continuous
 * marquee is skipped for a handful of static cards).
 */
export default function Testimonials() {
  const { TESTIMONIALS } = useContent();
  if (TESTIMONIALS.items.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {TESTIMONIALS.bg ? (
        <div className="absolute inset-0" aria-hidden>
          <Image src={TESTIMONIALS.bg} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-vantra-bg via-vantra-bg/60 to-vantra-bg" />
        </div>
      ) : null}

      <div className="relative mx-auto max-w-5xl px-6">
        <Reveal className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h2 className="font-vantra-display max-w-md text-3xl text-vantra-ink sm:text-4xl">
              {TESTIMONIALS.title}
            </h2>
            {TESTIMONIALS.trustChips.length > 0 ? (
              <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                {TESTIMONIALS.trustChips.map((chip) => (
                  <li
                    key={chip.label}
                    className="flex items-center gap-2 text-sm font-medium text-vantra-muted"
                  >
                    {chip.icon ? (
                      <Image src={chip.icon} alt="" width={16} height={16} className="h-4 w-4" />
                    ) : null}
                    {chip.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {TESTIMONIALS.cta ? (
            <Link
              href={TESTIMONIALS.cta.href}
              className="vantra-pill inline-flex shrink-0 items-center gap-2 bg-vantra-dark py-3 pr-2.5 pl-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {TESTIMONIALS.cta.label}
              <span className="vantra-pill flex h-7 w-7 items-center justify-center bg-white">
                <Image src="/t/vantra/icons/arrow.svg" alt="" width={11} height={8} />
              </span>
            </Link>
          ) : null}
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.items.map((item, i) => (
            <Reveal
              key={item.author}
              delay={(i % 3) * 80}
              className="vantra-card flex flex-col gap-4 border border-vantra-border bg-vantra-bg p-6"
            >
              <Image src="/t/vantra/icons/stars.svg" alt="5 out of 5 stars" width={91} height={15} />
              <p className="text-sm leading-relaxed text-vantra-ink">{item.quote}</p>
              <div className="mt-auto flex items-center gap-3 pt-2">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : null}
                <div>
                  <p className="text-sm font-semibold text-vantra-ink">{item.author}</p>
                  {item.role ? <p className="text-xs text-vantra-muted">{item.role}</p> : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
