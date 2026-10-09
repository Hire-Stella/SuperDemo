'use client';

/**
 * App composites — built on @hire-stella/ui.
 *
 * This is the layer pages import from. Each piece keeps the API it had on shadcn, so
 * pages migrated to the HireStella design system without touching their call sites;
 * the visuals, tokens and behaviour now come from the brand library.
 *
 * Strict brand rules apply here: orange marks the one thing that needs action, Mist
 * marks handoff / AI-handled work, everything else is neutral — and every state is
 * carried by an icon or a label, never by colour alone.
 */

import type { ReactNode } from 'react';
import {
  Avatar as HsAvatar,
  EmptyState as HsEmptyState,
  Loader,
  Skeleton as HsSkeleton,
} from '@hire-stella/ui';
import { cn } from '@/lib/utils';

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
 * The one card shape this app repeats: title, optional subtitle, optional right-aligned action,
 * then content. A HireStella glass panel with a hairline header.
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
    <section className={cn('hs-sd-card', className)}>
      {hasHeader && (
        <header className="hs-sd-card__head">
          <div className="min-w-0">
            {title && <h3 className="hs-sd-card__title">{title}</h3>}
            {subtitle && <p className="hs-sd-card__subtitle">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn('hs-sd-card__body', contentClassName)}>{children}</div>
    </section>
  );
}

/* --------------------------------- Metric --------------------------------- */

/**
 * A metric tile (HireStella stat tile). `hint` is not decoration: "82%" invites the wrong
 * conclusion without "of calls resolved without an agent".
 *
 * Strict brand: `warn`, `danger` and `brand` are the tones that ask for attention, so they
 * carry the orange emphasis (border + label). `ai` and `live` are calm states and render
 * neutral. Use emphasis on one tile per row at most.
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
  const emphasis = tone === 'warn' || tone === 'danger' || tone === 'brand';
  return (
    <div className={cn('hs-stat hs-sd-metric', emphasis && 'hs-stat--emphasis')}>
      <div className="hs-stat__body">
        <div className="flex items-center justify-between gap-2">
          <span className="hs-stat__label">{label}</span>
          {icon && (
            <span className="hs-sd-metric__icon" aria-hidden>
              {icon}
            </span>
          )}
        </div>
        <span className="hs-stat__value tnum">{value}</span>
        {hint && <span className="hs-stat__caption">{hint}</span>}
      </div>
    </div>
  );
}

/* --------------------------------- Badge ---------------------------------- */

/**
 * A status chip with an optional dot — used for call state and agent presence. Callers pass
 * token classes (`bg-live-soft text-live`, dot `bg-live`), which resolve to the brand's
 * neutral / Mist / orange states through globals.css.
 */
export function Badge({
  children,
  className,
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: string | false;
}) {
  return (
    <span className={cn('hs-sd-badge', className)}>
      {dot && <span className={cn('size-1.5 shrink-0 rounded-full', dot)} aria-hidden />}
      {children}
    </span>
  );
}

/* --------------------------------- Select --------------------------------- */

/**
 * A native `<select>` in HireStella's control style. Native on purpose: these are short lists in
 * dense table rows and a docked softphone — real keyboard behaviour, the OS picker on mobile, no
 * portal fighting the softphone's z-index.
 */
export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select data-slot="native-select" {...rest} className={cn('hs-sd-select', className)}>
      {children}
    </select>
  );
}

/* --------------------------------- Avatar --------------------------------- */

/**
 * Initials avatar for people (HireStella Avatar). One neutral colour for everyone, per the brand
 * book — identity comes from the initials and the name beside them. `color` is accepted for API
 * compatibility and ignored.
 */
export function Avatar({
  name,
  size = 28,
}: {
  name: string | null | undefined;
  color?: string;
  size?: number;
}) {
  return (
    <HsAvatar
      name={name ?? '?'}
      size={32}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    />
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
    <HsEmptyState
      className="hs-sd-empty"
      icon={icon}
      title={title}
      description={hint}
      action={action}
    />
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-10 text-sm text-muted-foreground">
      <Loader label={label ?? 'Loading'} />
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
            <HsSkeleton
              key={c}
              height={14}
              style={{ flex: 1, maxWidth: c === 0 ? '30%' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Table ---------------------------------- */

/** HireStella table. Wide tables scroll inside their own container; the page never scrolls sideways. */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="hs-table-wrap">
      <table className={cn('hs-table hs-sd-table', className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('whitespace-nowrap', className)}>{children}</th>;
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  /** For full-width rows: an expander under a row, or an empty-state message. */
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={className}>
      {children}
    </td>
  );
}

/* ------------------------------- Mock notice ------------------------------ */

/**
 * Marks a surface whose external system is simulated — an honesty device so nothing is
 * over-claimed in a demo. Information, not a failure: a neutral HireStella notice.
 */
export function MockNotice({ children }: { children: ReactNode }) {
  return (
    <div className="hs-sd-mock" role="note">
      <span className="hs-sd-mock__label">Simulated</span>
      <span>{children}</span>
    </div>
  );
}
