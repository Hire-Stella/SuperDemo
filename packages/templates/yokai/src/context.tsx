'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { TemplateProps } from './content';

/**
 * The template's content, supplied rather than imported.
 *
 * Context rather than props threaded through every component, because the
 * point of a library of templates is that the design survives swapping the
 * content in — see brasa's own context.tsx for the fuller version of this
 * reasoning.
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
  if (!ctx) throw new Error('yokai: components must render inside the template root');
  return ctx;
}
