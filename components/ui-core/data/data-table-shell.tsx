import * as React from 'react';
import { cn } from '@/lib/utils';

interface DataTableShellProps {
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Standardized wrapper for data-heavy pages (Shipments, Inventory, Exceptions).
 * Normalizes toolbar location above the table and footer/pagination below.
 */
export function DataTableShell({ toolbar, children, footer, className }: DataTableShellProps) {
  return (
    <div className={cn('flex flex-col gap-0 border border-border bg-card', className)}>
      {toolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
          {toolbar}
        </div>
      )}
      <div className="overflow-auto">{children}</div>
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </div>
  );
}
