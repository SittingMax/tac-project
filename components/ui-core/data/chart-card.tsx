import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartCardProps {
  title: ReactNode;
  description?: ReactNode;
  loading?: boolean;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}

/**
 * A card wrapper for charts with a title, description, and optional loading skeleton.
 */
function ChartCard({ title, description, loading, className, children, action }: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-base font-semibold leading-snug">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {loading ? (
          <div className="flex flex-col gap-3 pt-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export { ChartCard };
export type { ChartCardProps };
