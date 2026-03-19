import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface StatCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
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
  icon: Icon,
  iconColor = 'primary',
  trend,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn('p-6', className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
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
                {trend.direction === 'up' && <TrendingUp className="mr-0.5 size-3" />}
                {trend.direction === 'down' && <TrendingDown className="mr-0.5 size-3" />}
                {trend.value}
                {trend.label && (
                  <span className="ml-1 text-muted-foreground font-normal">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              iconColorMap[iconColor]
            )}
          >
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
