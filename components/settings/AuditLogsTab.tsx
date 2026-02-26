import { useState, useEffect } from 'react';
import { Activity, Search } from 'lucide-react';
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
import { useAuthStore } from '@/store/authStore';
import { SectionHeader } from './SettingsComponents';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

export const AuditLogsTab = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAuditLogs = async () => {
    // Mock simulation or Supabase fetch
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        actorId: user?.email || 'admin@tapancargo.com',
        action: 'SETTINGS_UPDATE',
        entityType: 'SYSTEM',
        payload: { terminal: 'Hub-01' },
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actorId: 'system',
        action: 'BACKUP_COMPLETED',
        entityType: 'DATABASE',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        actorId: user?.email || 'admin@tapancargo.com',
        action: 'USER_LOGIN',
        entityType: 'AUTH',
      },
    ];
    setLogs(mockLogs);
  };

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
              {filteredLogs.length === 0 ? (
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
