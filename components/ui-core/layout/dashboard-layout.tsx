import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface DashboardLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  kpiGrid?: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

export function DashboardLayout({
  title,
  description,
  actions,
  kpiGrid,
  children,
  sidebar,
  className,
}: DashboardLayoutProps) {
  return (
    <div
      className={cn('flex flex-col flex flex-col gap-6 w-full animate-in fade-in duration-500', className)}
    >
      <PageHeader title={title} description={description} actions={actions} />

      {kpiGrid && <div className="w-full">{kpiGrid}</div>}

      <div className={cn('flex flex-col lg:flex-row gap-6 w-full')}>
        <div className="flex-1 w-full flex flex-col flex flex-col gap-6 min-w-0">{children}</div>

        {sidebar && (
          <div className="w-full lg:w-80 shrink-0 flex flex-col flex flex-col gap-6">{sidebar}</div>
        )}
      </div>
    </div>
  );
}
