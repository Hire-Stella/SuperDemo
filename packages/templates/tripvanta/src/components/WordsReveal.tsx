"use client";

import { motion } from "framer-motion";

type WordsRevealProps = {
  text: string;
  className?: string;
  wordClassName?: string;
  staggerDelay?: number;
  /** Animate immediately on mount instead of on scroll -- use for the
   * above-the-fold hero headline, which should not wait for whileInView. */
  animateOnMount?: boolean;
};

/**
 * Splits `text` into words and reveals them one-by-one, sliding in
 * horizontally: opacity:0.001, translateX(-40px) -> opacity:1, translateX(0)
 * (measured 83 occurrences on the live site's headline-style texts -- a
 * horizontal slide, not a blur, unlike the vertical blur reveal used in
 * sibling clones in this pipeline). Used for the hero headline and other
 * large headline text (section titles, the About page's belief heading).
 */
export default function WordsReveal({
  text,
  className,
  wordClassName,
  staggerDelay = 0.08,
  animateOnMount = false,
}: WordsRevealProps) {
  const words = text.split(" ");

  const containerProps = animateOnMount
    ? { initial: "hidden", animate: "visible" }
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, margin: "-100px" },
      };

  return (
    <motion.span
      className={className}
      {...containerProps}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay },
        },
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className={`inline-block ${wordClassName ?? ""}`}
          variants={{
            hidden: { opacity: 0.001, x: -40, y: 0, scale: 1 },
            visible: {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}
