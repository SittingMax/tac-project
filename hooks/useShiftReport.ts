/**
 * Shift Handover Report Hook
 * React Query hook for generating shift reports
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  shiftReportService,
  ShiftReportFilters,
  ShiftHandoverReport,
} from '@/lib/services/shiftReportService';
import { toast } from 'sonner';
import { handleMutationError } from '@/lib/errors';

export const shiftReportKeys = {
  all: ['shift-reports'] as const,
  report: (filters: ShiftReportFilters) => [...shiftReportKeys.all, filters] as const,
  lastNHours: (hours: number, hubId?: string) =>
    [...shiftReportKeys.all, 'last', hours, hubId] as const,
  today: (hubId?: string) => [...shiftReportKeys.all, 'today', hubId] as const,
};

/**
 * Hook to generate a shift handover report
 */
export function useShiftReport(filters: ShiftReportFilters, enabled = true) {
  return useQuery({
    queryKey: shiftReportKeys.report(filters),
    queryFn: () => shiftReportService.generateReport(filters),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to generate report for last N hours
 */
export function useLastNHoursReport(hours: number, hubId?: string, enabled = true) {
  return useQuery({
    queryKey: shiftReportKeys.lastNHours(hours, hubId),
    queryFn: () => shiftReportService.generateLastNHoursReport(hours, hubId),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to generate today's report
 */
export function useTodayReport(hubId?: string, enabled = true) {
  return useQuery({
    queryKey: shiftReportKeys.today(hubId),
    queryFn: () => shiftReportService.generateTodayReport(hubId),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to export report to CSV and trigger download
 */
export function useExportShiftReport() {
  return useMutation({
    mutationFn: async (report: ShiftHandoverReport) => {
      const csv = shiftReportService.exportToCSV(report);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `shift-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return csv;
    },
    onSuccess: () => {
      toast.success('Report exported successfully');
    },
    onError: (error) => {
      handleMutationError(error, 'Export Report');
    },
  });
}
