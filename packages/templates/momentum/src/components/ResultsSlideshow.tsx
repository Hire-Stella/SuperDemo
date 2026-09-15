"use client";

import Image from "next/image";
import { useState } from "react";
import { RESULTS } from "../defaults";
import { useContent } from "../context";

export default function ResultsSlideshow() {
  const { RESULTS } = useContent();
  const [activeIndex, setActiveIndex] = useState(0);
  const total = RESULTS.testimonials.length;
  const active = RESULTS.testimonials[activeIndex];

  const goTo = (direction: 1 | -1) => {
    setActiveIndex((current) => (current + direction + total) % total);
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-center">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink/5">
            <Image
              src={active.before}
              alt={`${active.name} before starting coaching`}
              fill
              sizes="(min-width: 1024px) 180px, 45vw"
              className="object-cover"
            />
            <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs text-white">
              Before
            </span>
          </div>
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-ink/5">
            <Image
              src={active.after}
              alt={`${active.name} after coaching with Forgewell`}
              fill
              sizes="(min-width: 1024px) 180px, 45vw"
              className="object-cover"
            />
            <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs text-white">
              After
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Previous transformation"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-accent hover:text-accent"
          >
            ←
          </button>
          <div className="flex gap-2">
            {RESULTS.testimonials.map((testimonial, index) => (
              <button
                key={testimonial.name}
                type="button"
                aria-label={`Show ${testimonial.name}'s transformation`}
                onClick={() => setActiveIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === activeIndex ? "bg-accent" : "bg-ink/20"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next transformation"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-accent hover:text-accent"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {RESULTS.testimonials.map((testimonial, index) => (
          <button
            type="button"
            key={testimonial.name}
            onClick={() => setActiveIndex(index)}
            className={`rounded-2xl border p-6 text-left transition-colors ${
              index === activeIndex
                ? "border-accent bg-white shadow-md"
                : "border-ink/10 bg-white/60 hover:border-ink/20"
            }`}
          >
            <p className="text-sm leading-relaxed text-muted">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <p className="mt-4 font-display text-lg font-semibold text-ink">
              {testimonial.name}
            </p>
            <p className="text-xs text-muted">
              {testimonial.program} | {testimonial.duration}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
