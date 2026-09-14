"use client";

import { ChevronDown } from "lucide-react";

/**
 * Circular scroll-down cue, centered below the hero's CTA button row.
 * Smooth-scrolls to the next section on click; purely a visual affordance
 * otherwise (matches the screenshot's small circular chevron button).
 */
export default function ScrollDownIndicator() {
  function handleClick() {
    const hero = document.getElementById("hero");
    const next = hero?.nextElementSibling;
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      aria-label="Scroll down"
      onClick={handleClick}
      className="mt-10 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--fg)]/20 bg-white/60 text-[var(--fg)] backdrop-blur transition-transform hover:scale-110 animate-bounce"
    >
      <ChevronDown size={20} />
    </button>
  );
}
