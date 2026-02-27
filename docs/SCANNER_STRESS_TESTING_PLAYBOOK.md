# TAC Portal — Scanner Stress Testing Playbook

This playbook documents the operational and manual testing procedures to guarantee barcode scanner stability across all critical workflows.

*This guide supplements the automated `scanner-stress.spec.ts` Playwright suite.*

---

## 1. Hardware Requirements

For physical validation, testing must be performed using:
1. **1D/2D Handheld Scanner (USB/Bluetooth)** — programmed for standard HID Keyboard Emulation.
2. **Mobile Companion Scanner (Optics)** — testing via mobile device camera.
3. **Prefix/Suffix configuration:** 
   - No Prefix. 
   - Suffix: `Enter` (`\n` or `\r`).

---

## 2. Test Scenarios

### Scenario 1: The "Machine Gun" Test (Rapid Consecutive Scans)

**Objective:** Verify that the event loop can handle back-to-back hardware scans without locking up the UI or triggering duplicate scan dialogs.
**Context location:** `/manifests` and `/shipments`.

**Execution:**
1. Connect physical scanner.
2. Generate a sheet of 20 dense test barcodes.
3. Hold the scanner trigger and sweep the sheet as fast as hardware allows.

**Pass Criteria:**
- [ ] No browser memory crash.
- [ ] UI reflects all 20 scans accurately.
- [ ] Duplicate scans are handled silently or with a single, non-stacking toast/alert.

### Scenario 2: The "Navigation Collision" Test (Listener Stacking)

**Objective:** Ensure that React component unmounting properly cleans up global scan listeners.
**Context location:** Any page with a `useScanListener` hook.

**Execution:**
1. Open `/shipments`.
2. Navigate rapidly back and forth between `/manifests`, `/shipments`, and `/finance` utilizing the sidebar links (do not use browser back/forward).
3. Stop on `/manifests`.
4. Scan a single barcode.

**Pass Criteria:**
- [ ] The barcode processes exactly ONE time.
- [ ] No "Shipment received" AND "Added to manifest" overlapping alerts.

### Scenario 3: The "Laggy Network" Test

**Objective:** Verify that quick consecutive scans during a slow Supabase RPC call do not create race conditions or database unique constraint violations.
**Context location:** Manifest Builder sidebar active.

**Execution:**
1. Open Chrome DevTools → Network tab → Throttle to "Slow 3G".
2. Open Manifest Builder sidebar.
3. Scan Barcode A, immediately scan Barcode B (before Barcode A completes).

**Pass Criteria:**
- [ ] Scan A shows loading state.
- [ ] Scan B queues or rejects gracefully until Scan A resolves.
- [ ] No Postgres `unique_violation` errors logged to console.

### Scenario 4: Focus Stealing (The "Typing" Collision)

**Objective:** Verify that typing in a search input doesn't mistakenly trigger the global scan handler.
**Context location:** Dashboard global search bar.

**Execution:**
1. Click into the global search input.
2. Rapidly type `CN-2026-0001` and press `Enter` very quickly (simulating scanner input speed).

**Pass Criteria:**
- [ ] Performs a text search.
- [ ] Does *not* trigger the global scanner routing logic (the scan listener should detect the active input focus and defer).

---

## 3. Playwright E2E Integration

Use the automated test suite before hardware validation:
```bash
npm run test:scanner-stress
```

**What the automation covers:**
- 50 consecutive virtual scans per second.
- Listener counting via component navigation.
- Memory thresholds checking (`totalJSHeapSize`).
- Context collision verifying.

**What automation CANNOT cover (Requires Playwright Manual Override):**
- Actual HID driver lag.
- Hardware parsing errors (scanner misreads).
- Lighting conditions for optical scans.
