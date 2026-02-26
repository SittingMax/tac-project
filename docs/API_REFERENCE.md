# TAC Cargo API Reference

Complete reference for all types, interfaces, stores, hooks, services, and utilities in the TAC Cargo Enterprise Portal.

**Version:** 2.0  
**Last Updated:** January 2026  
**Stack:** React 19 + Vite + TypeScript + Supabase + TanStack Query + Zustand

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Type Definitions](#type-definitions)
3. [Supabase Client & Authentication](#supabase-client--authentication)
4. [React Query Hooks](#react-query-hooks)
5. [Services Layer](#services-layer)
6. [Zustand Stores](#zustand-stores)
7. [Utility Functions](#utility-functions)
8. [Constants & Design Tokens](#constants--design-tokens)

---

## Architecture Overview

### Data Flow Pattern

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   UI Component  │────▶│  React Query    │────▶│    Service      │
│   (pages/*)     │     │  Hooks          │     │    Layer        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │    Supabase     │
                                               │    Client       │
                                               └─────────────────┘
```

### Key Architectural Rules

| Rule | Description |
|------|-------------|
| **No Direct Supabase in Pages** | UI pages must use React Query hooks, never call Supabase directly |
| **Org Scoping** | All queries must include `org_id` filter via RLS or explicit parameter |
| **UUID as PK** | All tables use UUID primary keys; AWB is indexed business key only |
| **Branded Types** | Use branded types (`AWB`, `UUID`) to prevent type mixing |

---

## Type Definitions

### Location: `types/domain.ts`

#### Branded Types

```typescript
type AWB = Brand<string, 'AWB'>;
type UUID = Brand<string, 'UUID'>;
type ManifestNumber = Brand<string, 'ManifestNumber'>;
type InvoiceNumber = Brand<string, 'InvoiceNumber'>;

// Type Guards
const isAWB = (value: string): value is AWB => /^TAC\d{8}$/.test(value);
const isUUID = (value: string): value is UUID =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
```

#### Enums

```typescript
enum HubCode {
    IMPHAL = 'IMPHAL',
    NEW_DELHI = 'NEW_DELHI',
}

enum ShipmentStatus {
    CREATED = 'CREATED',
    PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
    PICKED_UP = 'PICKED_UP',
    RECEIVED_AT_ORIGIN = 'RECEIVED_AT_ORIGIN',
    IN_TRANSIT = 'IN_TRANSIT',
    RECEIVED_AT_DEST = 'RECEIVED_AT_DEST',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    RTO = 'RTO',
    EXCEPTION = 'EXCEPTION',
}

enum ManifestStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    DEPARTED = 'DEPARTED',
    ARRIVED = 'ARRIVED',
}

enum InvoiceStatus {
    DRAFT = 'DRAFT',
    ISSUED = 'ISSUED',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
    OVERDUE = 'OVERDUE',
}

enum ExceptionType {
    DAMAGED = 'DAMAGED',
    LOST = 'LOST',
    DELAYED = 'DELAYED',
    MISMATCH = 'MISMATCH',
    PAYMENT_HOLD = 'PAYMENT_HOLD',
    MISROUTED = 'MISROUTED',
    ADDRESS_ISSUE = 'ADDRESS_ISSUE',
}

enum ExceptionSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    WAREHOUSE_IMPHAL = 'WAREHOUSE_IMPHAL',
    WAREHOUSE_DELHI = 'WAREHOUSE_DELHI',
    OPS = 'OPS',
    INVOICE = 'INVOICE',
    SUPPORT = 'SUPPORT',
}

enum TransportMode {
    AIR = 'AIR',
    TRUCK = 'TRUCK',
}

enum ServiceLevel {
    STANDARD = 'STANDARD',
    EXPRESS = 'EXPRESS',
}

enum PaymentMode {
    PAID = 'PAID',
    TO_PAY = 'TO_PAY',
    TBB = 'TBB',
}

enum TrackingEventSource {
    SCAN = 'SCAN',
    MANUAL = 'MANUAL',
    SYSTEM = 'SYSTEM',
    API = 'API',
}
```

#### Domain Interfaces

```typescript
interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
}

interface ContactInfo {
    name: string;
    phone: string;
    email?: string;
    address: Address;
    gstin?: string;
}

interface Weight {
    dead: number;
    volumetric: number;
    chargeable: number;
}

interface TaxBreakdown {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}

interface Financials {
    ratePerKg: number;
    baseFreight: number;
    docketCharge: number;
    pickupCharge: number;
    packingCharge: number;
    fuelSurcharge: number;
    handlingFee: number;
    insurance: number;
    tax: TaxBreakdown;
    discount: number;
    totalAmount: number;
    advancePaid: number;
    balance: number;
}
```

#### Status Transition Rules

```typescript
// Valid shipment transitions
const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
    CREATED: [PICKUP_SCHEDULED, CANCELLED],
    PICKUP_SCHEDULED: [PICKED_UP, CANCELLED],
    PICKED_UP: [RECEIVED_AT_ORIGIN, EXCEPTION],
    RECEIVED_AT_ORIGIN: [IN_TRANSIT, EXCEPTION],
    IN_TRANSIT: [RECEIVED_AT_DEST, EXCEPTION],
    RECEIVED_AT_DEST: [OUT_FOR_DELIVERY, EXCEPTION],
    OUT_FOR_DELIVERY: [DELIVERED, RTO, EXCEPTION],
    DELIVERED: [],
    CANCELLED: [],
    RTO: [RECEIVED_AT_ORIGIN],
    EXCEPTION: [RECEIVED_AT_ORIGIN, RECEIVED_AT_DEST, CANCELLED],
};

// Validate transition
function isValidShipmentTransition(from: ShipmentStatus, to: ShipmentStatus): boolean;
function isValidManifestTransition(from: ManifestStatus, to: ManifestStatus): boolean;
```

---

## Supabase Client & Authentication

### Location: `lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabase = createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Check if configured
export const isSupabaseConfigured = (): boolean;

// Auth helpers
export const signIn = async (email: string, password: string): Promise<AuthData>;
export const signOut = async (): Promise<void>;
export const getCurrentUser = async (): Promise<User | null>;

// Realtime subscription helper
export const subscribeToTable = <T>(
    table: string,
    callback: (payload: T) => void,
    filter?: string
): () => void;
```

### Auth Store

**Location:** `store/authStore.ts`

```typescript
interface StaffUser {
    id: string;
    authUserId: string;
    email: string;
    fullName: string;
    role: UserRole;
    hubId: string | null;
    hubCode: string | null;
    orgId: string;
    isActive: boolean;
}

interface AuthState {
    session: Session | null;
    user: StaffUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

// Usage
const { user, isAuthenticated, signIn, signOut } = useAuthStore();

// Role check hooks
function useHasRole(roles: UserRole | UserRole[]): boolean;
function useCanAccessModule(module: string): boolean;
```

---

## React Query Hooks

### Query Keys

**Location:** `lib/queryKeys.ts`

```typescript
export const queryKeys = {
    shipments: {
        all: ['shipments'],
        lists: () => [...queryKeys.shipments.all, 'list'],
        list: (filters?) => [...queryKeys.shipments.lists(), filters],
        details: () => [...queryKeys.shipments.all, 'detail'],
        detail: (id: string) => [...queryKeys.shipments.details(), id],
        byAwb: (awb: string) => [...queryKeys.shipments.all, 'awb', awb],
    },
    manifests: {
        all: ['manifests'],
        list: (filters?) => [...queryKeys.manifests.all, 'list', filters],
        detail: (id: string) => [...queryKeys.manifests.all, 'detail', id],
        items: (manifestId: string) => [...queryKeys.manifests.all, 'items', manifestId],
    },
    tracking: {
        all: ['tracking'],
        events: (awb: string) => [...queryKeys.tracking.all, 'events', awb],
        shipment: (shipmentId: string) => [...queryKeys.tracking.all, 'shipment', shipmentId],
    },
    invoices: {
        all: ['invoices'],
        list: (filters?) => [...queryKeys.invoices.all, 'list', filters],
        detail: (id: string) => [...queryKeys.invoices.all, 'detail', id],
        byShipment: (shipmentId: string) => [...queryKeys.invoices.all, 'shipment', shipmentId],
    },
    customers: {
        all: ['customers'],
        list: (filters?) => [...queryKeys.customers.all, 'list', filters],
        detail: (id: string) => [...queryKeys.customers.all, 'detail', id],
    },
    exceptions: {
        all: ['exceptions'],
        list: (filters?) => [...queryKeys.exceptions.all, 'list', filters],
        detail: (id: string) => [...queryKeys.exceptions.all, 'detail', id],
        byShipment: (shipmentId: string) => [...queryKeys.exceptions.all, 'shipment', shipmentId],
    },
    auditLogs: {
        all: ['audit-logs'],
        list: (filters?) => [...queryKeys.auditLogs.all, 'list', filters],
        byEntity: (entityType: string, entityId: string) => [...queryKeys.auditLogs.all, entityType, entityId],
    },
    staff: {
        all: ['staff'],
        list: (filters?) => [...queryKeys.staff.all, 'list', filters],
        detail: (id: string) => [...queryKeys.staff.all, 'detail', id],
    },
    dashboard: {
        all: ['dashboard'],
        kpis: () => [...queryKeys.dashboard.all, 'kpis'],
        recentActivity: () => [...queryKeys.dashboard.all, 'recent-activity'],
        charts: (dateRange?) => [...queryKeys.dashboard.all, 'charts', dateRange],
    },
};
```

### Shipment Hooks

**Location:** `hooks/useShipments.ts`

```typescript
interface ShipmentWithRelations {
    id: string;
    org_id: string;
    awb_number: string;
    customer_id: string;
    origin_hub_id: string;
    destination_hub_id: string;
    mode: 'AIR' | 'TRUCK';
    service_level: 'STANDARD' | 'EXPRESS';
    status: string;
    package_count: number;
    total_weight: number;
    declared_value: number | null;
    consignee_name: string;
    consignee_phone: string;
    consignee_address: Json;
    created_at: string;
    updated_at: string;
    customer?: { name: string; phone: string };
    origin_hub?: { code: string; name: string };
    destination_hub?: { code: string; name: string };
}

// List shipments
function useShipments(options?: { 
    limit?: number; 
    status?: string 
}): UseQueryResult<ShipmentWithRelations[]>;

// Get by AWB
function useShipmentByAWB(awb: string | null): UseQueryResult<ShipmentWithRelations>;

// Create shipment
function useCreateShipment(): UseMutationResult<Shipment, Error, CreateShipmentInput>;

// Update shipment status
function useUpdateShipmentStatus(): UseMutationResult<Shipment, Error, {
    id: string;
    status: string;
    description?: string;
}>;
```

### Tracking Hooks

**Location:** `hooks/useTrackingEvents.ts`

```typescript
interface TrackingEvent {
    id: string;
    org_id: string;
    shipment_id: string;
    awb_number: string;
    event_code: string;
    event_time: string;
    hub_id: string | null;
    actor_staff_id: string | null;
    source: 'SCAN' | 'MANUAL' | 'SYSTEM' | 'API';
    meta: Json;
    created_at: string;
}

// Get tracking events
function useTrackingEvents(shipmentId: string): UseQueryResult<TrackingEvent[]>;

// Create tracking event
function useCreateTrackingEvent(): UseMutationResult<TrackingEvent, Error, {
    shipment_id: string;
    awb_number: string;
    event_code: string;
    hub_id?: string;
    source: string;
    notes?: string;
}>;
```

### Customer Hooks

**Location:** `hooks/useCustomers.ts`

```typescript
interface Customer {
    id: string;
    org_id: string;
    customer_code: string;
    name: string;
    type: 'INDIVIDUAL' | 'BUSINESS' | 'CORPORATE';
    phone: string;
    email: string | null;
    gstin: string | null;
    address: Json;
    is_active: boolean;
    created_at: string;
}

function useCustomers(): UseQueryResult<Customer[]>;
function useCustomer(id: string): UseQueryResult<Customer>;
function useCreateCustomer(): UseMutationResult<Customer, Error, CreateCustomerInput>;
function useUpdateCustomer(): UseMutationResult<Customer, Error, UpdateCustomerInput>;
```

### Invoice Hooks

**Location:** `hooks/useInvoices.ts`

```typescript
interface Invoice {
    id: string;
    org_id: string;
    invoice_no: string;
    customer_id: string;
    shipment_id: string | null;
    status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'OVERDUE';
    issue_date: string;
    due_date: string | null;
    subtotal: number;
    tax_amount: number;
    discount: number;
    total: number;
    line_items: Json;
    notes: string | null;
    created_at: string;
}

function useInvoices(filters?: InvoiceFilters): UseQueryResult<Invoice[]>;
function useInvoice(id: string): UseQueryResult<Invoice>;
function useCreateInvoice(): UseMutationResult<Invoice, Error, CreateInvoiceInput>;
function useUpdateInvoiceStatus(): UseMutationResult<Invoice, Error, {
    id: string;
    status: InvoiceStatus;
}>;
```

### Manifest Hooks

**Location:** `hooks/useManifests.ts`

```typescript
interface Manifest {
    id: string;
    org_id: string;
    manifest_no: string;
    type: 'AIR' | 'TRUCK';
    from_hub_id: string;
    to_hub_id: string;
    status: 'OPEN' | 'CLOSED' | 'DEPARTED' | 'ARRIVED';
    total_shipments: number;
    total_weight: number;
    created_by_staff_id: string;
    created_at: string;
    from_hub?: { code: string; name: string };
    to_hub?: { code: string; name: string };
}

function useManifests(filters?: ManifestFilters): UseQueryResult<Manifest[]>;
function useManifest(id: string): UseQueryResult<Manifest>;
function useManifestItems(manifestId: string): UseQueryResult<ManifestItem[]>;
function useCreateManifest(): UseMutationResult<Manifest, Error, CreateManifestInput>;
function useAddShipmentToManifest(): UseMutationResult<void, Error, {
    manifestId: string;
    shipmentId: string;
}>;
function useCloseManifest(): UseMutationResult<Manifest, Error, string>;
```

---

## Services Layer

### Location: `lib/services/`

### Org Service

**File:** `lib/services/orgService.ts`

```typescript
export const orgService = {
    setCurrentOrg(orgId: string): void;
    getCurrentOrgId(): string;
    
    async getOrgs(): Promise<Org[]>;
    async getOrg(id: string): Promise<Org>;
    async getHubs(): Promise<Hub[]>;
    async getHub(id: string): Promise<Hub>;
    async getHubByCode(code: 'IMPHAL' | 'NEW_DELHI'): Promise<Hub>;
};
```

### Shipment Service

**File:** `lib/services/shipmentService.ts`

```typescript
interface ShipmentFilters {
    status?: string;
    originHubId?: string;
    destinationHubId?: string;
    customerId?: string;
    search?: string;
    limit?: number;
}

export const shipmentService = {
    async list(filters?: ShipmentFilters): Promise<ShipmentWithRelations[]>;
    async getById(id: string): Promise<ShipmentWithRelations>;
    async getByAwb(awb: string): Promise<ShipmentWithRelations | null>;
    async create(shipment: Omit<ShipmentInsert, 'org_id'>): Promise<Shipment>;
    async update(id: string, updates: ShipmentUpdate): Promise<Shipment>;
    async updateStatus(
        id: string, 
        status: string, 
        meta?: { description?: string; hubId?: string }
    ): Promise<Shipment>;
    async delete(id: string): Promise<void>;
    async getStats(): Promise<{
        total: number;
        inTransit: number;
        delivered: number;
        exceptions: number;
    }>;
};
```

### Customer Service

**File:** `lib/services/customerService.ts`

```typescript
export const customerService = {
    async list(): Promise<Customer[]>;
    async getById(id: string): Promise<Customer>;
    async create(customer: CustomerInsert): Promise<Customer>;
    async update(id: string, updates: CustomerUpdate): Promise<Customer>;
    async delete(id: string): Promise<void>;
};
```

---

## Zustand Stores

### App Store

**Location:** `store/index.ts`

```typescript
interface AppState {
    user: User | null;
    currentNav: NavItem;
    sidebarCollapsed: boolean;
    isAuthenticated: boolean;
    theme: 'dark' | 'light';
    
    login: (user: User) => void;
    logout: () => void;
    setNav: (nav: NavItem) => void;
    toggleSidebar: () => void;
    toggleTheme: () => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // ... implementation
        }),
        { name: 'tac-storage' }
    )
);
```

### Management Store

**Location:** `store/managementStore.ts`

```typescript
interface ManagementState {
    users: User[];
    isLoading: boolean;
    
    fetchUsers: () => Promise<void>;
    addUser: (user: Partial<User>) => Promise<void>;
    toggleUserStatus: (id: string, currentStatus: boolean) => Promise<void>;
}

export const useManagementStore = create<ManagementState>();
```

### Audit Store

**Location:** `store/auditStore.ts`

```typescript
interface AuditState {
    logs: AuditLog[];
    isLoading: boolean;
    
    fetchLogs: (filters?: AuditLogFilters) => Promise<void>;
}

export const useAuditStore = create<AuditState>();
```

---

## Utility Functions

### Error Handling

**Location:** `lib/errors.ts`

```typescript
// Map Supabase errors to user-friendly messages
function mapSupabaseError(error: PostgrestError): AppError;

// Validation error class
class ValidationError extends Error {
    constructor(message: string, details?: Record<string, any>);
}

// Get error message from unknown error type
function getErrorMessage(err: unknown): string;
```

### Class Name Utility

**Location:** `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes with conflict resolution
export function cn(...inputs: ClassValue[]): string;
```

### Currency & Date Formatting

```typescript
// Format as Indian Rupees
function formatCurrency(amount: number): string;
// Example: formatCurrency(1500) → "₹1,500.00"

// Format ISO date string
function formatDate(dateString: string): string;
// Example: formatDate('2026-01-22T10:30:00Z') → "22 Jan 2026, 10:30"

// Format relative time
function formatRelativeTime(dateString: string): string;
// Example: formatRelativeTime('...') → "2 hours ago"
```

### Freight Calculation

```typescript
interface FreightCharges {
    ratePerKg: number;
    baseFreight: number;
    fuelSurcharge: number;
    handlingFee: number;
    insurance: number;
    docketCharge: number;
    pickupCharge: number;
    packingCharge: number;
    tax: TaxBreakdown;
    discount: number;
    totalAmount: number;
    advancePaid: number;
    balance: number;
}

function calculateFreight(
    weight: number, 
    mode: 'AIR' | 'TRUCK', 
    service: 'STANDARD' | 'EXPRESS'
): FreightCharges;
```

### AWB Parsing

**Location:** `types/domain.ts`

```typescript
// Parse AWB from various formats
function parseAWB(input: string): AWB | null;

// Format AWB for display
function formatAWB(awb: AWB | string): string;
```

---

## Constants & Design Tokens

### Location: `lib/constants.ts`

```typescript
export const HUBS: Record<HubCode, Hub> = {
    IMPHAL: {
        id: 'IMPHAL',
        name: 'Imphal Hub',
        code: 'IMF',
        address: 'Tulihal Airport Road, Imphal, Manipur 795001',
        sortCode: 'SUR'
    },
    NEW_DELHI: {
        id: 'NEW_DELHI',
        name: 'New Delhi Hub',
        code: 'DEL',
        address: 'Cargo Terminal 3, IGI Airport, New Delhi 110037',
        sortCode: 'GAUA'
    }
};

export const SHIPMENT_MODES = [
    { id: 'AIR', label: 'Air Cargo' },
    { id: 'TRUCK', label: 'Truck Linehaul' }
];

export const SERVICE_LEVELS = [
    { id: 'STANDARD', label: 'Standard (3-5 Days)' },
    { id: 'EXPRESS', label: 'Express (1-2 Days)' }
];

export const PAYMENT_MODES = [
    { id: 'PAID', label: 'Paid (Prepaid)' },
    { id: 'TO_PAY', label: 'To Pay (Collect)' },
    { id: 'TBB', label: 'TBB (To Be Billed)' }
];

export const INDIAN_STATES: string[];  // 36 states/UTs
export const POPULAR_CITIES: string[]; // 23 cities
export const CONTENT_TYPES: string[];  // 12 content categories
```

### Design Tokens

**Location:** `lib/design-tokens.ts`

```typescript
export const STATUS_COLORS: Partial<Record<ShipmentStatus, string>> = {
    CREATED: 'badge--created',
    PICKUP_SCHEDULED: 'badge--created',
    PICKED_UP: 'badge--manifested',
    RECEIVED_AT_ORIGIN: 'badge--manifested',
    IN_TRANSIT: 'badge--in-transit',
    RECEIVED_AT_DEST: 'badge--arrived',
    OUT_FOR_DELIVERY: 'badge--in-transit',
    DELIVERED: 'badge--delivered',
    CANCELLED: 'badge--cancelled',
    RTO: 'badge--returned',
    EXCEPTION: 'badge--exception',
};

export const ANIMATION_VARIANTS = {
    fadeIn: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    },
    slideIn: {
        initial: { x: -20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
    }
};

export const CHART_COLORS = {
    primary: 'var(--accent-primary)',
    secondary: 'oklch(var(--status-info))',
    success: 'oklch(var(--status-success))',
    warning: 'oklch(var(--status-warning))',
    error: 'oklch(var(--status-error))',
    info: 'oklch(var(--status-info))',
    neutral: 'oklch(var(--status-neutral))',
    danger: 'oklch(var(--status-error))',
    background: 'transparent',
    grid: 'var(--border-subtle)',
    axis: 'var(--text-muted)',
};
```

---

## Database Types

### Location: `lib/database.types.ts`

Auto-generated from Supabase using:

```bash
npx supabase gen types typescript --project-id xkkhxhgkyavxcfgeojww > lib/database.types.ts
```

Key tables:
- `orgs` - Multi-tenant organizations
- `hubs` - Operational locations
- `staff` - User accounts with roles
- `customers` - Customer records
- `shipments` - Core shipment entities
- `packages` - Individual package units
- `manifests` - Dispatch batches
- `manifest_items` - Shipment-manifest junction
- `tracking_events` - Immutable tracking history
- `invoices` - Finance documents
- `exceptions` - Problem tracking
- `audit_logs` - Compliance trail

---

## Feature Flags

**Location:** `config/features.ts`

```typescript
export const features = {
    ENABLE_FINANCE: true,
    ENABLE_INVENTORY: true,
    ENABLE_EXCEPTIONS: true,
    ENABLE_EMAIL_INVOICES: true,
    ENABLE_OFFLINE_SCANNING: true,
    ENABLE_REALTIME: true,
};

export const isFeatureEnabled = (feature: keyof typeof features): boolean;
```

---

*Last updated: January 2026*
