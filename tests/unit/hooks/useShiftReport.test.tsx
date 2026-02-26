// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShiftReport } from '@/hooks/useShiftReport';
import { shiftReportService } from '@/lib/services/shiftReportService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the service
vi.mock('@/lib/services/shiftReportService', () => ({
  shiftReportService: {
    generateReport: vi.fn(),
  },
}));

// Setup QueryClient for tests
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useShiftReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls generateReport with correct filters', async () => {
    const filters = {
      hubId: 'HUB123',
      shiftStart: new Date('2023-10-27T08:00:00Z'),
      shiftEnd: new Date('2023-10-27T20:00:00Z'),
    };
    vi.mocked(shiftReportService.generateReport).mockResolvedValue({
      generatedAt: new Date().toISOString(),
      shiftPeriod: {
        start: '2023-10-27T08:00:00Z',
        end: '2023-10-27T20:00:00Z',
        durationHours: 12,
      },
      shipments: { total: 10, byStatus: {}, created: 5, delivered: 3, exceptions: 0 },
      manifests: { total: 2, opened: 1, closed: 1, departed: 0, arrived: 0 },
      exceptions: { total: 0, bySeverity: {}, byType: {}, resolved: 0, pending: 0 },
      scans: { total: 15, bySource: {}, uniqueShipments: 8 },
      pendingActions: { openManifests: 1, unresolvedExceptions: 0, shipmentsAwaitingPickup: 2 },
      recentActivity: [],
    });

    const { result } = renderHook(() => useShiftReport(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(shiftReportService.generateReport).toHaveBeenCalledWith(filters);
    expect(result.current.data).toMatchObject({
      shipments: { total: 10 },
    });
  });

  it('handles errors correctly', async () => {
    const filters = {
      hubId: 'HUB123',
      shiftStart: new Date('2023-10-27T08:00:00Z'),
      shiftEnd: new Date('2023-10-27T20:00:00Z'),
    };
    const error = new Error('Failed to fetch');
    vi.mocked(shiftReportService.generateReport).mockRejectedValue(error);

    const { result } = renderHook(() => useShiftReport(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
