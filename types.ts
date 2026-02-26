import React from 'react';

// --- ENUMS & CONSTANTS ---

export type HubLocation = 'IMPHAL' | 'NEW_DELHI';

export type ShipmentMode = 'AIR' | 'TRUCK' | 'OCEAN';

export type ServiceLevel = 'STANDARD' | 'EXPRESS' | 'PRIORITY';

export type PaymentMode = 'PAID' | 'TO_PAY' | 'TBB';

// Canonical Shipment Status Codes (aligned with DB CHECK constraint)
export type ShipmentStatus =
  | 'CREATED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'RECEIVED_AT_ORIGIN'
  | 'IN_TRANSIT'
  | 'RECEIVED_AT_DEST'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RTO'
  | 'EXCEPTION';

export type ManifestStatus = 'OPEN' | 'CLOSED' | 'DEPARTED' | 'ARRIVED';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'OVERDUE';

export type ExceptionType = 'DAMAGE' | 'SHORTAGE' | 'MISROUTE' | 'DELAY' | 'CUSTOMER_REFUSAL' | 'ADDRESS_ISSUE' | 'OTHER';

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'WAREHOUSE_IMPHAL'
  | 'WAREHOUSE_DELHI'
  | 'OPS'
  | 'INVOICE'
  | 'SUPPORT'
  | 'WAREHOUSE_STAFF'
  | 'OPS_STAFF'
  | 'FINANCE_STAFF'
  | 'SUPER_ADMIN';

export enum NavItem {
  DASHBOARD = 'Dashboard',
  ANALYTICS = 'Analytics',
  SHIPMENTS = 'Shipments',
  TRACKING = 'Tracking',
  MANIFESTS = 'Manifests',
  SCANNING = 'Scanning',
  INVENTORY = 'Inventory',
  EXCEPTIONS = 'Exceptions',
  FINANCE = 'Finance',
  INVOICES = 'Invoices',
  CUSTOMERS = 'Customers',
  MANAGEMENT = 'Management',
  SETTINGS = 'Settings',
}

// --- DOMAIN MODELS ---

export interface Address {
  line1: string;
  city: string;
  state: string;
  zip: string;
}

export interface Hub {
  id: HubLocation;
  name: string;
  code: string;
  address: string;
  sortCode: string;
}

export interface Customer {
  id: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  name: string;
  companyName?: string;
  phone: string;
  email: string;
  address: string; // Legacy string support
  addressDetails?: Address; // New structured
  gstin?: string;
  tier: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
  createdAt: string;
  activeContracts?: number;
  contactPerson?: string;

  // Smart features (Phase 2)
  preferences?: {
    preferredTransportMode?: 'AIR' | 'TRUCK';
    preferredPaymentMode?: 'PAID' | 'TO_PAY' | 'TBB';
    gstApplicable?: boolean;
    typicalContents?: string;
  };
  lastInvoiceAt?: string;
  invoiceCount?: number;
  avgInvoiceValue?: number;
}

export interface Package {
  id: string;
  shipmentId: string;
  packageIndex: number;
  weight: {
    dead: number;
    volumetric: number;
    chargeable: number;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  currentHubId: HubLocation;
  binLocation?: string;
  status: ShipmentStatus;
  description?: string;
}

export interface Shipment {
  id: string;
  awb: string;
  customerId: string;
  customerName: string;
  originHub: HubLocation;
  destinationHub: HubLocation;
  mode: ShipmentMode;
  serviceLevel: ServiceLevel;
  totalPackageCount: number;
  totalWeight: {
    dead: number;
    volumetric: number;
    chargeable: number;
  };
  status: ShipmentStatus;
  invoiceId?: string;
  manifestId?: string;
  createdAt: string;
  updatedAt: string;
  eta: string;
  lastUpdate?: string;

