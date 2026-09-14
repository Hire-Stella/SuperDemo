"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * The scroll-in treatment used on essentially every block of the live
 * site: 14px rise + fade, 0.7s on the shared easing curve, fired once
 * when the element crosses into view.
 *
 * The transition itself lives in `.sg-reveal` (globals.css) and is
 * driven by the `data-shown` attribute, so a user with
 * prefers-reduced-motion simply sees the final state.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  style,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  /** stagger, in ms */
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;

    // Anything already on screen at mount (the hero) shows immediately.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      data-shown={shown ? "true" : "false"}
      className={`sg-reveal ${className}`}
      {...rest}
      // Merged last so a caller's `style` cannot drop the stagger.
      style={{ ...style, "--sg-reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
