'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Scroll-triggered entrance animation — a soft rise-and-settle on a slight
 * scale, rather than aurelia's blur-to-focus, tavola's plain fade, forno's
 * bounce, kiln's brisk snap or natsu's circular clip-path bloom (see
 * theme.css's `.fluxo-reveal` for why). Only `opacity` and `transform`
 * (`translateY` + `scale`) are animated — no `clip-path` or other
 * layout-collapsing property sits on the observed element, so there is no
 * risk of the natsu/brasa bug where an element's own clipped-to-~0% box
 * defeats the IntersectionObserver that is supposed to reveal it (see
 * natsu's `Reveal.tsx` doc comment for that failure mode in full). One
 * element, one observer, one transform — nothing to split apart here.
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
      className={`fluxo-reveal ${shown ? 'fluxo-reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
