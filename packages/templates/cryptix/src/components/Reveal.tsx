'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Scroll-triggered entrance animation — a soft "materialize" rise (opacity +
 * translateY + a slight scale-up from 0.96) on a slow ease-out-expo curve,
 * this template's own animation language (see theme.css's `.cryptix-reveal`).
 * Distinct from every sibling: aurelia blurs into focus, tavola is a plain
 * translateY fade, forno bounces with scale/rotate overshoot, kiln snaps up
 * fast and linear, natsu blooms from a circular clip-path, brasa wipes up
 * from a clip-path inset. This one never touches `clip-path` at all — plain
 * `opacity`/`transform` only — so the IntersectionObserver-vs-clipped-target
 * self-defeat bug documented in natsu's and brasa's `Reveal.tsx` (observing
 * an element whose own hidden state clips it to ~0% area, so it can never
 * cross the intersection threshold) does not apply here: the observed node
 * and the animated node are the same element on purpose, and its geometry
 * never collapses.
 *
 * An IntersectionObserver runs the animation once per element, with no
 * motion library required.
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
    <Tag
      ref={ref}
      className={`cryptix-reveal ${shown ? 'cryptix-reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
