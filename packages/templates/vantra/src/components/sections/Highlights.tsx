'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's bento feature grid: five cards, each its own size and fill —
 * light / sky-photo / near-black / sky-photo-wide / light — rather than a
 * uniform repeating card. `treatments` below is this port's own fixed,
 * per-index styling for that rhythm; it is not derived from tenant content,
 * the same way kiln's card corner radius isn't either.
 */
const TREATMENTS = [
  'bg-vantra-surface text-vantra-ink',
  'bg-gradient-to-b from-sky-100 to-sky-200 text-vantra-ink',
  'bg-vantra-dark text-white',
  'bg-gradient-to-b from-sky-100 to-sky-200 text-vantra-ink lg:col-span-2',
  'bg-vantra-surface text-vantra-ink',
] as const;

export default function Highlights() {
  const { HIGHLIGHTS } = useContent();
  if (HIGHLIGHTS.items.length === 0) return null;

  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="vantra-pill inline-block bg-vantra-surface px-4 py-1.5 text-xs font-semibold text-vantra-ink">
              {HIGHLIGHTS.eyebrow}
            </span>
            <h2 className="font-vantra-display mt-4 max-w-md text-4xl text-vantra-ink">
              {HIGHLIGHTS.title}
            </h2>
          </div>
          <div className="max-w-xs lg:text-right">
            {HIGHLIGHTS.subhead ? (
              <p className="text-sm text-vantra-muted">{HIGHLIGHTS.subhead}</p>
            ) : null}
            {HIGHLIGHTS.cta ? (
              <Link
                href={HIGHLIGHTS.cta.href}
                className="vantra-pill mt-4 inline-flex items-center gap-2 bg-vantra-dark py-2.5 pr-2.5 pl-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {HIGHLIGHTS.cta.label}
                <span className="vantra-pill flex h-6 w-6 items-center justify-center bg-white">
                  <Image src="/t/vantra/icons/arrow.svg" alt="" width={11} height={8} />
                </span>
              </Link>
            ) : null}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.items.map((item, i) => {
            const treatment = TREATMENTS[i % TREATMENTS.length];
            const isDark = treatment.includes('vantra-dark');
            return (
              <Reveal
                key={item.title}
                delay={(i % 3) * 80}
                className={`vantra-card relative flex min-h-[280px] flex-col overflow-hidden p-7 ${treatment}`}
              >
                <h3 className="font-vantra-display text-lg">{item.title}</h3>
                {item.body ? (
                  <p className={`mt-2 max-w-xs text-sm ${isDark ? 'text-white/70' : 'text-vantra-muted'}`}>
                    {item.body}
                  </p>
                ) : null}

                {item.image ? (
                  <div className="relative mt-6 min-h-[120px] flex-1 overflow-hidden rounded-2xl">
                    <Image src={item.image} alt="" fill sizes="360px" className="object-cover" />
                  </div>
                ) : item.icon ? (
                  <div className="relative mt-auto flex flex-1 items-center justify-center py-6">
                    <Image src={item.icon} alt="" width={140} height={140} className="max-h-32 w-auto" />
                  </div>
                ) : null}

                {item.tags.length > 0 ? (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <li
                        key={tag}
                        className="vantra-pill bg-vantra-bg px-3 py-1.5 text-xs font-medium text-vantra-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
