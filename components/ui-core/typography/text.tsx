import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      default: 'text-base',
      lead: 'text-xl text-muted-foreground',
      large: 'text-lg font-medium',
      small: 'text-sm font-medium leading-none',
      muted: 'text-sm text-muted-foreground',
      micro: 'text-xs text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div';
}

export function Text({ variant, as: Comp = 'p', className, ...props }: TextProps) {
  return <Comp className={cn(textVariants({ variant, className }))} {...props} />;
}
