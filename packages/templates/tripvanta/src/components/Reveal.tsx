"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
  as?: "div" | "li";
};

/**
 * Scroll-reveal wrapper. Wanderloom's most common measured pattern (24
 * occurrences) combines a fade + upward slide + scale-up:
 * opacity:0, translateY(30px) scale(0.9) -> opacity:1, translateY(0) scale(1)
 * Pass `scale={1}` to get the plain fade-up variant (20 occurrences) with no
 * scale change, and `y` to use one of the larger measured offsets
 * (40 / 60 / 80px) for bigger hero-scale elements/section containers.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 30,
  scale = 0.9,
  as = "div",
}: RevealProps) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: { opacity: 0, y, scale },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}

export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  y = 30,
  scale = 0.9,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  scale?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y, scale },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Icon/badge pop-in: opacity:0 scale(0.6) -> opacity:1 scale(1) (18 occurrences). */
export function RevealPop({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Two-column slide-ins: translateX(-60px) / translateX(60px), used for
 * paired left/right elements (e.g. the hero's "Plan Your Trip" / "Explore
 * Now" button pair).
 */
export function RevealSlide({
  children,
  className,
  direction = "left",
  delay = 0,
  distance = 60,
}: {
  children: ReactNode;
  className?: string;
  direction?: "left" | "right";
  delay?: number;
  distance?: number;
}) {
  const x = direction === "left" ? -distance : distance;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
