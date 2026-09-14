"use client";

import { useEffect, useState } from "react";

import { typewriterPhrases } from "../defaults";
import { useContent } from "../context";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Small typing-effect UI snippet used in the "Real-time intelligence" row —
 * types out a short phrase, pauses, deletes it, and moves to the next one.
 * Plain setTimeout-driven state, no animation library. Reduced-motion safe:
 * simply cycles the full phrase text without the type/delete animation.
 */
export function TypewriterLine() {
  const { typewriterPhrases } = useContent();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const timeout = setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % typewriterPhrases.length);
      }, 2200);
      return () => clearTimeout(timeout);
    }

    const full = typewriterPhrases[phraseIndex];
    const atFullLength = !deleting && text.length === full.length;
    const speed = deleting ? 28 : atFullLength ? 1100 : 48;

    const timeout = setTimeout(() => {
      if (!deleting) {
        if (text.length < full.length) {
          setText(full.slice(0, text.length + 1));
        } else {
          setDeleting(true);
        }
      } else if (text.length > 0) {
        setText(full.slice(0, text.length - 1));
      } else {
        setDeleting(false);
        setPhraseIndex((i) => (i + 1) % typewriterPhrases.length);
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, deleting, phraseIndex]);

  const displayText = prefersReducedMotion() ? typewriterPhrases[phraseIndex] : text;

  return (
    <span className="text-sm text-zv-ink">
      {displayText}
      <span className="zv-caret" aria-hidden="true">
        |
      </span>
    </span>
  );
}
