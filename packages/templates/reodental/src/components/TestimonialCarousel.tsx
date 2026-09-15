"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Testimonial } from "../defaults";

/**
 * The source site renders this as a carousel (data-framer-name="Previous
 * Button" / "Next Button" present in the markup) even though only one
 * testimonial's text survived the static crawl. Built as a real carousel
 * so additional slides can be added later without touching this component.
 */
export default function TestimonialCarousel({
  items,
}: {
  items: Testimonial[];
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const testimonial = items[index];

  const go = (delta: number) => {
    setDirection(delta);
    setIndex((prev) => (prev + delta + items.length) % items.length);
  };

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-3xl bg-cream-soft p-8 md:p-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-gold">
              {testimonial.category}
            </span>
            <p className="mt-4 text-sm font-medium text-ink">
              {testimonial.rating}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink md:text-xl">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="relative h-11 w-11 overflow-hidden rounded-full">
                <Image
                  src={testimonial.photo}
                  alt={testimonial.name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">
                  {testimonial.name}
                </p>
                <p className="text-xs text-muted">{testimonial.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            aria-label="Previous testimonial"
            data-framer-name="Previous Button"
            onClick={() => go(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-ink transition-colors hover:border-ink"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            data-framer-name="Next Button"
            onClick={() => go(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong text-ink transition-colors hover:border-ink"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
