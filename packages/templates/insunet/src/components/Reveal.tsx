'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Scroll-triggered entrance animation — a calm, no-overshoot rise rather
 * than kiln's fast snap, sucre's soft scale bloom or natsu's clip-path
 * bounce (see theme.css's `.insunet-reveal` for why). Plain opacity and
 * `translateY`, never a layout-collapsing property like `clip-path`, so the
 * observed node and the animated node are safely the same element — no risk
 * of the IntersectionObserver-vs-clipped-geometry bug natsu's and brasa's
 * own `Reveal` components each had to design around for their own
 * clip-path reveals. An IntersectionObserver runs the animation once per
 * element, with no motion library required.
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
      className={`insunet-reveal ${shown ? 'insunet-reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
