'use client';

import { format } from 'date-fns';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ScanHistoryEntry } from '@/hooks/useManifestScan';

interface ManifestScanLogProps {
  entries: ScanHistoryEntry[];
  className?: string;
}

const resultVariant: Record<
  'success' | 'duplicate' | 'error',
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  success: 'default',
  duplicate: 'outline',
  error: 'destructive',
};

export function ManifestScanLog({ entries, className }: ManifestScanLogProps) {
  return (
    <div className={cn('rounded-none border bg-background', className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Scan Log</p>
          <p className="text-[11px] text-muted-foreground">Latest 50 scans</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {entries.length}
        </Badge>
      </div>
      <ScrollArea className="h-40">
        {entries.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground">No scans yet. Start scanning CNs.</div>
        ) : (
          <div className="divide-y">
            {entries.map((entry, index) => (
              <div
                key={`${entry.manifest_item_id ?? entry.shipment_id ?? index}-${entry.timestamp}`}
                className="px-4 py-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm truncate">
                    {entry.cn_number ?? entry.shipment_id ?? 'Unknown'}
                  </div>
                  <Badge
                    variant={
                      entry.success
                        ? entry.duplicate
                          ? resultVariant.duplicate
                          : resultVariant.success
                        : resultVariant.error
                    }
                    className="text-[10px]"
                  >
                    {entry.duplicate
                      ? 'DUPLICATE'
                      : entry.success
                        ? 'SUCCESS'
                        : (entry.error ?? 'ERROR')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{entry.message}</span>
                  <span>{format(new Date(entry.timestamp), 'HH:mm:ss')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default ManifestScanLog;
