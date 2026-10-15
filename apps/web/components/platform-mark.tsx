import { Logo } from '@hire-stella/ui';
import { PLATFORM_NAME, PLATFORM_TAGLINE } from '@/lib/platform';
import { cn } from '@/lib/utils';

/**
 * The platform's mark — the product that hosts the contact centres, as distinct from any one of them.
 *
 * On a HireStella deployment this is the real HireStella lockup (fixed artwork from @hire-stella/ui;
 * the wordmark is never retyped). A white-label deployment (NEXT_PUBLIC_PLATFORM_NAME set to something
 * else) gets its name as text instead, because shipping our logo on someone else's platform would be wrong.
 */
export function PlatformMark({
  onDark,
  variant = 'lockup',
  width,
  withTagline = false,
  className,
}: {
  /** Force the dark-surface artwork (e.g. a panel that is dark in both themes). */
  onDark?: boolean;
  variant?: 'lockup' | 'symbol';
  width?: number;
  withTagline?: boolean;
  className?: string;
}) {
  if (PLATFORM_NAME === 'HireStella') {
    return (
      <span className={cn('inline-flex flex-col gap-1.5', className)}>
        <Logo
          variant={variant}
          surface={onDark ? 'dark' : 'auto'}
          width={width ?? (variant === 'lockup' ? 150 : 28)}
        />
        {withTagline && (
          <span className="text-[11px] text-muted-foreground">{PLATFORM_TAGLINE}</span>
        )}
      </span>
    );
  }
  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span className="font-[family-name:var(--hs-font-display)] text-base leading-tight font-bold tracking-[-0.02em]">
        {PLATFORM_NAME}
      </span>
      {withTagline && <span className="text-[11px] text-muted-foreground">{PLATFORM_TAGLINE}</span>}
    </span>
  );
}
