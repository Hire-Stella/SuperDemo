import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '@/lib/utils';

/** Text input in @hire-stella/ui's control style (soft Mist focus, never a neon frame). */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn('hs-sd-input', className)}
      {...props}
    />
  );
}

export { Input };
