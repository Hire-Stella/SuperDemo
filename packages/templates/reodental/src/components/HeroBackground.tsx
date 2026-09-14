"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * The live hero's background settles from a subtle `scale(1.03)` down to
 * `scale(1)` on initial mount — a one-time Ken-Burns-style load-in zoom, not
 * a scroll-triggered reveal. `initial`/`animate` (no `whileInView`) so it
 * always plays once, regardless of scroll position.
 */
export default function HeroBackground({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ scale: 1.03 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-40"
      />
    </motion.div>
  );
}
