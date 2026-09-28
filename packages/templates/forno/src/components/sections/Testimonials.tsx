'use client';

import Image from 'next/image';
import { useContent } from '../../context';
import { Reveal } from '../Reveal';

/**
 * The source's own "Pizza Perfection, Expertly Rated" band is a JS
 * slideshow component (`framer-slideshow-component` in its compiled
 * bundle) with prev/next arrow controls. Hand-matched here as a native
 * CSS scroll-snap row instead of porting a bespoke carousel: it keeps the
 * same one-card-at-a-time horizontal rhythm the source has, without a
 * motion library, and works with a trackpad, touch or a keyboard without
 * extra script.
 */
export default function Testimonials() {
  const { TESTIMONIALS } = useContent();

  return (
    <section id="reviews" className="bg-forno-ink py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="text-xs font-bold tracking-[0.22em] text-forno-orange uppercase">
            {TESTIMONIALS.eyebrow}
          </p>
          <h2 className="font-forno-display mt-4 text-3xl sm:text-4xl">{TESTIMONIALS.title}</h2>
          <p className="mt-3 text-base text-white/70">{TESTIMONIALS.subhead}</p>
        </Reveal>

        <Reveal
          delay={100}
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.items.map((t) => (
            <figure
              key={t.author}
              className="forno-card flex w-[280px] shrink-0 snap-start flex-col gap-4 border border-white/10 bg-white/5 p-6 sm:w-[320px]"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                <Image src={t.image} alt={t.author} fill sizes="56px" className="object-cover" />
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-white/85">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption>
                <p className="font-forno-display text-base">{t.author}</p>
                <p className="text-xs text-white/60">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
