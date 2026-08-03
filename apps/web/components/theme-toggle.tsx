'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

/**
 * Three-way theme switch: light, dark, follow the OS.
 *
 * A segmented control rather than a cycling icon button, because with three
 * states a single toggle leaves you guessing what the next press will do — and
 * "system" is invisible in that pattern. Agents work night shifts, so dark mode
 * is a real requirement here rather than a nicety.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes can't know the resolved theme until after hydration; rendering
  // the active state before then causes a hydration mismatch.
  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn('inline-flex gap-0.5 rounded-lg border bg-muted/50 p-0.5', className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex size-6 items-center justify-center rounded-md transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
