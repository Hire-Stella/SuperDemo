import type { ReactNode } from "react";

/**
 * The customer-logo band. The track holds the item list twice and
 * translates -50%, so the loop is seamless; hovering pauses it and
 * prefers-reduced-motion stops it outright (both in globals.css).
 *
 * Edges are masked so items fade out instead of clipping hard.
 */
export default function Marquee({
  items,
  durationSeconds = 40,
  className = "",
}: {
  items: ReactNode[];
  durationSeconds?: number;
  className?: string;
}) {
  const run = [...items, ...items];

  return (
    <div
      className={`sg-marquee relative overflow-hidden ${className}`}
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div
        className="sg-marquee-track"
        style={{ "--sg-marquee-duration": `${durationSeconds}s` } as React.CSSProperties}
      >
        {run.map((item, index) => (
          <div
            key={index}
            // The duplicated half is decorative; only the first pass is
            // exposed to assistive tech.
            aria-hidden={index >= items.length}
            className="flex shrink-0 items-center px-8 text-[15px] whitespace-nowrap text-[var(--sg-text-muted)]"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
