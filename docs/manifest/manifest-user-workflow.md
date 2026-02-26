# Enterprise Manifest User Workflow

## 1. Accessing the Builder
1. Navigate to the **Manifests** page from the sidebar.
2. Click the primary **"Build Manifest"** button in the top-right corner.
   - *Note: The legacy "Quick Create" option has been deprecated.*

## 2. Configuration Phase (Settings)
Before scanning, configure the manifest header details:

1. **Route Selection**:
   - Select **Origin Hub** (defaults to your current hub).
   - Select **Destination Hub**.
2. **Transport Mode**:
   - Toggle between **AIR** or **TRUCK**.
3. **Transport Details**:
   - **AIR**: Enter Airline Code (e.g., 6E), Flight No, Flight Date, ETD/ETA.
   - **TRUCK**: Enter Vehicle No, Driver Name, Driver Phone, Dispatch Time.
4. **Operational Rules**:
   - **Only READY shipments**: (Default: On) Hides shipments that are on hold or not yet received at origin.
   - **Match destination**: (Default: On) Rejects scans if the shipment destination doesn't match the manifest destination.
   - **Exclude COD**: (Default: Off) Skips COD shipments if selected.
5. Click **"Create Manifest"** to proceed to the scanning phase.

## 3. Build Phase (Scanning)
The interface switches to the scanning workspace, divided into two panels:

### Left Panel: Scanning & Info
- **Scan Input**: Always focused. Accepts AWB numbers via:
  - **Manual Entry**: Type and press Enter.
  - **USB Scanner**: Barcode scanner acting as keyboard wedge (rapid input).
  - **Camera**: (Future) Mobile camera scanning.
- **Manifest Details**: Shows current route, transport, and status.
- **Rules Indicator**: Shows active validation rules.
- **Scan Statistics**: Live counters for Added, Duplicate, and Error scans.
- **Scan Log**: Scrollable history of recent scan actions with status badges.

### Right Panel: Shipment Table
- Displays the list of manifested shipments in real-time.
- **Columns**:
  - **AWB**: Barcode number + COD badge.
  - **Consignee/Consignor**: Names and cities.
  - **Pkg**: Package count.
  - **Weight**: Actual weight.
  - **Handling**: Special instructions badge.
  - **Status**: Current shipment status + Eligibility (READY/HOLD).
- **Actions**:
  - **Remove**: Click the trash icon to remove a shipment (requires confirmation).
  - **View**: Open shipment details in a new tab.

## 4. Operational Scenarios

### Scenario A: Standard Scanning
1. Operator scans a valid AWB (e.g., `TAC12345678`).
2. System validates:
   - AWB exists.
   - Status is `READY` (Received/Created).
   - Destination matches manifest.
   - Not already manifested.
3. **Success**: Green beep, "Shipment Added" toast, item appears in table.

### Scenario B: Duplicate Scan
1. Operator scans the same AWB again.
2. **Duplicate Warning**: Amber beep, "Duplicate scan" toast.
3. Item is **NOT** added again (Idempotency protection).

### Scenario C: Error Cases
- **Wrong Destination**: Red beep, "Destination Mismatch" error.
- **Wrong Status**: Red beep, "Shipment not READY" error.
- **Unknown AWB**: Red beep, "Shipment Not Found" error.

## 5. Closing the Manifest
1. Review the **Summary Bar** at the bottom for totals (Shipments, Packages, Weight).
2. Ensure all physical cargo has been scanned.
3. Click **"Close Manifest"**.
4. Confirm the action.
   - Manifest status changes to `CLOSED`.
   - Tracking events (`DEPARTED` or `MANIFEST_CLOSED`) are generated.
   - Manifest becomes read-only.

## 6. Post-Manifesting
- The manifest now appears in the main list with `CLOSED` status.
- It can be moved to `DEPARTED` and then `ARRIVED` as the vehicle moves.
- Shipments are linked to this manifest ID for tracking.
