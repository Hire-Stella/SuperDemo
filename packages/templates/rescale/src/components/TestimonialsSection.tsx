"use client";

import Image from "next/image";

import { testimonials } from "../defaults";
import { Reveal } from "./Reveal";
import { useContent } from "../context";

export function TestimonialsSection() {
  const { testimonials } = useContent();
  return (
    <section id="client-insights" className="rs-gradient-soft py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="rs-eyebrow">Client Insights</span>
          <h2 className="rs-heading mt-3 text-4xl text-rs-ink sm:text-5xl">
            <span className="rs-gradient-text">What Our</span> Clients Say
          </h2>
          <p className="mt-4 text-base text-rs-muted">
            How our clients transform growth with advanced solutions. And here&rsquo;s exactly how
            they did it.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial, i) => (
            <Reveal
              key={testimonial.name}
              delay={i * 100}
              as="figure"
              className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-rs-ink">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image src={testimonial.photo} alt={testimonial.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rs-ink">{testimonial.name}</p>
                  <p className="text-xs text-rs-muted">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
