'use client';

/**
 * App composites.
 *
 * shadcn primitives live in `components/ui/*` and are owned source — edit them
 * freely. This file is the layer above: the handful of compound pieces this
 * dashboard uses repeatedly, built *on* those primitives so theming stays in one
 * place (the CSS variables in globals.css).
 *
 * Pages import from here rather than reaching for primitives directly, which is
 * what keeps a 10-page operations app visually consistent.
 */

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card as ShadCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge as ShadBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table as ShadTable,
  TableCell,
  TableHead,
} from '@/components/ui/table';
import { Avatar as ShadAvatar, AvatarFallback } from '@/components/ui/avatar';

/* Re-exported so pages have one import site for everything. */
export { Button } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Label } from '@/components/ui/label';
export { Separator } from '@/components/ui/separator';
export { Skeleton } from '@/components/ui/skeleton';
export { cn } from '@/lib/utils';

/* ------------------------------- Panel/Card ------------------------------- */

/**
 * shadcn's Card is fully composable (CardHeader/CardTitle/CardContent). Nearly
 * every card in this app is the same shape — title, optional subtitle, optional
 * right-aligned action, then content — so this wraps that one shape rather than
 * repeating five elements on every page.
 *
 * Reach for the shadcn primitives directly when a card genuinely differs.
 */
export function Card({
  children,
  className,
  title,
  subtitle,
  action,
  contentClassName,
}: {
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  contentClassName?: string;
}) {
  const hasHeader = Boolean(title || action);
  return (
    <ShadCard className={cn('gap-0 overflow-hidden py-0', className)}>
      {hasHeader && (
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b px-4 py-3">
          <div className="min-w-0">
            {title && <CardTitle className="text-sm font-semibold">{title}</CardTitle>}
            {subtitle && (
              <CardDescription className="mt-0.5 text-xs">{subtitle}</CardDescription>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={cn('p-0', contentClassName)}>{children}</CardContent>
    </ShadCard>
  );
}

/* --------------------------------- Metric --------------------------------- */

/**
 * A metric tile.
 *
 * `hint` is not decoration: "82%" on a dashboard invites the wrong conclusion
 * without "of calls resolved without an agent".
 */
export function Metric({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'brand' | 'ai' | 'live' | 'warn' | 'danger';
  icon?: ReactNode;
}) {
  const toneClass = {
    default: 'text-foreground',
    brand: 'text-primary',
    ai: 'text-ai',
    live: 'text-live',
    warn: 'text-warn',
    danger: 'text-destructive',
  }[tone];

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
      </div>
      <div className={cn('tnum mt-1.5 text-2xl font-semibold tracking-tight', toneClass)}>
        {value}
      </div>
      {hint && (
        <p className="mt-1 text-xs leading-snug text-muted-foreground/80">{hint}</p>
      )}
    </div>
  );
}

/* --------------------------------- Badge ---------------------------------- */

/**
 * shadcn Badge plus an optional status dot — used constantly for call state and
 * agent presence, where the dot carries the "live" signal.
 */
export function Badge({
  children,
  className,
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <ShadBadge
      variant="secondary"
      className={cn('gap-1.5 rounded-full font-medium whitespace-nowrap', className)}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />}
      {children}
    </ShadBadge>
  );
}

/* --------------------------------- Select --------------------------------- */

/**
 * A native `<select>` styled with the shadcn tokens.
 *
 * Deliberate: shadcn's Radix Select is the right choice for a rich, searchable
 * picker, but this app's selects are short option lists inside dense table rows
 * and a docked softphone. Native wins there — real keyboard behaviour, the OS
 * picker on mobile, no portal fighting the softphone's z-index, and it works
 * inside a `<td>` without layout surprises.
 *
 * `components/ui/select.tsx` is installed and available wherever the richer
 * behaviour is worth it.
 */
export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      data-slot="native-select"
      {...rest}
      className={cn(
        'h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs',
        'transition-[color,box-shadow] outline-none',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:bg-input/30',
        className,
      )}
    >
      {children}
    </select>
  );
}

/* --------------------------------- Avatar --------------------------------- */

/**
 * Initials avatar. Built on shadcn's Avatar so sizing and shape stay consistent;
 * the per-agent colour comes from the seed so the same person is always the same
 * colour across the live board, the inbox and the softphone.
 */
export function Avatar({
  name,
  color,
  size = 28,
}: {
  name: string | null | undefined;
  color?: string;
  size?: number;
}) {
  const text = (name ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <ShadAvatar className="shrink-0" style={{ width: size, height: size }}>
      <AvatarFallback
        className="font-semibold text-white"
        style={{ background: color ?? 'var(--primary)', fontSize: size * 0.38 }}
      >
        {text}
      </AvatarFallback>
    </ShadAvatar>
  );
}

/* ------------------------------ Empty / Load ------------------------------ */

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted-foreground/50">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {hint && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{hint}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label ?? 'Loading…'}
    </div>
  );
}

/** Skeleton rows, so a table doesn't collapse and reflow as data lands. */
export function SkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton
              key={c}
              className="h-4 flex-1"
              style={{ maxWidth: c === 0 ? '30%' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Table ---------------------------------- */

/**
 * Wide tables scroll inside their own container, so the page body never scrolls
 * horizontally — the shadcn Table already wraps itself for this.
 */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <ShadTable className={cn('text-sm', className)}>{children}</ShadTable>;
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <TableHead
      className={cn('h-auto border-b px-4 py-2.5 text-xs font-semibold whitespace-nowrap', className)}
    >
      {children}
    </TableHead>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <TableCell className={cn('px-4 py-2.5 align-middle', className)}>{children}</TableCell>;
}

/* ------------------------------- Mock notice ------------------------------ */

/**
 * Marks a surface whose external system is simulated.
 *
 * A deliberate honesty device: anyone demoing or reviewing can see at a glance
 * which parts are real, so nothing gets over-claimed to a client by accident.
 * Amber rather than red — this is information, not a failure.
 */
export function MockNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-xs leading-relaxed">
      <span className="mt-px font-semibold text-warn">Simulated</span>
      <span className="text-foreground/80">{children}</span>
    </div>
  );
}
