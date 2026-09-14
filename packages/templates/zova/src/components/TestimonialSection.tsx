"use client";

import Image from "next/image";

import { testimonial } from "../defaults";
import { useContent } from "../context";

export function TestimonialSection() {
  const { testimonial } = useContent();
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="grid items-center gap-10 rounded-3xl border border-zv-line bg-zv-card p-8 sm:p-12 lg:grid-cols-[220px_1fr]">
          <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-2xl border border-zv-line bg-white lg:mx-0 lg:h-56 lg:w-full">
            <Image
              src={testimonial.photo}
              alt="Professional man portrait"
              fill
              sizes="220px"
              className="object-cover"
            />
          </div>
          <div>
            <span className="zv-heading text-6xl leading-none text-zv-ink/15" aria-hidden="true">
              &ldquo;
            </span>
            <p className="zv-heading -mt-4 text-xl leading-relaxed text-zv-ink sm:text-2xl">
              {testimonial.quote}
            </p>
            <p className="mt-6 text-sm font-medium text-zv-ink">
              {testimonial.name} <span className="text-zv-muted">— {testimonial.role}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
