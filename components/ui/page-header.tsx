import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Consistent page header for all dashboard pages.
 * Renders a title + optional description on the left, with an action slot on the right.
 */
export function PageHeader({ title, description, icon, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between pb-6 mb-8 border-b border-border/30',
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-light tracking-widest uppercase flex items-center gap-3 text-foreground mb-0">
          {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
