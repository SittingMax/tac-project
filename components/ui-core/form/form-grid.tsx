import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const formGridVariants = cva('grid gap-6', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    },
  },
  defaultVariants: {
    columns: 2,
  },
});

interface FormGridProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof formGridVariants> {}

/**
 * Replaces manual `grid grid-cols-1 md:grid-cols-2 gap-4` classes
 * to ensure consistent alignment and spacing across forms.
 */
export function FormGrid({ columns, className, children, ...props }: FormGridProps) {
  return (
    <div className={cn(formGridVariants({ columns, className }))} {...props}>
      {children}
    </div>
  );
}
