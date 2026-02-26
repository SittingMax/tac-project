# Enterprise Manifest Architecture

## Overview

The Enterprise Manifest module is designed to support high-volume, scan-first cargo operations. It replaces the legacy selection-based workflow with an industry-standard AWB scanning process, ensuring data accuracy, idempotency, and operational efficiency.

## Core Components

### 1. Database Schema (Supabase/PostgreSQL)

The architecture relies on a robust relational schema with strict constraints:

- `manifests`: The core entity representing a linehaul movement (AIR/TRUCK).
  - `manifest_no`: Server-side generated unique identifier (e.g., `MAN-2024-00001`).
  - `status`: State machine (`DRAFT` → `BUILDING` → `OPEN` → `CLOSED` → `DEPARTED` → `ARRIVED` → `RECONCILED`).
  - `vehicle_meta`: JSONB field for transport-specific details (flight no, driver, etc.).
  - Extended columns: `flight_number`, `airline_code`, `etd`, `eta`, `vehicle_number`, `dispatch_at`.

- **`manifest_items`**: Junction table linking manifests to shipments.
  - **Unique Constraint**: `UNIQUE(manifest_id, shipment_id)` ensures a shipment cannot be added twice to the same manifest.
  - Audit columns: `scanned_at`, `scanned_by_staff_id`.

- **`manifest_scan_logs`**: Audit trail for every scan action.
  - Records `raw_scan_token`, `scan_result` (SUCCESS, DUPLICATE, ERROR), and `scan_source`.
  - Vital for operational debugging and staff accountability.

- **`manifest_containers`** (Phase 2): Support for ULDs/Bags hierarchically within a manifest.

### 2. Service Layer (`lib/services/manifestService.ts`)

The service layer encapsulates business logic and database interactions:

- **Atomic Operations**: Uses PostgreSQL RPC functions (`manifest_add_shipment_by_scan`) for concurrency-safe additions.
- **Idempotency**: The RPC function handles duplicate scans gracefully, returning a "success: true, duplicate: true" response rather than an error.
- **Validation**:
  - **Status Check**: Only `READY` (Received/Created) shipments can be manifested.
  - **Destination Check**: Shipment destination must match manifest destination (configurable).
  - **Lifecycle Check**: Items can only be added to `OPEN/BUILDING` manifests.

### 3. UI Architecture (React + Shadcn/UI)

The frontend is built with modular, composable components:

#### Container
- **`ManifestBuilder`**: The orchestrator modal managing the "Create" and "Build" phases. It holds the state for the active manifest and coordinates sub-components.

#### Components
- **`ManifestSettingsForm`**: Configuration form for route and transport details. Uses `react-hook-form` + `zod` validation.
- **`ManifestScanPanel`**: The primary input interface.
  - Supports Manual entry, Keyboard Wedge (USB Scanner), and Camera (future).
  - Provides real-time audio/visual feedback (Green=Success, Amber=Duplicate, Red=Error).
  - Displays session scan statistics.
- **`ManifestScanLog`**: A scrollable history of recent scans for immediate operator verification.
- **`ManifestShipmentsTable`**: A dense, information-rich table showing manifested items.
  - Columns: AWB, Consignee, Pkg, Weight, Handling, Status.
  - Features: Sorting, Removal (with audit), Summary footer.
- **`ManifestSummaryBar`**: Sticky footer showing live totals (Shipments, Packages, Weight, COD) and the "Close Manifest" action.

### 4. Hooks & State Management

- **`useManifestBuilder`**: High-level hook managing the manifest lifecycle (create, scan, close).
- **`useManifestScan`**: Dedicated hook for barcode input handling.
  - Implements keyboard wedge detection (rapid keypresses ending in Enter).
  - Handles debouncing and parsing (via `scanParser`).
- **`useScanInput`**: Connects the UI input field to the scanning logic.

## Data Flow

1. **Initialization**: User clicks "Build Manifest" -> `ManifestBuilder` opens in "Settings" phase.
2. **Creation**: User submits settings -> `createManifest` RPC called -> Manifest created -> Phase switches to "Build".
3. **Scanning**:
   - Operator scans barcode -> `useManifestScan` captures input.
   - Input parsed -> `manifest_add_shipment_by_scan` RPC called.
   - **DB**: Checks constraints, inserts item, logs scan, updates totals.
   - **UI**: Optimistic update or Toast feedback based on RPC result.
4. **Closure**: User clicks "Close Manifest" -> `updateStatus` called -> Manifest marked `CLOSED` -> Tracking events generated.

## Security & Permissions

- **RLS (Row Level Security)**: All tables are protected by RLS policies enforcing Tenant (`org_id`) isolation.
- **Role Access**: Only `ADMIN`, `MANAGER`, `OPS`, and `WAREHOUSE` roles can create/edit manifests.

## Future Extensibility

- **Containerization**: The schema supports adding items to specific containers (ULDs) within a manifest.
- **Mobile Scanning**: The `ManifestScanPanel` is responsive and ready for camera integration.
