/**
 * Query Key Factory
 * Centralized query key management for React Query
 * Prevents cache collisions and ensures consistency
 */

export const queryKeys = {
  // Shipments
  shipments: {
    all: ['shipments'] as const,
    lists: () => [...queryKeys.shipments.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.shipments.lists(), filters] as const,
    details: () => [...queryKeys.shipments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.shipments.details(), id] as const,
    byCN: (awb: string) => [...queryKeys.shipments.all, 'CN Number', awb] as const,
  },

  // Manifests
  manifests: {
    all: ['manifests'] as const,
    lists: () => [...queryKeys.manifests.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.manifests.lists(), filters] as const,
    details: () => [...queryKeys.manifests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.manifests.details(), id] as const,
    items: (manifestId: string) => [...queryKeys.manifests.all, 'items', manifestId] as const,
  },

  // Tracking
  tracking: {
    all: ['tracking'] as const,
    events: (awb: string) => [...queryKeys.tracking.all, 'events', awb] as const,
    byCN: (awb: string) => [...queryKeys.tracking.all, 'CN Number', awb] as const,
    shipment: (shipmentId: string) => [...queryKeys.tracking.all, 'shipment', shipmentId] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
    byShipment: (shipmentId: string) =>
      [...queryKeys.invoices.all, 'shipment', shipmentId] as const,
  },

  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
  },

  // Exceptions
  exceptions: {
    all: ['exceptions'] as const,
    lists: () => [...queryKeys.exceptions.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.exceptions.lists(), filters] as const,
    details: () => [...queryKeys.exceptions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.exceptions.details(), id] as const,
    byShipment: (shipmentId: string) =>
      [...queryKeys.exceptions.all, 'shipment', shipmentId] as const,
  },

  // Audit Logs
  auditLogs: {
    all: ['audit-logs'] as const,
    lists: () => [...queryKeys.auditLogs.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.auditLogs.lists(), filters] as const,
    byEntity: (entityType: string, entityId: string) =>
      [...queryKeys.auditLogs.all, entityType, entityId] as const,
  },

  // Staff
  staff: {
    all: ['staff'] as const,
    lists: () => [...queryKeys.staff.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.staff.lists(), filters] as const,
    details: () => [...queryKeys.staff.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.staff.details(), id] as const,
  },

  // Dashboard Stats
  dashboard: {
    all: ['dashboard'] as const,
    kpis: () => [...queryKeys.dashboard.all, 'kpis'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'recent-activity'] as const,
    charts: (dateRange?: { start: string; end: string }) =>
      [...queryKeys.dashboard.all, 'charts', dateRange] as const,
  },
} as const;

/**
 * Usage Examples:
 *
 * // List all shipments
 * useQuery({ queryKey: queryKeys.shipments.list() })
 *
 * // List shipments with filters
 * useQuery({ queryKey: queryKeys.shipments.list({ status: 'IN_TRANSIT' }) })
 *
 * // Get shipment by ID
 * useQuery({ queryKey: queryKeys.shipments.detail(id) })
 *
 * // Get shipment by AWB
 * useQuery({ queryKey: queryKeys.shipments.byAwb(awb) })
 *
 * // Invalidate all shipments
 * queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all })
 *
 * // Invalidate specific shipment
 * queryClient.invalidateQueries({ queryKey: queryKeys.shipments.detail(id) })
 */
