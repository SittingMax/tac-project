import * as React from 'react';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';

interface FormSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
}

export function FormSection({
  title,
  description,
  icon,
  className,
  children,
  ...props
}: FormSectionProps) {
  return (
    <section
      className={cn('rounded-xl border border-border bg-card shadow-xs overflow-hidden', className)}
      {...props}
    >
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-primary shadow-xs">
              <HugeiconsIcon icon={icon} className="size-4" />
            </div>
          )}
          <div className="space-y-0.5">
            <h3 className="text-base font-medium leading-none tracking-tight">{title}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
