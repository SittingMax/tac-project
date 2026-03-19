import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep: number;
  orientation?: 'horizontal' | 'vertical';
  children: React.ReactNode;
}

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ activeStep, orientation = 'horizontal', className, children, ...props }, ref) => {
    // Map children to inject index, isCompleted, isCurrent props
    const steps = React.Children.toArray(children).map((child, index) => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child as React.ReactElement<StepProps>, {
        index,
        isCompleted: activeStep > index,
        isCurrent: activeStep === index,
        orientation,
        isLast: index === React.Children.count(children) - 1,
      });
    });

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row items-center w-full' : 'flex-col',
          className
        )}
        {...props}
      >
        {steps}
      </div>
    );
  }
);
Stepper.displayName = 'Stepper';

export interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  index?: number;
  isCompleted?: boolean;
  isCurrent?: boolean;
  isLast?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export const Step = React.forwardRef<HTMLDivElement, StepProps>(
  (
    {
      title,
      description,
      icon,
      index = 0,
      isCompleted = false,
      isCurrent = false,
      isLast = false,
      orientation = 'horizontal',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex-1',
          orientation === 'horizontal' ? 'flex-row items-center' : 'flex flex-col min-h-[60px]',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'relative z-10 flex shrink-0 items-center',
            orientation === 'vertical' && 'pb-4'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-none border-2 text-sm transition-colors',
              isCompleted
                ? 'border-primary/30 bg-primary/5 text-primary'
                : isCurrent
                  ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                  : 'border-border/50 text-muted-foreground bg-muted/10'
            )}
          >
            {isCompleted ? <Check size={16} strokeWidth={1.5} /> : icon || index + 1}
          </div>
          <div className={cn('flex flex-col', orientation === 'horizontal' ? 'ml-3' : 'ml-4')}>
            <span
              className={cn(
                'text-sm font-semibold uppercase tracking-wider',
                isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {title}
            </span>
            {description && (
              <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
            )}
          </div>
        </div>

        {!isLast && (
          <div
            className={cn(
              'absolute bg-muted',
              orientation === 'horizontal'
                ? 'left-[1.25rem] top-1/2 h-[2px] w-[calc(100%-2.5rem)] -translate-y-1/2'
                : 'left-4 top-8 h-[calc(100%-24px)] w-[2px] -translate-x-1/2'
            )}
          >
            <div
              className={cn(
                'h-full bg-primary transition duration-300',
                isCompleted ? (orientation === 'horizontal' ? 'w-full' : 'h-full') : 'w-0 h-0'
              )}
            />
          </div>
        )}
      </div>
    );
  }
);
Step.displayName = 'Step';
