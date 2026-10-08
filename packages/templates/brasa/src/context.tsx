'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { TemplateProps } from './content';

/**
 * The template's content, supplied rather than imported.
 *
 * The clone had every component do `import { X } from "@/lib/data"`, which is
 * right for a one-off site and useless as a library: the copy is fixed at
 * module scope and no caller can change it.
 *
 * Context rather than props threaded through every component, because the
 * point of the port is that the design survives it. Swapping one import line
 * leaves every body — class names, animations, measurements — exactly as
 * cloned, and an untouched body cannot drift from its source.
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
  if (!ctx) throw new Error('brasa: components must render inside the template root');
  return ctx;
}
