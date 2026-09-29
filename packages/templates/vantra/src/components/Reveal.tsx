'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Scroll-triggered entrance animation — a soft rise-and-fade, matching the
 * source's own Framer "appear" effect (every band on the source page enters
 * on scroll via opacity + a small upward translate; confirmed by scrolling
 * the source live, since the effect is runtime spring physics with no fixed
 * curve in the page's static HTML/CSS — see theme.css's `.vantra-reveal` for
 * the plain-CSS curve hand-matched in its place). Plain opacity/transform,
 * not clip-path, so this template carries none of the clip-path +
 * IntersectionObserver self-defeating-target bug natsu/brasa had to work
 * around: the observed node and the animated node are the same element and
 * that is safe here.
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
      className={`vantra-reveal ${shown ? 'vantra-reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
