'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Scroll-triggered entrance animation — a bottom-up `clip-path` wipe rather
 * than a plain slide (tavola), a bounce (forno) or a blur (aurelia), this
 * template's own animation language (see theme.css's `.brasa-reveal`). An
 * IntersectionObserver runs the animation once per element, with no motion
 * library required.
 *
 * The observed node and the clipped node are deliberately not the same
 * element. `.brasa-reveal`'s hidden state is `clip-path: inset(0 0 100% 0)`,
 * and Chromium (and per spec) measures an IntersectionObserver target
 * against its own clipped geometry — an element clipped to zero height has
 * ~zero observable area, so it can never cross the threshold and the
 * callback never fires. Observing an unclipped outer wrapper and animating
 * clip-path on an inner child avoids that self-defeating loop. `h-full` on
 * the inner child matters only when a caller's `className` gives the
 * wrapper an explicit size (an `aspect-*` box around a `fill` image,
 * elsewhere in this template) — it resolves to `auto` against an
 * auto-height wrapper, so plain text content is unaffected.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className}>
      <div
        className={`brasa-reveal h-full w-full ${shown ? 'brasa-reveal-in' : ''}`}
        style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      >
        {children}
      </div>
    </Tag>
  );
}
