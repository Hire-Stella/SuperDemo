"use client";

import { heroAscii } from "../defaults";

/**
 * Renders one of the pre-baked artwork strings from lib/ascii-art.
 *
 * The live site paints each ASCII block twice: a blur(11px) copy sits
 * behind the crisp one to give the glyphs their soft bloom. `.sg-ascii`
 * and `.sg-ascii-glow` in globals.css hold that treatment.
 */
export default function Ascii({
  art,
  color = "var(--sg-ascii-grey)",
  fontSize = heroAscii.fontSize,
  lineHeight = heroAscii.lineHeight,
  glow = true,
  className = "",
  label,
}: {
  art: string;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  glow?: boolean;
  className?: string;
  /** Supply only when the artwork carries meaning of its own. */
  label?: string;
}) {
  const type = { fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px`, color };

  return (
    <div
      className={`relative ${className}`}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {glow && (
        <pre className="sg-ascii sg-ascii-glow" style={type}>
          {art}
        </pre>
      )}
      <pre className="sg-ascii relative" style={type}>
        {art}
      </pre>
    </div>
  );
}
