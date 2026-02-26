# Barcode Scanning Workflow - Enterprise Documentation

## Overview

The TAC Cargo barcode scanning system is an enterprise-grade solution that provides seamless integration between hardware barcode scanners (keyboard wedge) and the web application. When a shipment barcode is scanned, the system immediately displays invoice details in a preview dialog, allowing operators to review information before navigating to the full invoice page.

## Architecture

### Core Components

1. **ScanningProvider** (`context/ScanningProvider.tsx`)
   - Single global keydown listener (capture phase)
   - Scanner detection based on keystroke timing (< 150ms intervals)
   - Early detection from 1 timing interval (2 characters)
   - Proactive `preventDefault()` to prevent character leakage
   - Debug event emission for real-time monitoring

2. **GlobalScanListener** (`components/scanning/GlobalScanListener.tsx`)
   - Single authoritative scan router
   - Opens ScanPreviewDialog instead of direct navigation
   - Respects ScanContext ownership (GLOBAL/SCANNING_PAGE/MANIFEST_BUILDER)

3. **ScanPreviewDialog** (`components/scanning/ScanPreviewDialog.tsx`)
   - **Key Feature**: Fetches and displays **INVOICE** data for shipments (not shipment data)
   - Shows invoice number, amount, customer, AWB, and route
   - Provides "View Full Details" button to navigate to Finance page
   - Supports manifest and unknown barcode formats

4. **ScanContext** (`context/ScanContext.ts`)
   - Ownership coordination to prevent conflicting handlers
   - Contexts: GLOBAL, SCANNING_PAGE, MANIFEST_BUILDER, DISABLED

5. **ScannerDebug** (`components/scanning/ScannerDebug.tsx`)
   - Real-time keystroke visualization
   - Pure subscriber (no competing keydown listener)
   - Toggle via click (no F12 hijack)

### Data Flow

```
Hardware Scanner (Keyboard Wedge)
    ↓ (10-30ms per keystroke)
ScanningProvider (Global Listener)
    ↓ (detects scanner speed)
GlobalScanListener (Scan Router)
    ↓ (checks ScanContext)
ScanPreviewDialog (Invoice Preview)
    ↓ (fetches invoice from Supabase)
User clicks "View Full Details"
    ↓
Finance Page (/finance?awb=...)
    ↓ (auto-opens invoice details)
Invoice Details Modal
```

## User Workflow

### Dashboard Scanning (Primary Use Case)

1. **Operator scans shipment barcode** (e.g., TAC20260001)
2. **Invoice Preview Dialog appears** (< 1 second)
   - Shows invoice number (e.g., INV-2026-0001)
   - Shows total amount (prominently displayed)
   - Shows customer name and phone
   - Shows AWB number
   - Shows shipment route (origin → destination)
   - Shows invoice status badge
3. **Operator reviews details**
4. **Operator clicks "View Full Details"**
5. **Navigates to Finance page** (`/finance?awb=TAC20260001`)
6. **Invoice details modal auto-opens**

### Alternative Actions

- **Copy**: Copy AWB to clipboard
- **Dismiss**: Close dialog without navigating

### Context-Aware Behavior

| Page/Context | Scan Behavior |
|--------------|---------------|
| `/dashboard` | Shows invoice preview dialog |
| `/scanning` | Local handler processes (no dialog) |
| ManifestBuilder open | Local handler adds to manifest (no dialog) |
| `/manifests` | Shows manifest preview dialog (for MAN codes) |

## Scanner Detection

### Hardware Scanner Characteristics
- **Type**: Keyboard wedge (HID keyboard device)
- **Speed**: 10-30ms between keystrokes
- **Format**: Sends characters + Enter key (or auto-submit after 100ms)

### Detection Algorithm
```typescript
function isScannerSpeed(timings: number[]): boolean {
  if (timings.length === 0) return false;
  
  // Calculate average timing
  const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
  
  // Scanner if average < 150ms OR 70%+ of intervals < 150ms
  return avg < SCANNER_SPEED_THRESHOLD_MS || 
         timings.filter(t => t < SCANNER_SPEED_THRESHOLD_MS).length / timings.length > 0.7;
}
```

### Early Detection (Character Leakage Prevention)
- Triggers from **1 timing interval** (2 characters)
- Reduces character leakage from 3 chars → 2 chars
- First character unavoidable (no timing data yet)

## Error Handling

### Shipment Not Found
```
Error: "Shipment not found: TAC99999999"
Action: Shows error in dialog, allows copy/dismiss
```

### Invoice Not Found
```
Error: "No invoice found for shipment TAC20260001"
Action: Shows error in dialog, allows copy/dismiss
```

### Unknown Barcode Format
```
Input: "UNKNOWN123"
Action: Shows "Barcode Scanned" dialog with copy option
Message: "This barcode format is not recognized as a shipment (TAC...) or manifest (MAN...)."
```

## Testing

### Running Playwright Tests

```bash
# Run all scanning workflow tests
npm run test -- barcode-scanning-workflow.spec.ts

# Run specific test suite
npm run test -- barcode-scanning-workflow.spec.ts -g "Dashboard Scanning"

# Run in headed mode (see browser)
npm run test:headed -- barcode-scanning-workflow.spec.ts

# Run in debug mode
npm run test:debug -- barcode-scanning-workflow.spec.ts

# Run with UI mode (interactive)
npm run test:ui -- barcode-scanning-workflow.spec.ts
```

### Test Coverage

The comprehensive test suite (`tests/e2e/barcode-scanning-workflow.spec.ts`) covers:

1. **Dashboard Scanning - Invoice Preview**
   - Scanner detection and dialog display
   - Invoice number and amount display
   - Customer and AWB information
   - Shipment route display
   - Navigation to invoice page
   - Copy to clipboard
   - Dismiss without navigation

