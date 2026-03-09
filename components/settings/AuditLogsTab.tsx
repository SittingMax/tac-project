import { useState, useEffect, useCallback } from 'react';
import { Activity, Search, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SectionHeader } from './SettingsComponents';
import { supabase } from '@/lib/supabase';
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
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, created_at, actor_id, action, entity_type, entity_id, payload')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        logger.error('AuditLogsTab', 'Failed to fetch audit logs', { error: error.message });
        setLogs([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data ?? []) as any[];
      const mapped: AuditLog[] = rows.map((row) => ({
        id: row.id,
        timestamp: row.created_at,
        actorId: row.actor_id ?? 'system',
        action: row.action ?? 'UNKNOWN',
        entityType: row.entity_type ?? undefined,
        entityId: row.entity_id ?? undefined,
        payload: row.payload as Record<string, unknown> | undefined,
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

  return (
    <Card className="p-8 rounded-none border-border/40 shadow-none bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-border/40 pb-8">
        <SectionHeader icon={Activity} title="Security Audit Stream" />
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="FILTER AUDIT STREAM..."
              className="pl-10 h-10 rounded-none border-border font-mono text-[10px] uppercase tracking-widest bg-muted/5 focus:bg-background transition-all"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="border border-border/40 bg-muted/5">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-muted/10 sticky top-0 z-10">
              <TableRow className="border-b-2 border-border/40 hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  TIMESTAMP_UTC
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  ACTOR_ID
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  ACTION_TYPE
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  ENTITY_REF
                </TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                  PAYLOAD_DATA
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-20 text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
                  >
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                    LOADING AUDIT STREAM...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-20 text-muted-foreground font-mono text-[10px] uppercase tracking-widest"
                  >
                    {auditSearch ? 'QUERY RETURNED ZERO RESULTS' : 'STREAM IS CURRENTLY EMPTY'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-border/20 last:border-0 hover:bg-primary/5 transition-colors"
                  >
                    <TableCell className="font-mono text-[10px] text-muted-foreground py-4">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </TableCell>
                    <TableCell className="font-black text-foreground text-[10px] font-mono py-4 uppercase tracking-tighter">
                      {log.actorId}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className="rounded-none font-mono text-[9px] uppercase tracking-widest bg-background border-border/60"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] py-4">
                      <span className="font-mono font-bold uppercase">{log.entityType}</span>
                      <span className="text-muted-foreground/50 ml-1 font-mono">
                        ::{log.entityId?.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-[10px] font-mono text-muted-foreground max-w-xs truncate py-4 opacity-70"
                      title={JSON.stringify(log.payload)}
                    >
                      {JSON.stringify(log.payload)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
          {filteredLogs.length} LOG_ENTRIES_INDEXED
        </div>
      </div>
    </Card>
  );
};
