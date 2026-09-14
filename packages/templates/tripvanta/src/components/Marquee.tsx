"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type MarqueeProps = {
  children: ReactNode;
  className?: string;
  /** Seconds for one full loop -- lower is faster. */
  duration?: number;
  reverse?: boolean;
};

/**
 * Infinite horizontally-scrolling marquee (measured on the live site as a
 * looped/doubled `<ul>` with `transform:translateX(...)`, e.g. the "Our
 * Trusted Travel Partners" logo strip and the gallery page's photo strip).
 * The children are rendered twice back-to-back and animated with a
 * continuous `translateX` loop so the seam is invisible.
 */
export default function Marquee({ children, className, duration = 24, reverse = false }: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="flex w-max items-center"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        <div className="flex shrink-0 items-center gap-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
