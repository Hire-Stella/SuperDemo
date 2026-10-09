import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader } from '@hire-stella/ui';

import { cn } from '@/lib/utils';

/*
 * Buttons on @hire-stella/ui's `hs-btn` styles. The API (variant/size/loading) is
 * unchanged so every call site keeps working.
 *
 * Strict HireStella brand: there is one action colour. `default`, `danger` and `live`
 * all render as the primary (orange) button and are told apart by their label and
 * icon, never by hue. Keep one primary per view.
 *
 * Sizes stay dense (26–42px) because this is an operations console; `lg` is the
 * brand's product density. Touch targets on mobile get a 44px hit area via CSS.
 */
const buttonVariants = cva(
  "hs-btn hs-sd-btn [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 aria-invalid:border-[var(--hs-border-selected)]",
  {
    variants: {
      variant: {
        default: 'hs-btn--primary',
        danger: 'hs-btn--primary',
        live: 'hs-btn--primary',
        outline: 'hs-btn--secondary',
        secondary: 'hs-btn--secondary',
        ghost: 'hs-sd-btn--ghost',
        destructive: 'hs-btn--secondary hs-sd-btn--signal-text',
        link: 'hs-btn--tertiary hs-sd-btn--link',
      },
      size: {
        default: 'hs-sd-btn--md',
        xs: 'hs-sd-btn--xs',
        sm: 'hs-sd-btn--sm',
        lg: 'hs-sd-btn--lg',
        icon: 'hs-sd-btn--md hs-sd-btn--icon',
        'icon-xs': 'hs-sd-btn--xs hs-sd-btn--icon',
        'icon-sm': 'hs-sd-btn--sm hs-sd-btn--icon',
        'icon-lg': 'hs-sd-btn--lg hs-sd-btn--icon',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <Loader size="sm" tone="current" label="Working" />}
      {children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
