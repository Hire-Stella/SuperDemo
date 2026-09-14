"use client";

import { useEffect, useRef, useState } from "react";
import { heroAscii, ramps } from "../defaults";
import { useContent } from "../context";

/* Fragment Mono is a fixed-advance face at 0.6em; the live hero panel is
   595x420 at font-size 6px / line-height 6.6px, which works out to the
   column and row counts below. */
const ADVANCE_RATIO = 0.6;

/**
 * The home hero: the source mp4 is sampled to a canvas every frame and
 * re-emitted as sparse ring glyphs (" ○◐", space = brightest).
 *
 * Falls back to the pre-rendered poster PNG whenever the video cannot
 * play — a decode failure, or prefers-reduced-motion, where we hold a
 * single decoded frame instead of animating.
 */
export default function AsciiVideo({
  className = "",
  width = 595,
  height = 420,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  const { heroAscii, ramps } = useContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [rows, setRows] = useState<string>("");
  const [failed, setFailed] = useState(false);

  const cols = Math.max(1, Math.floor(width / (heroAscii.fontSize * ADVANCE_RATIO)));
  const lines = Math.max(1, Math.floor(height / heroAscii.lineHeight));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = (canvasRef.current ??= document.createElement("canvas"));
    canvas.width = cols;
    canvas.height = lines;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    // No 2D context means no ASCII pass; leaving `rows` empty already
    // renders the poster fallback below.
    if (!ctx) return;

    const ramp = ramps.rings;

    const draw = () => {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, cols, lines);
        const { data } = ctx.getImageData(0, 0, cols, lines);

        let out = "";
        for (let y = 0; y < lines; y++) {
          for (let x = 0; x < cols; x++) {
            const i = (y * cols + x) * 4;
            // Rec. 601 luma, then inverted: bright pixels become spaces.
            const luma =
              (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
            const step = Math.round((1 - luma) * (ramp.length - 1));
            out += ramp[step];
          }
          if (y < lines - 1) out += "\n";
        }
        setRows(out);
      }
      if (!reduceMotion) frameRef.current = requestAnimationFrame(draw);
    };

    const start = () => {
      if (reduceMotion) {
        draw();
        return;
      }
      video.play().catch(() => setFailed(true));
      frameRef.current = requestAnimationFrame(draw);
    };

    if (video.readyState >= 2) start();
    else video.addEventListener("loadeddata", start, { once: true });

    video.addEventListener("error", () => setFailed(true), { once: true });

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      video.removeEventListener("loadeddata", start);
    };
  }, [cols, lines]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width, height, maxWidth: "100%" }}
      role="img"
      aria-label="Animated ASCII rendering of the Stackgrid identity"
    >
      {/* Source frames only — never shown. */}
      <video
        ref={videoRef}
        src={heroAscii.video}
        poster={heroAscii.poster}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        className="pointer-events-none absolute h-px w-px opacity-0"
      />

      {failed || !rows ? (
        /* Decorative poster stand-in, replaced once frames decode. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroAscii.poster}
          alt=""
          aria-hidden
          className="h-full w-full object-contain"
        />
      ) : (
        <>
          <pre
            className="sg-ascii sg-ascii-glow"
            style={{
              fontSize: `${heroAscii.fontSize}px`,
              lineHeight: `${heroAscii.lineHeight}px`,
              color: "var(--sg-text)",
            }}
          >
            {rows}
          </pre>
          <pre
            className="sg-ascii relative"
            style={{
              fontSize: `${heroAscii.fontSize}px`,
              lineHeight: `${heroAscii.lineHeight}px`,
              color: "var(--sg-text)",
            }}
          >
            {rows}
          </pre>
        </>
      )}
    </div>
  );
}
