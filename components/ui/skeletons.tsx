/**
 * Skeleton Components
 * Loading placeholders for async content
 * Uses shimmer animation for premium feel
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-none bg-muted', className)} />;
}

// Card Skeleton
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-none border border-border/40 bg-card p-6', className)}>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

// Shipment Card Skeleton
export function ShipmentCardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-none border border-border/40 bg-card p-4 flex flex-col gap-3', className)}
    >
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-none bg-muted/50" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// Data Table Skeleton
export function DataTableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn('rounded-none border border-border/40 bg-card', className)}>
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-4">
        {/* Column headers */}
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-4 py-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="border-t border-border p-4 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// Timeline Skeleton
export function TimelineSkeleton({ items = 4, className }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {/* Timeline line and dot */}
          <div className="flex flex-col items-center">
            <Skeleton className="size-4 rounded-none bg-muted/50" />
            {i < items - 1 && <Skeleton className="w-0.5 h-12 flex-1" />}
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col gap-2 pb-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard Metrics Skeleton
export function DashboardMetricsSkeleton({
  count = 4,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-none border border-border/40 bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="size-10 rounded-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-none border border-border/40 bg-card p-6', className)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-none bg-muted/50" />
      </div>
    </div>
  );
}

// Scan Panel Skeleton
export function ScanPanelSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('rounded-none border border-border/40 bg-card p-6 flex flex-col gap-6', className)}
    >
      {/* Input */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Recent scans */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-none bg-muted/10 border border-border/40"
            >
              <Skeleton className="size-8 rounded-none bg-muted/50" />
              <div className="flex-1 flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-16 rounded-none bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Notification List Skeleton
export function NotificationListSkeleton({
  count = 4,
  className,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('divide-y divide-border', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3 flex gap-3">
          <Skeleton className="size-8 rounded-none shrink-0 bg-muted/50" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 4, className }: SkeletonProps & { fields?: number }) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('flex items-center gap-3 p-3 rounded-none border border-border/40', className)}
    >
      <Skeleton className="size-10 rounded-none shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-6 w-16 rounded-none bg-muted/50" />
    </div>
  );
}

// Avatar Skeleton
export function AvatarSkeleton({
  size = 'md',
  className,
}: SkeletonProps & { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'size-8',
    md: 'size-10',
    lg: 'size-12',
  };

  return <Skeleton className={cn('rounded-none bg-muted/50', sizeClasses[size], className)} />;
}

// Text Skeleton
export function TextSkeleton({ lines = 3, className }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export default Skeleton;
