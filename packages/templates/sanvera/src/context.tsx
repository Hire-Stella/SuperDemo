'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SanveraContent } from './content';

/**
 * The template's content, supplied rather than imported.
 *
 * The original clone had every component do `import { HERO } from "@/lib/data"`,
 * which is right for a one-off site and useless as a library: the copy is baked
 * in at module scope and no caller can change it.
 *
 * Context rather than props threaded through ten components, because the point
 * of this port is to preserve the design exactly. Swapping one import line per
 * component leaves every body — every class name, every animation, every
 * measurement — untouched, and an untouched body cannot drift from the source
 * it was cloned from. Prop-drilling would have meant editing markup in ten
 * files to pass values down, which is ten chances to change the thing we are
 * trying to keep.
 */
const SanveraContext = createContext<SanveraContent | null>(null);

export function SanveraProvider({
  content,
  children,
}: {
  content: SanveraContent;
  children: ReactNode;
}) {
  return <SanveraContext.Provider value={content}>{children}</SanveraContext.Provider>;
}

export function useSanvera(): SanveraContent {
  const ctx = useContext(SanveraContext);
  if (!ctx) {
    throw new Error('Sanvera components must be rendered inside <SanveraTemplate>');
  }
  return ctx;
}