2. **Error Handling**
   - Invoice not found
   - Shipment not found
   - Unknown barcode format

3. **Manifest Scanning**
   - Manifest preview display
   - Navigation to manifests page

4. **Context-Aware Scanning**
   - No dialog on /scanning page
   - No dialog when ManifestBuilder open

5. **Scanner Detection**
   - Rapid keystroke detection
   - Manual typing rejection

6. **Loading States**
   - Loading indicator display

7. **UI/UX Polish**
   - Dialog styling and animations
   - Accessible close button
   - Status badge colors

8. **Performance**
   - Rapid consecutive scans
   - Memory leak prevention

9. **Scanner Debug Panel**
   - Real-time keystroke capture

### Manual Testing Checklist

- [ ] Scan shipment barcode on dashboard
- [ ] Verify invoice preview appears (not shipment preview)
- [ ] Verify invoice amount is prominently displayed
- [ ] Click "View Full Details" → navigates to Finance page
- [ ] Verify invoice details modal auto-opens
- [ ] Test "Copy" button
- [ ] Test "Dismiss" button
- [ ] Scan non-existent AWB → verify error message
- [ ] Scan unknown barcode → verify unknown format handling
- [ ] Scan manifest barcode → verify manifest preview
- [ ] Test on /scanning page → verify no dialog (local handler)
- [ ] Open ManifestBuilder → scan → verify no dialog
- [ ] Test rapid consecutive scans
- [ ] Open Scanner Debug panel → verify keystroke capture

## Configuration

### Scanner Speed Threshold
```typescript
// context/ScanningProvider.tsx
const SCANNER_SPEED_THRESHOLD_MS = 150; // Configurable
```

### Auto-Submit Delay
```typescript
// For scanners that don't send Enter key
const AUTO_SUBMIT_DELAY_MS = 100; // Configurable
```

### Buffer Stale Timeout
```typescript
// Reset buffer if no key for this duration
const BUFFER_STALE_TIMEOUT_MS = 1000; // Configurable
```

### Minimum Scan Length
```typescript
// Minimum characters to consider as valid scan
const MIN_SCAN_LENGTH = 3; // Configurable
```

## Troubleshooting

### Issue: Characters appearing in input fields
**Cause**: Scanner speed threshold too high or detection not triggering early enough
**Solution**: Lower `SCANNER_SPEED_THRESHOLD_MS` or check scanner speed with debug panel

### Issue: Scanner not detected
**Cause**: Scanner speed too slow or threshold too low
**Solution**: Increase `SCANNER_SPEED_THRESHOLD_MS` or check scanner configuration

### Issue: Dialog shows shipment details instead of invoice
**Cause**: Old version of ScanPreviewDialog
**Solution**: Verify `ScanPreviewDialog.tsx` fetches invoice data (not shipment data)

### Issue: Dialog appears on /scanning page
**Cause**: ScanContext not registered
**Solution**: Verify `/scanning` page calls `setActiveContext('SCANNING_PAGE')`

### Issue: Multiple dialogs appear
**Cause**: Duplicate ScannerDebug or competing listeners
**Solution**: Ensure only one ScannerDebug per page, check for duplicate event listeners

## Performance Considerations

### Memory Management
- Dialog state is cleared on close
- Supabase queries use `maybeSingle()` to avoid over-fetching
- Event listeners are properly cleaned up on unmount

### Network Optimization
- Invoice data fetched only when dialog opens
- Shipment data fetched separately (optional for route display)
- Uses React Query caching on Finance page

### Rendering Optimization
- Dialog uses `animate-in` for smooth transitions
- Loading states prevent layout shift
- Debounced scanner input prevents excessive re-renders

## Security Considerations

### Data Access
- Invoice queries respect RLS (Row Level Security) policies
- Only accessible invoices are displayed
- Deleted invoices are filtered out (`is('deleted_at', null)`)

### Input Validation
- Barcode format validation (TAC..., MAN...)
- SQL injection prevention via Supabase parameterized queries
- XSS prevention via React's automatic escaping

## Future Enhancements

### Planned Features
- [ ] Offline scanning support (queue scans when offline)
- [ ] Scan history tracking
- [ ] Barcode format customization
- [ ] Multi-scanner support
- [ ] Scan analytics dashboard
- [ ] Voice feedback on scan
- [ ] Haptic feedback (mobile)
- [ ] QR code support
- [ ] Batch scanning mode

### Performance Improvements
- [ ] Prefetch invoice data on hover
- [ ] WebSocket real-time updates
- [ ] Service worker caching
- [ ] Progressive Web App (PWA) support

## Support

### Debug Mode
Enable debug mode to see detailed scanner detection logs:
```typescript
// context/ScanningProvider.tsx
const DEBUG_MODE = true; // Set to true for debugging
```

### Scanner Debug Panel
Click "Scanner Debug" badge (bottom-right) to see:
- Real-time keystroke capture
- Buffer contents
- Timing analysis
- Scanner detection status
- Last scan result

### Logs
All scanner events are logged with `console.debug`:
- `[ScanningProvider] Scanner detected - submitting: ...`
- `[GlobalScanListener] Scan received: ...`
- `[GlobalScanListener] Skipping - local context active: ...`

## Version History

### v2.0.0 (Feb 2026) - Invoice Preview Update
- **Breaking Change**: ScanPreviewDialog now shows invoice data instead of shipment data
- Added `useInvoiceByAWB` hook
- Finance page supports `?awb=` URL parameter
- Comprehensive Playwright test suite
- Enterprise-grade UI polish

### v1.0.0 (Feb 2026) - Initial Release
- Scanner detection and preview dialog
- Context-aware scanning
- Debug panel
- Manifest support