  // Expanded Fields for Invoice/Label
  consignor?: {
    name: string;
    phone: string;
    address: string;
    gstin?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  consignee?: {
    name: string;
    phone: string;
    address: string;
    gstin?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  contentsDescription?: string;
  declaredValue?: number;
  bookingDate?: string;
  paymentMode?: PaymentMode;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  awb: string;
  eventCode: ShipmentStatus;
  hubId?: HubLocation;
  description: string;
  timestamp: string;
  actorId: string;
  location?: string;
  notes?: string;
  hub?: { name: string; code: string };
  meta?: Record<string, unknown>;
}

export interface Manifest {
  id: string;
  reference: string;
  type: ShipmentMode;
  originHub: HubLocation;
  destinationHub: HubLocation;
  status: ManifestStatus;
  vehicleMeta: {
    vehicleId?: string;
    driverName?: string;
    driverPhone?: string;
    flightNumber?: string;
    carrier?: string;
    identifier?: string;
    driver?: string;
  };
  shipmentIds: string[];
  shipmentCount: number;
  totalWeight: number;
  createdBy: string;
  createdAt: string;
  departedAt?: string;
  arrivedAt?: string;
}

export interface Invoice {
  line_items?: { awb?: string; description?: string }[];
  taxes?: { cgst?: number; sgst?: number; igst?: number };
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  shipmentId: string;
  awb: string;
  status: InvoiceStatus;
  paymentMode: PaymentMode; // New
  financials: {
    ratePerKg: number;
    baseFreight: number;
    docketCharge: number;
    pickupCharge: number;
    packingCharge: number;
    fuelSurcharge: number;
    handlingFee: number;
    insurance: number;
    tax: {
      cgst: number;
      sgst: number;
      igst: number;
      total: number;
    };
    discount: number;
    totalAmount: number;
    advancePaid: number;
    balance: number;
  };
  dueDate: string;
  paidAt?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface Exception {
  id: string;
  shipmentId: string;
  awb: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  reportedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedHub?: HubLocation;
  active: boolean;
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: 'SHIPMENT' | 'MANIFEST' | 'INVOICE' | 'USER' | 'CUSTOMER';
  entityId: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

// --- LEGACY/UI COMPATIBILITY TYPES ---

export interface KPI {
  label: string;
  value: string | number;
  trend: number;
  trendDirection: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Critical';
}

// --- FILTER TYPES FOR REACT QUERY ---

export interface ShipmentFilters {
  status?: ShipmentStatus;
  originHub?: HubLocation;
  destinationHub?: HubLocation;
  customerId?: string;
  dateRange?: { start: string; end: string };
  limit?: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  customerId?: string;
  dateRange?: { start: string; end: string };
  limit?: number;
}

export interface CustomerFilters {
  type?: 'INDIVIDUAL' | 'BUSINESS';
  tier?: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
  search?: string;
  limit?: number;
}

// --- API RESPONSE TYPES ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// --- NOTES/COMMENTS SYSTEM ---

export type NoteEntityType = 'SHIPMENT' | 'INVOICE' | 'CUSTOMER' | 'EXCEPTION' | 'MANIFEST';

export interface Note {
  id: string;
  entityType: NoteEntityType;
  entityId: string;
  content: string; // HTML content from rich text editor
  plainText: string; // Plain text version for search
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isInternal?: boolean; // Internal notes not visible to customers
  attachments?: NoteAttachment[];
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface NoteFilters {
  entityType?: NoteEntityType;
  entityId?: string;
  createdBy?: string;
  isPinned?: boolean;
  search?: string;
  limit?: number;
}

export interface Booking {
  id: string;
  user_id: string | null;
  consignor_details: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    gstin?: string;
  };
  consignee_details: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    gstin?: string;
  };
  volume_matrix: Array<{
    length: number;
    width: number;
    height: number;
    weight: number;
    count: number;
  }>;
  images: string[];
  whatsapp_number?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// RE-EXPORT DOMAIN TYPES
// Consolidated from types/domain.ts for single import path
// Note: UserRole remains as union type above (used throughout the codebase);
//       the enum version lives in types/domain.ts for RBAC runtime checks
// ============================================================================
export {
  // Branded types
  type AWB,
  type UUID,
  type ManifestNumber,
  type InvoiceNumber,

  // Type guards
  isAWB,
  isUUID,

  // Enums
  HubCode,
  ScanSource,
  TrackingEventSource,

  // Scan types
  type ScanPayload,
  type ScanEvent,

  // Utility functions
  parseAWB,
  formatAWB,
} from './types/domain';
