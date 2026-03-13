import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUp01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';

interface StatCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'muted';
  trend?: {
    value: number | string;
    label?: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

const iconColorMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-status-success/10 text-status-success',
  warning: 'bg-status-warning/10 text-status-warning',
  error: 'bg-status-error/10 text-status-error',
  muted: 'bg-muted text-muted-foreground',
};

const trendColorMap = {
  up: 'text-status-success dark:text-status-success',
  down: 'text-status-error dark:text-status-error',
  neutral: 'text-muted-foreground',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'primary',
  trend,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn('p-6', className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {trend && (
              <div
                className={cn(
                  'flex items-center text-xs font-medium',
                  trendColorMap[trend.direction]
                )}
              >
                {trend.direction === 'up' && (
                  <HugeiconsIcon icon={ArrowUp01Icon} className="mr-0.5 size-3" />
                )}
                {trend.direction === 'down' && (
                  <HugeiconsIcon icon={ArrowDown01Icon} className="mr-0.5 size-3" />
                )}
                {trend.value}
                {trend.label && (
                  <span className="ml-1 text-muted-foreground font-normal">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              iconColorMap[iconColor]
            )}
          >
            <HugeiconsIcon icon={icon} className="size-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
