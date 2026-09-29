'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's security & compliance band: one illustration in a soft
 * surface panel beside a heading, CTA and a four-line checklist. Not part
 * of the shared schema — no tenant field maps to "our compliance posture" —
 * so this stays the source's own literal copy (see defaults.ts).
 */
export default function Security() {
  const { SECURITY } = useContent();

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 lg:grid-cols-2">
        <Reveal className="vantra-card relative aspect-[4/3] overflow-hidden bg-vantra-surface">
          {SECURITY.image ? (
            <Image
              src={SECURITY.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-contain p-8"
            />
          ) : null}
        </Reveal>

        <Reveal delay={80}>
          <span className="vantra-pill inline-block bg-vantra-surface px-4 py-1.5 text-xs font-semibold text-vantra-ink">
            {SECURITY.eyebrow}
          </span>
          <h2 className="font-vantra-display mt-4 max-w-sm text-3xl text-vantra-ink sm:text-4xl">
            {SECURITY.heading}
          </h2>

          {SECURITY.cta ? (
            <Link
              href={SECURITY.cta.href}
              className="vantra-pill mt-6 inline-flex items-center gap-2 bg-vantra-dark py-3 pr-2.5 pl-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {SECURITY.cta.label}
              <span className="vantra-pill flex h-7 w-7 items-center justify-center bg-white">
                <Image src="/t/vantra/icons/arrow.svg" alt="" width={11} height={8} />
              </span>
            </Link>
          ) : null}

          {SECURITY.items.length > 0 ? (
            <ul className="mt-8 flex flex-col gap-3">
              {SECURITY.items.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-vantra-muted">
                  {SECURITY.icon ? (
                    <Image src={SECURITY.icon} alt="" width={7} height={10} className="h-2.5 w-2" />
                  ) : null}
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
