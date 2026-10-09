import * as React from 'react';

import { cn } from '@/lib/utils';

/** Multi-line input in @hire-stella/ui's control style. */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn('hs-sd-input hs-sd-textarea', className)}
      {...props}
    />
  );
}

export { Textarea };
