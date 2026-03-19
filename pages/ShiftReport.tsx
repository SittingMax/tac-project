/**
 * Shift Handover Report Page
 * Comprehensive dashboard for shift handover operations
 */

import { useState } from 'react';
import { formatDateTime } from '@/lib/formatters';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageContainer, PageHeader, SectionCard } from '@/components/ui-core/layout';
import { StatCard } from '@/components/ui-core';
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
    if (report) exportMutation.mutate(report);
  };

  return (
    <PageContainer>
      <PageHeader title="Shift Handover" description="Operations summary for designated duration">
        <Select value={shiftHours} onValueChange={(v) => setShiftHours(v as ShiftDuration)}>
          <SelectTrigger className="w-[140px] h-10">
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
          className="size-10"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>

        <Button onClick={handleExport} disabled={!report || exportMutation.isPending}>
          <Download data-icon="inline-start" /> Export Data
        </Button>
      </PageHeader>

      {/* Shift Period Info */}
      {report && (
        <SectionCard>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Clock className="size-4 text-primary" />
            <span className="text-muted-foreground">Period:</span>
            <span className="font-bold text-foreground">
              {formatDateTime(report.shiftPeriod.start)}
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
            <span className="font-bold text-foreground">
              {formatDateTime(report.shiftPeriod.end)}
            </span>
            <Badge variant="outline" className="ml-auto border-primary/30 text-primary">
              {report.shiftPeriod.durationHours} hrs
            </Badge>
          </div>
        </SectionCard>
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
          {/* Summary Cards — full shadcn/ui CardHeader / CardContent composition */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Shipments"
              value={report.shipments.total}
              subtitle={`${report.shipments.created} created / ${report.shipments.delivered} delivered`}
              icon={Package}
            />
            <StatCard
              title="Manifests"
              value={report.manifests.total}
              subtitle={`${report.manifests.closed} closed / ${report.manifests.departed} departed`}
              icon={Truck}
            />
            <StatCard
              title="Exceptions"
              value={report.exceptions.total}
              subtitle={`${report.exceptions.resolved} resolved / ${report.exceptions.pending} pending`}
              icon={AlertTriangle}
              iconColor="error"
            />
            <StatCard
              title="Scans"
              value={report.scans.total}
              subtitle={`${report.scans.uniqueShipments} unique shipments`}
              icon={ScanLine}
            />
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shipments by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Shipments by Status</CardTitle>
                <CardDescription>Distribution of shipment statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {Object.entries(report.shipments.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge variant="outline" className="min-w-[120px] justify-center">
                        {status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(report.shipments.byStatus).length === 0 && (
                    <EmptyState icon={Package} title="No shipment activity" className="p-4 py-8" />
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
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-5 text-status-warning" />
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
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <XCircle className="size-5 text-status-error" />
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
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Package className="size-5 text-status-info" />
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
                <div className="flex flex-col gap-4">
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

            {/* Recent Activity — uses ScrollArea instead of overflow-y-auto */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest operations during shift</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="flex flex-col gap-3 pr-3">
                    {report.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {formatDateTime(activity.time)}
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
                      <EmptyState icon={Clock} title="No recent activity" className="p-4 py-8" />
                    )}
                  </div>
                </ScrollArea>
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
                      className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg"
                    >
                      <ScanLine className="size-4 text-muted-foreground" />
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
    </PageContainer>
  );
}
