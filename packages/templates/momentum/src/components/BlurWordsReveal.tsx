"use client";

import { motion } from "framer-motion";

type BlurWordsRevealProps = {
  text: string;
  className?: string;
  wordClassName?: string;
  staggerDelay?: number;
};

/**
 * Splits `text` into words and reveals them one-by-one with a blur +
 * upward-slide + fade, like a typewriter-ish blur-focus effect. Mirrors the
 * live site's final-CTA headline animation.
 */
export default function BlurWordsReveal({
  text,
  className,
  wordClassName,
  staggerDelay = 0.05,
}: BlurWordsRevealProps) {
  const words = text.split(" ");

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
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
            hidden: { opacity: 0.001, filter: "blur(10px)", y: 10 },
            visible: {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
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
