import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAnomalyDetector, ShipmentAnomaly } from '@/hooks/useAnomalyDetector';
import { BrainCircuit, AlertTriangle, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export const AnomalyDetectorWidget: React.FC = () => {
  const { anomalies, isLoading, stats } = useAnomalyDetector();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="h-full border-border bg-card shadow-sm col-span-1 lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary animate-pulse" />
            <Skeleton className="w-48 h-6" />
          </div>
          <Skeleton className="w-64 h-4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="w-full h-16 rounded-none" />
            <Skeleton className="w-full h-16 rounded-none" />
            <Skeleton className="w-full h-16 rounded-none" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: ShipmentAnomaly['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'HIGH':
        return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'MEDIUM':
        return 'bg-status-warning/15 text-status-warning border-status-warning/30';
      case 'LOW':
        return 'bg-chart-2/15 text-chart-2 border-chart-2/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: ShipmentAnomaly['type']) => {
    switch (type) {
      case 'ROUTE_MISMATCH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'STALLED':
        return <AlertCircle className="w-4 h-4" />;
      case 'DELAY':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <Card className="h-full border-border bg-card shadow-sm col-span-1 lg:col-span-2 flex flex-col xl:col-span-3 border-primary/20 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <CardHeader className="relative z-10 pb-4 flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">AI Anomaly Detector</CardTitle>
          </div>
          <CardDescription>
            Monitoring {stats.totalAnalyzed} active shipments for irregularities using predictive
            heuristics.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-muted-foreground">Detected Issues</span>
            <span className="text-2xl font-bold leading-none mt-1">{stats.anomalyCount}</span>
          </div>
          {stats.criticalCount > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-destructive">Critical</span>
              <span className="text-2xl font-bold text-destructive leading-none mt-1">
                {stats.criticalCount}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 flex-1 overflow-auto p-0">
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-48">
            <div className="w-12 h-12 rounded-none bg-status-success/20 flex items-center justify-center mb-3">
              <BrainCircuit className="w-6 h-6 text-status-success" />
            </div>
            <p className="text-sm font-medium text-foreground">All Clear</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              No anomalies detected across {stats.totalAnalyzed} active shipments. Operations are
              nominal.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {anomalies.slice(0, 5).map((anomaly, idx) => (
              <div
                key={`${anomaly.shipment.id}-${idx}`}
                className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-sm font-bold cursor-pointer hover:underline text-primary"
                      onClick={() => navigate(`/shipments/${anomaly.shipment.id}`)}
                    >
                      {anomaly.shipment.cn_number}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-2 py-0 h-5 text-[10px] font-semibold border flex items-center gap-1',
                        getSeverityColor(anomaly.severity)
                      )}
                    >
                      {getTypeIcon(anomaly.type)}
                      {anomaly.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/80">{anomaly.description}</p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      AI Confidence
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-16 h-1.5 bg-muted rounded-none overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000 ease-out"
                          style={{ width: `${anomaly.confidenceScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-medium">
                        {anomaly.confidenceScore}%
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs shrink-0"
                    onClick={() => navigate(`/shipments/${anomaly.shipment.id}`)}
                  >
                    Investigate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
