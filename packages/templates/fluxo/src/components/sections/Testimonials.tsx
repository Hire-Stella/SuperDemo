'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own nine-quote testimonial band, rendered as a static grid
 * rather than the source's own looping marquee columns — Gallery already
 * carries this port's one marquee, and nine full quotes read better paced
 * than looping. Quotes, names and roles are the source's own (lightly
 * polished — see defaults.ts's `TESTIMONIALS` note); photos are the
 * source's own real stock portraits, downloaded and re-encoded locally.
 */
export default function Testimonials() {
  const { TESTIMONIALS, SITE_NAME } = useContent();

  return (
    <section id="testimonials" className="bg-fluxo-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.16em] text-fluxo-accent uppercase">
            Testimonials
          </p>
          <h2 className="font-fluxo-display mt-4 text-3xl text-fluxo-ink sm:text-4xl">
            With love, from our customers
          </h2>
          <p className="mt-3 text-base text-fluxo-muted">
            Don&apos;t take our word for it — here&apos;s what businesses on {SITE_NAME} have to
            say.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal
              key={t.author}
              delay={(i % 3) * 90}
              className="fluxo-card flex flex-col gap-5 border border-fluxo-border bg-white p-6"
            >
              <p className="text-sm leading-relaxed text-fluxo-ink">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-auto flex items-center gap-3">
                {t.image ? (
                  <Image
                    src={t.image}
                    alt={t.author}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : null}
                <div>
                  <p className="text-sm font-semibold text-fluxo-ink">{t.author}</p>
                  {t.role ? <p className="text-xs text-fluxo-faint">{t.role}</p> : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
