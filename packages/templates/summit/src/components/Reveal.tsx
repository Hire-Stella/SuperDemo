'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Scroll-triggered entrance animation — a 3D perspective tilt: the element
 * starts rotated back on its `X` axis (`rotateX(-14deg)`, as if the top edge
 * were tipped away from the viewer, like a dashboard card swinging up into
 * place) plus a small upward `translateY`, settling flat on a brisk
 * ease-out curve. Distinct from every sibling in this library: aurelia
 * blurs into focus, tavola/vantra are a plain translateY fade, forno
 * bounces with scale/rotate overshoot, kiln snaps up fast and linear, sucre
 * blooms with a scale-up, folio is a stamp-press scale+tilt (a flat 2D
 * `rotate`, not a 3D `rotateX`), pearl is a scale-lift "bubble pop", yokai
 * is a lift-and-scale settle, natsu/brasa use a `clip-path` bloom/wipe, and
 * cryptix/fluxo both use a plain opacity+translateY+scale "materialize" —
 * none of them tilt in 3D space. `perspective` lives on the wrapper
 * (`.summit-reveal`) so the rotation reads as a real tilt rather than a
 * flat skew. No `clip-path` anywhere in this component, so it carries none
 * of the IntersectionObserver-vs-clipped-target bug documented in natsu's
 * and brasa's own `Reveal.tsx` (observing an element clipped to ~0% area
 * never crosses the intersection threshold) — `opacity`/`transform` only,
 * and the observed node is the same node the transform runs on.
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
      className={`summit-reveal ${shown ? 'summit-reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
