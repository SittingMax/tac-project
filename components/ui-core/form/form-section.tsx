import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface FormSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function FormSection({
  title,
  description,
  icon: Icon,
  action,
  className,
  children,
  ...props
}: FormSectionProps) {
  return (
    <section
      className={cn('rounded-xl border border-border bg-card shadow-xs overflow-hidden', className)}
      {...props}
    >
      <div className="border-b border-border bg-muted/30 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-primary shadow-xs">
              <Icon className="size-4" />
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-medium leading-none tracking-tight">{title}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
