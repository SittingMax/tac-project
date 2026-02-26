/**
 * Shift Handover Report Page
 * Comprehensive dashboard for shift handover operations
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { useLastNHoursReport, useExportShiftReport } from '@/hooks/useShiftReport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Truck,
  AlertTriangle,
  ScanLine,
  Download,
  Clock,
  ArrowRight,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

type ShiftDuration = '4' | '8' | '12' | '24';

export default function ShiftReport() {
  const [shiftHours, setShiftHours] = useState<ShiftDuration>('8');
  const [selectedHub] = useState<string | undefined>(undefined);

  const {
    data: report,
    isLoading,
    refetch,
    isFetching,
  } = useLastNHoursReport(parseInt(shiftHours), selectedHub, true);

  const exportMutation = useExportShiftReport();

  const handleExport = () => {
    if (report) {
      exportMutation.mutate(report);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/40 pb-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2.5">
            Shift Handover<span className="text-primary">.</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
            Operations summary for designated duration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={shiftHours} onValueChange={(v) => setShiftHours(v as ShiftDuration)}>
            <SelectTrigger className="w-[140px] rounded-none font-mono text-xs uppercase tracking-widest h-10 border-border bg-background">
              <SelectValue placeholder="DURATION" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">Last 4 hours</SelectItem>
              <SelectItem value="8">Last 8 hours</SelectItem>
              <SelectItem value="12">Last 12 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="rounded-none h-10 w-10 border-border"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            className="rounded-none font-mono uppercase tracking-widest text-xs h-10 px-6"
            onClick={handleExport}
            disabled={!report || exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Shift Period Info */}
      {report && (
        <Card className="rounded-none border-border shadow-none bg-muted/5">
          <CardContent className="py-4 px-6">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono uppercase tracking-widest">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Period:</span>
              <span className="font-bold text-foreground">
                {format(new Date(report.shiftPeriod.start), 'PPp')}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold text-foreground">
                {format(new Date(report.shiftPeriod.end), 'PPp')}
              </span>
              <span className="bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 ml-auto">
                {report.shiftPeriod.durationHours} HRS
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border-y border-border/40 my-8">
            <Card className="rounded-none border-0 shadow-none bg-background p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Shipments
                </span>
                <Package className="h-4 w-4 text-primary opacity-50" />
              </div>
              <div className="text-3xl font-black tracking-tighter">{report.shipments.total}</div>
              <p className="text-xs text-muted-foreground font-mono mt-2">
                {report.shipments.created} CR / {report.shipments.delivered} DLV
              </p>
            </Card>

            <Card className="rounded-none border-0 shadow-none bg-background p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Manifests
                </span>
                <Truck className="h-4 w-4 text-primary opacity-50" />
              </div>
              <div className="text-3xl font-black tracking-tighter">{report.manifests.total}</div>
              <p className="text-xs text-muted-foreground font-mono mt-2">
                {report.manifests.closed} CLS / {report.manifests.departed} DPT
              </p>
            </Card>

            <Card className="rounded-none border-0 shadow-none bg-background p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-destructive">
                  Exceptions
                </span>
                <AlertTriangle className="h-4 w-4 text-destructive opacity-50" />
              </div>
              <div className="text-3xl font-black tracking-tighter text-destructive">
                {report.exceptions.total}
              </div>
              <p className="text-xs text-destructive/80 font-mono mt-2">
                {report.exceptions.resolved} RSV / {report.exceptions.pending} PND
              </p>
            </Card>

            <Card className="rounded-none border-0 shadow-none bg-background p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Scans
                </span>
                <ScanLine className="h-4 w-4 text-primary opacity-50" />
              </div>
              <div className="text-3xl font-black tracking-tighter">{report.scans.total}</div>
              <p className="text-xs text-muted-foreground font-mono mt-2">
                {report.scans.uniqueShipments} UQ
              </p>
            </Card>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipments by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Shipments by Status</CardTitle>
                <CardDescription>Distribution of shipment statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(report.shipments.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="min-w-[120px] justify-center">
                          {status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(report.shipments.byStatus).length === 0 && (
                    <p className="text-sm text-muted-foreground">No shipment activity</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Actions</CardTitle>
                <CardDescription>Items requiring attention for next shift</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-none">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-status-warning" />
                      <span>Open Manifests</span>
                    </div>
                    <Badge
                      variant={
                        report.pendingActions.openManifests > 0 ? 'destructive' : 'secondary'
                      }
                    >
                      {report.pendingActions.openManifests}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-none">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-status-error" />
                      <span>Unresolved Exceptions</span>
                    </div>
                    <Badge
                      variant={
                        report.pendingActions.unresolvedExceptions > 0 ? 'destructive' : 'secondary'
                      }
                    >
                      {report.pendingActions.unresolvedExceptions}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-none">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-status-info" />
                      <span>Awaiting Pickup</span>
                    </div>
                    <Badge variant="secondary">
                      {report.pendingActions.shipmentsAwaitingPickup}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exception Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Exception Breakdown</CardTitle>
                <CardDescription>Exceptions by severity and type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">By Severity</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(report.exceptions.bySeverity).map(([severity, count]) => (
                        <Badge
                          key={severity}
                          variant={severity === 'CRITICAL' ? 'destructive' : 'outline'}
                        >
                          {severity}: {count}
                        </Badge>
                      ))}
                      {Object.keys(report.exceptions.bySeverity).length === 0 && (
                        <span className="text-sm text-muted-foreground">No exceptions</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">By Type</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(report.exceptions.byType).map(([type, count]) => (
                        <Badge key={type} variant="secondary">
                          {type.replace(/_/g, ' ')}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest operations during shift</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {report.recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(activity.time), 'HH:mm')}
                      </span>
                      <div className="flex-1">
                        <p>{activity.description}</p>
                        {activity.actor && (
                          <p className="text-xs text-muted-foreground">by {activity.actor}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {report.recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scan Sources */}
          {Object.keys(report.scans.bySource).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scan Sources</CardTitle>
                <CardDescription>Breakdown of scan event sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(report.scans.bySource).map(([source, count]) => (
                    <div
                      key={source}
                      className="flex items-center gap-2 p-3 bg-muted/50 rounded-none"
                    >
                      <ScanLine className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{source}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No report data available. Try refreshing.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
