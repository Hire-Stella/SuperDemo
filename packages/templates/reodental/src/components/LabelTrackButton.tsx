"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const MotionLink = motion.create(Link);

type LabelTrackButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  icon?: ReactNode;
};

/**
 * Recreates the source template's "Label Track" button hover: on hover the
 * current label slides up out of view while an identical duplicate label
 * slides up into place from below — a vertical mask swap, not a plain
 * color change.
 */
export default function LabelTrackButton({
  href,
  children,
  variant = "primary",
  className = "",
  icon,
}: LabelTrackButtonProps) {
  const base =
    "relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-medium transition-colors";
  const palette =
    variant === "primary"
      ? "bg-ink text-cream hover:bg-ink-soft"
      : "bg-transparent text-ink border border-border-strong hover:border-ink";

  return (
    <MotionLink
      href={href}
      className={`${base} ${palette} ${className}`}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <span className="relative inline-block h-[1.2em] overflow-hidden">
        <motion.span
          className="flex flex-col"
          variants={{ rest: { y: 0 }, hover: { y: "-1.2em" } }}
          transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
        >
          <span className="block h-[1.2em] leading-[1.2em]">{children}</span>
          <span className="block h-[1.2em] leading-[1.2em]" aria-hidden="true">
            {children}
          </span>
        </motion.span>
      </span>
      {icon}
    </MotionLink>
  );
}
