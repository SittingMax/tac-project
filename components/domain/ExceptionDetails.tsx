'use client';

import React from 'react';
import { Exception } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotesPanel } from '@/components/domain/NotesPanel';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { X, AlertTriangle, Package, Calendar, User, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ExceptionDetailsProps {
  exception: Exception;
  onClose: () => void;
  onResolve?: (id: string) => void;
  currentUserId?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-status-info/10 text-status-info border-status-info/30',
  MEDIUM: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  HIGH: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  CRITICAL: 'bg-status-error/10 text-status-error border-status-error/30',
};

const TYPE_ICONS: Record<string, string> = {
  DAMAGED: '📦',
  LOST: '🔍',
  DELAYED: '⏰',
  OVERWEIGHT: '⚖️',
  MISROUTED: '🗺️',
  CUSTOMS: '🛃',
};

export const ExceptionDetails: React.FC<ExceptionDetailsProps> = ({
  exception,
  onClose,
  onResolve,
  currentUserId = 'System',
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-none bg-status-error/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-status-error" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">{exception.type} Exception</h2>
              <StatusBadge status={exception.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ID: {exception.id} • awb: {exception.awb}
            </p>
          </div>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Exception Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <Card>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Type</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_ICONS[exception.type] || '⚠️'}</span>
                  <span className="font-bold text-lg">{exception.type}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Severity</div>
                <Badge
                  className={
                    SEVERITY_COLORS[exception.severity] ||
                    'bg-muted text-muted-foreground border-border'
                  }
                >
                  {exception.severity}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <StatusBadge status={exception.status} />
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">Description</h3>
            <p className="text-foreground leading-relaxed">{exception.description}</p>
          </Card>

          {/* Timeline */}
          <Card>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-none bg-status-error/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-status-error" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Exception Reported</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(exception.reportedAt), 'PPpp')}
                  </div>
                </div>
              </div>

              {exception.assignedTo && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-none bg-status-info/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-status-info" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      Assigned to {exception.assignedTo}
                    </div>
                    <div className="text-sm text-muted-foreground">Investigation started</div>
                  </div>
                </div>
              )}

              {exception.resolvedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-none bg-status-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-status-success" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Exception Resolved</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(exception.resolvedAt), 'PPpp')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Shipment Reference */}
          <Card>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1">
              <Package className="w-3 h-3" /> Related Shipment
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-lg text-primary">{exception.awb}</div>
                <div className="text-xs text-muted-foreground">
                  Shipment ID: {exception.shipmentId}
                </div>
              </div>
              <Button variant="secondary" size="sm">
                View Shipment
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column - Notes & Actions */}
        <div className="space-y-4">
          <NotesPanel
            entityType="EXCEPTION"
            entityId={exception.id}
            title="Exception Notes"
            currentUserId={currentUserId}
            maxHeight="350px"
          />

          {/* Quick Actions */}
          {exception.status === 'OPEN' && onResolve && (
            <Card>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                Quick Actions
              </h3>
              <Button className="w-full" variant="default" onClick={() => onResolve(exception.id)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve Exception
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExceptionDetails;
