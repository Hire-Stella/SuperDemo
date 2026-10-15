import { cn } from '@/lib/utils';

/** Loading placeholder — @hire-stella/ui's shimmer. Size it with className. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn('hs-skeleton rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
