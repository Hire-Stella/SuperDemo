import * as React from 'react';

import { cn } from '@/lib/utils';

/** Field label — Montserrat 13/500, as in @hire-stella/ui's Field. */
function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn('hs-field__label inline-flex items-center gap-2 select-none', className)}
      {...props}
    />
  );
}

export { Label };
