'use client';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/* --------------------------------- Card ---------------------------------- */

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
}: {
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn('rounded-card border border-border bg-surface', className)}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/* -------------------------------- Metric --------------------------------- */

/**
 * A metric tile.
 *
 * `hint` exists because a bare number on a dashboard invites the wrong
 * conclusion — "82%" means nothing without "of calls resolved without an agent".
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
  tone?: 'default' | 'ai' | 'live' | 'warn' | 'danger';
  icon?: ReactNode;
}) {
  const toneClass = {
    default: 'text-fg',
    ai: 'text-ai',
    live: 'text-live',
    warn: 'text-warn',
    danger: 'text-danger',
  }[tone];

  return (
    <div className="rounded-card border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        {icon && <span className="text-faint">{icon}</span>}
      </div>
      <div className={cn('tnum mt-1.5 text-2xl font-semibold tracking-tight', toneClass)}>
        {value}
      </div>
      {hint && <p className="mt-1 text-xs leading-snug text-faint">{hint}</p>}
    </div>
  );
}

/* --------------------------------- Badge --------------------------------- */

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
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        'bg-surface-2 text-muted',
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />}
      {children}
    </span>
  );
}

/* -------------------------------- Button --------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'live';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const variants = {
    primary: 'bg-brand text-brand-fg hover:opacity-90',
    secondary: 'border border-border bg-surface hover:bg-surface-2',
    ghost: 'hover:bg-surface-2',
    danger: 'bg-danger text-white hover:opacity-90',
    live: 'bg-live text-white hover:opacity-90',
  }[variant];

  const sizes = {
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-sm gap-2',
    lg: 'h-11 px-5 text-sm gap-2',
  }[size];

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition',
        'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-bg focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        variants,
        sizes,
        className,
      )}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/* --------------------------------- Input --------------------------------- */

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cn(
        'h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm',
        'placeholder:text-faint focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
        className,
      )}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cn(
        'h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm',
        'focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
        className,
      )}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={cn(
        'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm',
        'placeholder:text-faint focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none',
        className,
      )}
    />
  );
}

/* -------------------------------- Avatar --------------------------------- */

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
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: color ?? 'var(--color-brand)',
        fontSize: size * 0.38,
      }}
      aria-hidden
    >
      {text}
    </span>
  );
}

/* ------------------------------ Empty / Load ----------------------------- */

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
      {icon && <div className="mb-3 text-faint">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label ?? 'Loading…'}
    </div>
  );
}

/** Skeleton rows, so a table doesn't collapse and reflow on load. */
export function SkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((__, c) => (
            <div
              key={c}
              className="h-4 flex-1 animate-pulse rounded bg-surface-2"
              style={{ maxWidth: c === 0 ? '30%' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Table --------------------------------- */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  // Wide tables scroll inside their own container so the page body never scrolls
  // horizontally.
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'border-b border-border px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-muted',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-2.5 align-middle', className)}>{children}</td>;
}

/* ------------------------------- Mock notice ----------------------------- */

/**
 * Marks a surface whose external system is simulated.
 *
 * This is a deliberate honesty device: anyone demoing or reviewing the platform
 * can see at a glance which parts are real and which are mocked, so nothing gets
 * over-claimed to a client by accident.
 */
export function MockNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-xs leading-relaxed text-warn">
      <span className="mt-px font-semibold">Simulated</span>
      <span className="text-fg/80">{children}</span>
    </div>
  );
}
