"use client";

import { useEffect, useState } from "react";
import { ramps } from "../defaults";

/**
 * The /about hero readout.
 *
 * The silhouette is fixed (ABOUT_CIRCUIT_MASK, where `#` marks an inked
 * cell) while the glyphs inside it shimmer through a hex ramp — sampling
 * the live DOM 700ms apart showed the shape holding and the characters
 * churning. We re-roll the inked cells on an interval rather than every
 * animation frame; the live cadence is a slow flicker, not a strobe.
 */
export default function AsciiShimmer({
  mask,
  ramp = ramps.hex,
  color = "var(--sg-ascii-blue)",
  fontSize = 8,
  lineHeight = 8.8,
  intervalMs = 90,
  className = "",
  label,
}: {
  mask: string;
  ramp?: string;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  intervalMs?: number;
  className?: string;
  label?: string;
}) {
  const [frame, setFrame] = useState(() => roll(mask, ramp));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => setFrame(roll(mask, ramp)), intervalMs);
    return () => window.clearInterval(id);
  }, [mask, ramp, intervalMs]);

  const type = { fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px`, color };

  return (
    <div
      className={`relative ${className}`}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <pre className="sg-ascii sg-ascii-glow" style={type}>
        {frame}
      </pre>
      <pre className="sg-ascii relative" style={type}>
        {frame}
      </pre>
    </div>
  );
}

/** Replace every inked cell of the mask with a random ramp glyph. */
function roll(mask: string, ramp: string) {
  let out = "";
  for (const char of mask) {
    out += char === "#" ? ramp[Math.floor(Math.random() * ramp.length)] : char;
  }
  return out;
}
