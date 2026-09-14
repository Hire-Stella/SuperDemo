"use client";

import { useEffect, useRef, useState } from "react";
import { ramps } from "../defaults";

const ADVANCE_RATIO = 0.6;

/**
 * Converts a bitmap to ASCII once, on mount.
 *
 * The live site uses this treatment for the testimonial portraits and
 * the team grid — the 70-step luminance ramp against a flat grey — and
 * for the "hand reaching right" plate in the solution section.
 *
 * `invert` matches the live behaviour on light artwork: the portraits
 * read as dark glyphs on the page background, so bright pixels have to
 * become the sparse end of the ramp.
 */
export default function AsciiImage({
  src,
  alt,
  ramp = ramps.dense,
  color = "var(--sg-ascii-grey)",
  fontSize = 6,
  lineHeight = 6.6,
  width = 300,
  height = 300,
  invert = true,
  glow = false,
  className = "",
}: {
  src: string;
  alt: string;
  ramp?: string;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  width?: number;
  height?: number;
  invert?: boolean;
  glow?: boolean;
  className?: string;
}) {
  const [rows, setRows] = useState("");
  const [failed, setFailed] = useState(false);
  const aliveRef = useRef(true);

  const cols = Math.max(1, Math.floor(width / (fontSize * ADVANCE_RATIO)));
  const lines = Math.max(1, Math.floor(height / lineHeight));

  useEffect(() => {
    aliveRef.current = true;

    const image = new Image();
    image.decoding = "async";
    image.src = src;

    image.onerror = () => {
      if (aliveRef.current) setFailed(true);
    };

    image.onload = () => {
      if (!aliveRef.current) return;

      const canvas = document.createElement("canvas");
      canvas.width = cols;
      canvas.height = lines;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        setFailed(true);
        return;
      }

      // Flatten onto white so transparent PNG regions read as "empty"
      // rather than as pure black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cols, lines);
      ctx.drawImage(image, 0, 0, cols, lines);

      const { data } = ctx.getImageData(0, 0, cols, lines);
      let out = "";
      for (let y = 0; y < lines; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const luma =
            (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          const value = invert ? 1 - luma : luma;
          out += ramp[Math.round(value * (ramp.length - 1))];
        }
        if (y < lines - 1) out += "\n";
      }
      setRows(out);
    };

    return () => {
      aliveRef.current = false;
    };
  }, [src, ramp, cols, lines, invert]);

  const type = { fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px`, color };

  if (failed) {
    return (
      /* The ASCII pass is the intended presentation; this is the
         fallback for a bitmap that failed to decode. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`object-cover ${className}`}
        style={{ width, height, maxWidth: "100%" }}
      />
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width, height, maxWidth: "100%" }}
      role="img"
      aria-label={alt}
    >
      {glow && rows && (
        <pre className="sg-ascii sg-ascii-glow" style={type}>
          {rows}
        </pre>
      )}
      <pre className="sg-ascii relative" style={type}>
        {rows}
      </pre>
    </div>
  );
}
