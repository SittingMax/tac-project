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
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12',
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none flex items-center gap-2.5 text-foreground">
          {icon && <span className="shrink-0">{icon}</span>}
          {title}<span className="text-primary">.</span>
        </h1>
        {description && (
          <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
