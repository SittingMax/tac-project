/**
 * Shift Handover Report Service
 * Generates comprehensive reports for shift handover
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase client requires any for complex operations */

import { supabase } from '@/lib/supabase';
import { mapSupabaseError } from '@/lib/errors';
import { orgService } from './orgService';
import { format, startOfDay, subHours } from 'date-fns';

// Type helper
const db = supabase as any;

export interface ShiftReportFilters {
  hubId?: string;
  shiftStart: Date;
  shiftEnd: Date;
  staffId?: string;
}

export interface ShipmentSummary {
  total: number;
  byStatus: Record<string, number>;
  created: number;
  delivered: number;
  exceptions: number;
}

export interface ManifestSummary {
  total: number;
  opened: number;
  closed: number;
  departed: number;
  arrived: number;
}

export interface ExceptionSummary {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  resolved: number;
  pending: number;
}

export interface ScanSummary {
  total: number;
  bySource: Record<string, number>;
  uniqueShipments: number;
}

export interface ShiftHandoverReport {
  generatedAt: string;
  shiftPeriod: {
    start: string;
    end: string;
    durationHours: number;
  };
  hub?: {
    id: string;
    code: string;
    name: string;
  };
  shipments: ShipmentSummary;
  manifests: ManifestSummary;
  exceptions: ExceptionSummary;
  scans: ScanSummary;
  pendingActions: {
    openManifests: number;
    unresolvedExceptions: number;
    shipmentsAwaitingPickup: number;
  };
  recentActivity: Array<{
    time: string;
    type: string;
    description: string;
    actor?: string;
  }>;
}

