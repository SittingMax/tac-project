import { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CrudTable } from '@/components/crud/CrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import { auditService } from '@/lib/services/auditService';
import { logger } from '@/lib/logger';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}

export function AuditTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await auditService.list({ limit: 100 });
      const mapped: AuditLog[] = rows.map((row) => ({
        id: row.id,
        timestamp: row.created_at ?? new Date().toISOString(),
        actorId: row.actor?.full_name ?? row.actor_staff_id ?? 'system',
        action: row.action ?? 'UNKNOWN',
        entityType: row.entity_type ?? undefined,
        entityId: row.entity_id ?? undefined,
        payload:
          row.after && typeof row.after === 'object'
            ? (row.after as Record<string, unknown>)
            : row.before && typeof row.before === 'object'
              ? (row.before as Record<string, unknown>)
              : undefined,
      }));

      setLogs(mapped);
    } catch (err) {
      logger.error('AuditTable', 'Unexpected error', { error: err });
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entityType?.toLowerCase().includes(q) ||
      log.entityId?.toLowerCase().includes(q) ||
      log.actorId?.toLowerCase().includes(q)
    );
  });

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Date',
      cell: ({ row }) => (
        <div className="font-mono text-xs text-muted-foreground">
          {new Date(row.original.timestamp).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'actorId',
      header: 'User',
      cell: ({ row }) => (
        <div className="font-semibold text-foreground text-sm">{row.original.actorId}</div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="rounded-md text-[10px] font-medium bg-muted/30 border-border"
        >
          {row.original.action}
        </Badge>
      ),
    },
    {
      accessorKey: 'entityType',
      header: 'Module',
      cell: ({ row }) => (
        <span className="font-mono text-xs lowercase text-muted-foreground font-medium">
          {row.original.entityType || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'payload',
      header: 'Details',
      cell: ({ row }) => (
        <div
          className="text-[10px] font-mono text-muted-foreground/60 max-w-sm truncate"
          title={JSON.stringify(row.original.payload)}
        >
          {row.original.entityId ? `#${row.original.entityId.slice(0, 8)} ` : ''}
          {JSON.stringify(row.original.payload)}
        </div>
      ),
    },
  ];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-row items-center justify-between border-b border-border/40 pb-4 flex flex-col gap-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Activity size={20} strokeWidth={1.5} className="text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">Audit Logs</CardTitle>
          </div>
          <CardDescription>
            Immutable record of all system modifications and critical events
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <CrudTable
          columns={columns}
          data={filteredLogs}
          pageSize={15}
          isLoading={isLoading}
          searchKey="action"
          searchValue={auditSearch}
          onSearch={setAuditSearch}
          searchPlaceholder="Filter by user, action, or module..."
          emptyMessage={auditSearch ? 'No audit events match your filter' : 'No audit events found'}
          className="p-6 border-0"
        />
      </CardContent>
    </Card>
  );
}
