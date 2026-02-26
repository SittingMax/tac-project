import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base Skeleton Component for loading states
 * Uses shimmer animation for premium feel
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-none bg-muted/50', className)} {...props} />;
}

/**
 * KPI Card Skeleton - matches KPIGrid card structure
 */
function KPICardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-none p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-10 w-10 rounded-none" />
        <Skeleton className="h-6 w-16 rounded-none" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

/**
 * KPI Grid Skeleton - 4 cards in grid layout
 */
function KPIGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Chart Container Skeleton
 */
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-card border border-border rounded-none p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-none" />
          <Skeleton className="h-8 w-20 rounded-none" />
        </div>
      </div>
      <Skeleton className="w-full rounded-none" style={{ height }} />
    </div>
  );
}

/**
 * Table Row Skeleton
 */
function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full max-w-[150px]" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table Skeleton with header and rows
 */
function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-card border border-border rounded-none overflow-hidden">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-6 w-40" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Page Header Skeleton
 */
function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-24 rounded-none" />
        <Skeleton className="h-10 w-32 rounded-none" />
      </div>
    </div>
  );
}

/**
 * Full Page Skeleton - combines header, KPIs, and content
 */
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <PageHeaderSkeleton />
      <KPIGridSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}

/**
 * Card Skeleton for generic card loading
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-none p-6', className)}>
      <Skeleton className="h-6 w-1/3 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

/**
 * Avatar Skeleton
 */
function AvatarSkeleton({ size = 40 }: { size?: number }) {
  return <Skeleton className="rounded-none" style={{ width: size, height: size }} />;
}

export {
  Skeleton,
  KPICardSkeleton,
  KPIGridSkeleton,
  ChartSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
  CardSkeleton,
  AvatarSkeleton,
};
