"use client";

import { motion, Variants } from "framer-motion";

// Replicates the source site's giant-wordmark entrance: each letter scales
// up from 0 individually, left to right, very fast (~250ms total) rather
// than the whole word fading/sliding in as one block.
const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.028, delayChildren: 0.05 },
  },
};

const letter: Variants = {
  hidden: { opacity: 0, scale: 0.2 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: [0.34, 1.56, 0.64, 1] },
  },
};

export default function StaggerText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={container}
      className={className}
      style={{ display: "inline-block" }}
    >
      {[...text].map((ch, i) => (
        <motion.span key={i} variants={letter} style={{ display: "inline-block" }}>
          {ch}
        </motion.span>
      ))}
    </motion.span>
  );
}
