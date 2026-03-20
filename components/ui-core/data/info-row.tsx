import { cn } from '@/lib/utils';
import * as React from 'react';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  className?: string;
}

export function InfoRow({ label, value, bold, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-1', className)}>
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-sm text-right', bold && 'font-semibold')}>{value}</span>
    </div>
  );
}
