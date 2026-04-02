import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ChartCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Actions rendered in the top-right of the card header  */
  actions?: React.ReactNode;
  /** Controls explicit height of the chart content wrapper. Defaults to 300. Pass null for auto. */
  height?: number | null;
  /** Show a centered spinner when true */
  loading?: boolean;
  /** Forwarded to the inner content div */
  contentClassName?: string;
}

export function ChartCard({
  title,
  description,
  actions,
  height = 300,
  loading = false,
  children,
  className,
  contentClassName,
  ...props
}: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col', className)} {...props}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </CardHeader>

      <CardContent
        className={cn('flex-1 pt-0', contentClassName)}
        style={height != null ? { height } : undefined}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
