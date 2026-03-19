// StatusBadge — canonical premium version (CVA, all statuses)
export {
  StatusBadge,
  statusBadgeVariants,
  getStatusBadgeClass,
  getStatusLabel,
  STATUS_LABELS,
  STATUS_ICONS,
} from './status-badge';
export type { StatusBadgeProps } from './status-badge';

export { TrackingTimeline } from './TrackingTimeline';
export { ShipmentCard } from './ShipmentCard';
export { ShippingLabel, PrintableLabel } from './ShippingLabel';
export { CommandPalette, useCommandPalette } from './CommandPalette';

export { ShipmentTimeline } from './shipment-timeline';
export type { ShipmentTimelineProps, TimelineEvent } from './shipment-timeline';

export { WarehouseScanPanel } from './warehouse-scan-panel';
export type {
  WarehouseScanPanelProps,
  ScanResult,
  ScanResultStatus,
  RecentScan,
} from './warehouse-scan-panel';

export { DeliveryConfirmation } from './delivery-confirmation';
export type { DeliveryConfirmationProps, DeliveryData } from './delivery-confirmation';
