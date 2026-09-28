'use client';

import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The About page's three review-platform badges. Each card in the source is
 * a row of five stars over two lines of text (platform, then accolade) —
 * "Trip Advisor" / "Best Sushi", and so on.
 */
export default function Highlights() {
  const { HIGHLIGHTS } = useContent();

  return (
    <section className="bg-tavola-ink py-16 text-tavola-cream sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-lg text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-tavola-gold uppercase">
            {HIGHLIGHTS.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-3xl sm:text-4xl">{HIGHLIGHTS.title}</h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {HIGHLIGHTS.items.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 100}
              className="flex flex-col items-center gap-3 border-t border-tavola-cream/10 pt-8 text-center"
            >
              <div className="flex gap-1 text-tavola-gold" aria-hidden="true">
                {'★★★★★'.split('').map((star, index) => (
                  <span key={index}>{star}</span>
                ))}
              </div>
              <p className="font-display text-xl">{item.title}</p>
              <p className="text-sm tracking-[0.08em] text-tavola-cream/70 uppercase">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
