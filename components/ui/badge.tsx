import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/20 text-primary',
        secondary: 'border-transparent bg-muted text-muted-foreground',
        destructive: 'badge--exception',
        success: 'badge--delivered',
        warning: 'badge--in-transit',
        outline: 'border-border text-foreground',
        // Status-specific variants using semantic tokens
        created: 'badge--created',
        transit: 'badge--in-transit',
        delivered: 'badge--delivered',
        exception: 'badge--exception',
        manifested: 'badge--manifested',
        arrived: 'badge--arrived',
        cancelled: 'badge--cancelled',
        returned: 'badge--returned',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  className?: string;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
