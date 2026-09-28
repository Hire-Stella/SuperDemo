'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { TemplateProps } from './content';

/**
 * The template's content, supplied rather than imported.
 *
 * Context rather than props threaded through every component, because the
 * point of a shared template library is that the design survives being
 * handed someone else's content: swapping one provider value leaves every
 * body — class names, animations, measurements — exactly as designed, and
 * an untouched body cannot drift from its design.
 */
const Ctx = createContext<TemplateProps | null>(null);

export function ContentProvider({
  content,
  children,
}: {
  content: TemplateProps;
  children: ReactNode;
}) {
  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}

export function useContent(): TemplateProps {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('pearl: components must render inside the template root');
  return ctx;
}
