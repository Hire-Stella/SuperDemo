"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "../components/Reveal";
import { TESTIMONIALS } from "../defaults";
import { useContent } from "../context";

export default function TestimonialCarousel() {
  const { TESTIMONIALS } = useContent();
  const [index, setIndex] = useState(0);
  const testimonial = TESTIMONIALS[index];

  function next() {
    setIndex((i) => (i + 1) % TESTIMONIALS.length);
  }
  function prev() {
    setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  return (
    <Reveal y={20} scale={1} className="mx-auto max-w-2xl text-center">
      <div className="relative min-h-[220px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-lg italic text-[var(--fg)]">&ldquo;{testimonial.quote}&rdquo;</p>
            <p className="mt-6 font-display text-[var(--fg)]">{testimonial.name}</p>
            <p className="text-sm text-[var(--muted)]">{testimonial.location}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          aria-label="Previous testimonial"
          onClick={prev}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fg)] transition-transform hover:scale-110"
        >
          <Image src="/t/tripvanta/images/arrow-left.svg" alt="" width={16} height={16} />
        </button>
        <button
          aria-label="Next testimonial"
          onClick={next}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--fg)] transition-transform hover:scale-110"
        >
          <Image src="/t/tripvanta/images/arrow-right.svg" alt="" width={16} height={16} />
        </button>
      </div>
    </Reveal>
  );
}
