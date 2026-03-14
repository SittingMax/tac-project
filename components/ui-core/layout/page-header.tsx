import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode; // Actions slot
  className?: string;
}

/**
 * Canonical page header for all dashboard pages.
 * Renders a title, optional description/icon/badge, and right-aligned actions.
 */
export function PageHeader({
  title,
  description,
  icon,
  badge,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6',
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-muted-foreground flex items-center justify-center">{icon}</div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            {title}
            {badge && <span className="flex items-center">{badge}</span>}
          </h1>
        </div>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
