'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { AlertCircle, ArrowRightLeft, Check } from 'lucide-react';
import { Loader, SignalTriangle } from '@hire-stella/ui';

/*
 * Sonner (the app's `toast()` API) dressed as @hire-stella/ui toasts. Strict brand: success and
 * info are neutral, warnings and errors carry the orange signal plus an icon — never red.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme = 'dark' } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <Check className="size-4" strokeWidth={1.75} />,
        info: <ArrowRightLeft className="size-4" strokeWidth={1.5} />,
        warning: <SignalTriangle size={10} />,
        error: <AlertCircle className="size-4 text-primary" strokeWidth={1.5} />,
        loading: <Loader size="sm" label="Working" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': '14px',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'hs-sd-toast',
          title: 'hs-sd-toast__title',
          description: 'hs-sd-toast__desc',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