export const shiftReportService = {
  /**
   * Generate a comprehensive shift handover report
   */
  async generateReport(filters: ShiftReportFilters): Promise<ShiftHandoverReport> {
    const orgId = orgService.getCurrentOrgId();
    const { shiftStart, shiftEnd, hubId } = filters;

    // Parallel fetch all data
    const [shipmentData, manifestData, exceptionData, trackingData, pendingData, recentActivity] =
      await Promise.all([
        this.getShipmentSummary(orgId, shiftStart, shiftEnd, hubId),
        this.getManifestSummary(orgId, shiftStart, shiftEnd, hubId),
        this.getExceptionSummary(orgId, shiftStart, shiftEnd, hubId),
        this.getScanSummary(orgId, shiftStart, shiftEnd, hubId),
        this.getPendingActions(orgId, hubId),
        this.getRecentActivity(orgId, shiftStart, shiftEnd, hubId),
      ]);

    // Get hub info if specified
    let hub;
    if (hubId) {
      const { data: hubData } = await db
        .from('hubs')
        .select('id, code, name')
        .eq('id', hubId)
        .single();
      hub = hubData;
    }

    const durationHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);

    return {
      generatedAt: new Date().toISOString(),
      shiftPeriod: {
        start: shiftStart.toISOString(),
        end: shiftEnd.toISOString(),
        durationHours: Math.round(durationHours * 10) / 10,
      },
      hub,
      shipments: shipmentData,
      manifests: manifestData,
      exceptions: exceptionData,
      scans: trackingData,
      pendingActions: pendingData,
      recentActivity,
    };
  },

  async getShipmentSummary(
    orgId: string,
    start: Date,
    end: Date,
    hubId?: string
  ): Promise<ShipmentSummary> {
    let query = db
      .from('shipments')
      .select('id, status, created_at')
      .eq('org_id', orgId)
      .gte('updated_at', start.toISOString())
      .lte('updated_at', end.toISOString())
      .is('deleted_at', null);

    if (hubId) {
      query = query.or(`origin_hub_id.eq.${hubId},destination_hub_id.eq.${hubId}`);
    }

    const { data: shipments, error } = await query;
    if (error) throw mapSupabaseError(error);

    const byStatus: Record<string, number> = {};
    let created = 0;
    let delivered = 0;
    let exceptions = 0;

    (shipments || []).forEach((s: any) => {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      if (s.status === 'CREATED' && new Date(s.created_at) >= start) created++;
      if (s.status === 'DELIVERED') delivered++;
      if (s.status === 'EXCEPTION') exceptions++;
    });

    return {
      total: shipments?.length || 0,
      byStatus,
      created,
      delivered,
      exceptions,
    };
  },

  async getManifestSummary(
    orgId: string,
    start: Date,
    end: Date,
    hubId?: string
  ): Promise<ManifestSummary> {
    let query = db
      .from('manifests')
      .select('id, status, created_at, closed_at, departed_at, arrived_at')
      .eq('org_id', orgId)
      .gte('updated_at', start.toISOString())
      .lte('updated_at', end.toISOString());

    if (hubId) {
      query = query.or(`from_hub_id.eq.${hubId},to_hub_id.eq.${hubId}`);
    }

    const { data: manifests, error } = await query;
    if (error) throw mapSupabaseError(error);

    let opened = 0;
    let closed = 0;
    let departed = 0;
    let arrived = 0;

    (manifests || []).forEach((m: any) => {
      if (new Date(m.created_at) >= start && m.status === 'OPEN') opened++;
      if (m.closed_at && new Date(m.closed_at) >= start) closed++;
      if (m.departed_at && new Date(m.departed_at) >= start) departed++;
      if (m.arrived_at && new Date(m.arrived_at) >= start) arrived++;
    });

    return {
      total: manifests?.length || 0,
      opened,
      closed,
      departed,
      arrived,
    };
  },

  async getExceptionSummary(
    orgId: string,
    start: Date,
    end: Date,
    hubId?: string
  ): Promise<ExceptionSummary> {
    const query = db
      .from('exceptions')
      .select(
        'id, type, severity, status, resolved_at, shipment:shipments(origin_hub_id, destination_hub_id)'
      )
      .eq('org_id', orgId)
      .gte('updated_at', start.toISOString())
      .lte('updated_at', end.toISOString());

    const { data: exceptions, error } = await query;
    if (error) throw mapSupabaseError(error);

    // Filter by hub if needed
    let filtered = exceptions || [];
    if (hubId) {
      filtered = filtered.filter(
        (e: any) => e.shipment?.origin_hub_id === hubId || e.shipment?.destination_hub_id === hubId
      );
    }

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let resolved = 0;
    let pending = 0;

    filtered.forEach((e: any) => {
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
      byType[e.type] = (byType[e.type] || 0) + 1;
      if (e.status === 'RESOLVED' || e.status === 'CLOSED') resolved++;
      else pending++;
    });

    return {
      total: filtered.length,
      bySeverity,
      byType,
      resolved,
      pending,
    };
  },

  async getScanSummary(
    orgId: string,
    start: Date,
    end: Date,
    hubId?: string
  ): Promise<ScanSummary> {
    let query = db
      .from('tracking_events')
      .select('id, source, shipment_id')
      .eq('org_id', orgId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (hubId) {
      query = query.eq('hub_id', hubId);
    }

    const { data: events, error } = await query;
    if (error) throw mapSupabaseError(error);

    const bySource: Record<string, number> = {};
    const uniqueShipments = new Set<string>();

    (events || []).forEach((e: any) => {
      bySource[e.source] = (bySource[e.source] || 0) + 1;
      if (e.shipment_id) uniqueShipments.add(e.shipment_id);
    });

    return {
      total: events?.length || 0,
      bySource,
      uniqueShipments: uniqueShipments.size,
    };
  },

  async getPendingActions(orgId: string, hubId?: string) {
    // Open manifests
    let manifestQuery = db
      .from('manifests')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'OPEN');

    if (hubId) {
      manifestQuery = manifestQuery.eq('from_hub_id', hubId);
    }

    const { count: openManifests } = await manifestQuery;

    // Unresolved exceptions
    const exceptionQuery = db
      .from('exceptions')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', ['OPEN', 'IN_PROGRESS']);

    const { count: unresolvedExceptions } = await exceptionQuery;

    // Shipments awaiting pickup
    let shipmentQuery = db
      .from('shipments')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'CREATED')
      .is('deleted_at', null);

    if (hubId) {
      shipmentQuery = shipmentQuery.eq('origin_hub_id', hubId);
    }

    const { count: shipmentsAwaitingPickup } = await shipmentQuery;

    return {
      openManifests: openManifests || 0,
      unresolvedExceptions: unresolvedExceptions || 0,
      shipmentsAwaitingPickup: shipmentsAwaitingPickup || 0,
    };
  },

  async getRecentActivity(orgId: string, start: Date, end: Date, _hubId?: string, limit = 20) {
    // Note: hubId filtering not yet implemented for audit logs
    const { data: auditLogs, error } = await db
      .from('audit_logs')
      .select('created_at, action, entity_type, entity_id, actor:staff(full_name)')
      .eq('org_id', orgId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw mapSupabaseError(error);

    return (auditLogs || []).map((log: any) => ({
      time: log.created_at,
      type: log.entity_type,
      description: `${log.action} ${log.entity_type} (${log.entity_id?.slice(0, 8)}...)`,
      actor: log.actor?.full_name,
    }));
  },

  /**
   * Export report to CSV format
   */
  exportToCSV(report: ShiftHandoverReport): string {
    const lines: string[] = [];

    // Header
    lines.push('TAC Cargo - Shift Handover Report');
    lines.push(`Generated: ${format(new Date(report.generatedAt), 'PPpp')}`);
    lines.push(
      `Shift Period: ${format(new Date(report.shiftPeriod.start), 'PPp')} to ${format(new Date(report.shiftPeriod.end), 'PPp')}`
    );
    lines.push(`Duration: ${report.shiftPeriod.durationHours} hours`);
    if (report.hub) {
      lines.push(`Hub: ${report.hub.name} (${report.hub.code})`);
    }
    lines.push('');

    // Shipments
    lines.push('SHIPMENTS');
    lines.push(`Total Active,${report.shipments.total}`);
    lines.push(`Created This Shift,${report.shipments.created}`);
    lines.push(`Delivered,${report.shipments.delivered}`);
    lines.push(`Exceptions,${report.shipments.exceptions}`);
    lines.push('');

    // Status breakdown
    lines.push('Shipments by Status');
    Object.entries(report.shipments.byStatus).forEach(([status, count]) => {
      lines.push(`${status},${count}`);
    });
    lines.push('');

    // Manifests
    lines.push('MANIFESTS');
    lines.push(`Total Activity,${report.manifests.total}`);
    lines.push(`Opened,${report.manifests.opened}`);
    lines.push(`Closed,${report.manifests.closed}`);
    lines.push(`Departed,${report.manifests.departed}`);
    lines.push(`Arrived,${report.manifests.arrived}`);
    lines.push('');

    // Exceptions
    lines.push('EXCEPTIONS');
    lines.push(`Total,${report.exceptions.total}`);
    lines.push(`Resolved,${report.exceptions.resolved}`);
    lines.push(`Pending,${report.exceptions.pending}`);
    lines.push('');

    // Scans
    lines.push('SCANNING ACTIVITY');
    lines.push(`Total Scans,${report.scans.total}`);
    lines.push(`Unique Shipments,${report.scans.uniqueShipments}`);
    lines.push('');

    // Pending Actions
    lines.push('PENDING ACTIONS FOR NEXT SHIFT');
    lines.push(`Open Manifests,${report.pendingActions.openManifests}`);
    lines.push(`Unresolved Exceptions,${report.pendingActions.unresolvedExceptions}`);
    lines.push(`Shipments Awaiting Pickup,${report.pendingActions.shipmentsAwaitingPickup}`);

    return lines.join('\n');
  },

  /**
   * Generate report for last N hours (convenience method)
   */
  async generateLastNHoursReport(hours: number, hubId?: string): Promise<ShiftHandoverReport> {
    const now = new Date();
    const start = subHours(now, hours);

    return this.generateReport({
      shiftStart: start,
      shiftEnd: now,
      hubId,
    });
  },

  /**
   * Generate report for today's shift
   */
  async generateTodayReport(hubId?: string): Promise<ShiftHandoverReport> {
    const now = new Date();

    return this.generateReport({
      shiftStart: startOfDay(now),
      shiftEnd: now,
      hubId: hubId,
    });
  },
};
