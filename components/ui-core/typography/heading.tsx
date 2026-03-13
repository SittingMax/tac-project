import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const headingVariants = cva('text-foreground tracking-tight', {
  variants: {
    level: {
      h1: 'text-2xl font-semibold md:text-3xl',
      h2: 'text-2xl font-semibold',
      h3: 'text-xl font-medium',
      h4: 'text-lg font-medium',
      h5: 'text-base font-medium',
    },
  },
  defaultVariants: {
    level: 'h2',
  },
});

interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function Heading({ level, as, className, ...props }: HeadingProps) {
  const Comp = as || level || 'h2';

  return <Comp className={cn(headingVariants({ level, className }))} {...props} />;
}
