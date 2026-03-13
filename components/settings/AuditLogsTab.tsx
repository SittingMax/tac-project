import { useState, useEffect, useCallback } from 'react';
import { Activity, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CrudTable } from '@/components/crud/CrudTable';
import type { ColumnDef } from '@tanstack/react-table';
import { SectionHeader } from './SettingsComponents';
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

export const AuditLogsTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // NOTE: generated database.types.ts is out of sync — audit_logs.actor_id
      // exists in the real schema but not in the generated types. Cast to any
      // until `npx supabase gen types typescript` is re-run.
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
      logger.error('AuditLogsTab', 'Unexpected error', { error: err });
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
      header: 'TIMESTAMP_UTC',
      cell: ({ row }) => (
        <div className="font-mono text-[10px] text-muted-foreground">
          {new Date(row.original.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
        </div>
      ),
    },
    {
      accessorKey: 'actorId',
      header: 'ACTOR_ID',
      cell: ({ row }) => (
        <div className="font-semibold text-foreground text-xs">{row.original.actorId}</div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'ACTION_TYPE',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="rounded-md text-[9px] font-medium bg-background border-border/60"
        >
          {row.original.action}
        </Badge>
      ),
    },
    {
      id: 'entityRef',
      header: 'ENTITY_REF',
      cell: ({ row }) => (
        <div className="text-[10px]">
          <span className="font-mono font-bold uppercase">{row.original.entityType}</span>
          <span className="text-muted-foreground/50 ml-1 font-mono">
            ::{row.original.entityId?.slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'payload',
      header: 'PAYLOAD_DATA',
      cell: ({ row }) => (
        <div
          className="text-[10px] font-mono text-muted-foreground max-w-xs truncate opacity-70"
          title={JSON.stringify(row.original.payload)}
        >
          {JSON.stringify(row.original.payload)}
        </div>
      ),
    },
  ];

  return (
    <Card className="p-8 rounded-md border-border/40 shadow-none bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-border/40 pb-8">
        <SectionHeader icon={Activity} title="Security Audit Stream" />
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="FILTER AUDIT STREAM..."
              className="pl-10 h-10 rounded-md border-border text-sm bg-muted/5 focus:bg-background transition-all"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="border border-border/40 bg-card rounded-xl overflow-hidden shadow-xs">
        <CrudTable
          columns={columns}
          data={filteredLogs}
          pageSize={10}
          isLoading={isLoading}
          emptyMessage={auditSearch ? 'QUERY RETURNED ZERO RESULTS' : 'STREAM IS CURRENTLY EMPTY'}
        />
      </div>
      <div className="flex justify-end mt-4">
        <div className="text-xs text-muted-foreground">
          {filteredLogs.length} LOG_ENTRIES_INDEXED
        </div>
      </div>
    </Card>
  );
};
