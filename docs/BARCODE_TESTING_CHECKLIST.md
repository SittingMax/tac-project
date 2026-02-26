# Barcode Testing Checklist

**Date:** 2026-02-17  
**Tester:** ___________  
**Scanner Model:** Helett HT20 Wireless (2.4GHz USB)

---

## Pre-Testing Setup

- [ ] USB receiver plugged into computer
- [ ] Scanner powered on (green light visible)
- [ ] Application running at http://localhost:5173
- [ ] Logged in as authorized user
- [ ] Browser console open for debugging

---

## 1. Scanner Hardware Tests

### Basic Functionality
- [ ] Scanner beeps when trigger pressed
- [ ] Green LED blinks on successful scan
- [ ] Can scan physical barcodes (laptop label, product packaging)
- [ ] Scanner maintains connection (no dropouts)

### Scanner Settings
- [ ] Verify CODE128 format enabled
- [ ] Verify Enter key terminator (CR/LF)
- [ ] Verify auto-sleep disabled for testing
- [ ] Test scan speed (should be <50ms total for 12 characters)

**Notes:**
```
Physical barcode tested: _____________
Scan time: ____ms
Beep sound: Yes / No
```

---

## 2. Dashboard Quick Scan

### Navigation
- [ ] Dashboard loads successfully
- [ ] "Quick Scan" section visible in QuickActions
- [ ] Input field is focused on page load

### Scanning Workflow
- [ ] Scan a barcode → Input captures full AWB
- [ ] Press Enter → Navigates to shipment details
- [ ] Invalid AWB → Shows error message
- [ ] Recent scans list updates after each scan
- [ ] Recent scans show compact barcodes

### Visual Verification
- [ ] Compact barcodes render correctly in recent scans
- [ ] Success/error states display properly
- [ ] No console errors during scanning

**Test AWBs:**
```
AWB 1: TAC_________ → Result: Pass / Fail
AWB 2: TAC_________ → Result: Pass / Fail
Invalid: ABC123     → Result: Error shown (Pass / Fail)
```

---

## 3. Shipments Page

### Table Display
- [ ] Shipments table loads with data
- [ ] Barcode column appears after AWB column
- [ ] All rows show barcodes (no missing/broken)
- [ ] Barcodes are properly sized (not too large)

### Interaction
- [ ] Click barcode → Opens shipment details
- [ ] Hover over barcode → Shows pointer cursor
- [ ] Barcode remains scannable from table
- [ ] No performance issues with 50+ rows

### Screen Scanning
- [ ] Increase screen brightness to 100%
- [ ] Position scanner 4-6 inches from screen
- [ ] Scan barcode from table row
- [ ] Scanner beeps and captures AWB
- [ ] Global listener captures scan (check console)

**Screen Scan Tests:**
```
Row 1 AWB: TAC_________ → Scan success: Yes / No
Row 5 AWB: TAC_________ → Scan success: Yes / No
Row 10 AWB: TAC_________ → Scan success: Yes / No
```

**Notes:**
```
Screen brightness: ____%
Distance from screen: ___ inches
Angle: Perpendicular / 45° / Other: _____
Success rate: ___/10 scans
```

---

## 4. Manifests Page

### Manifest Builder
- [ ] Click "Create Manifest"
- [ ] Fill transport details (type, route, vehicle)
- [ ] Navigate to "Add Shipments" step
- [ ] Scan panel is visible and focused

### Scanning Workflow
- [ ] Scan AWB → Shipment added to manifest
- [ ] Success feedback shown (green message)
- [ ] Shipment appears in items table
- [ ] Barcode appears in table row
- [ ] Scan same AWB again → Duplicate warning
- [ ] Scan invalid AWB → Error message

### Manifest Items Table
- [ ] Barcode column visible after AWB
- [ ] All scanned items show barcodes
- [ ] Click barcode → View shipment details
- [ ] Remove item from manifest works
- [ ] Table updates in real-time

**Manifest Scan Tests:**
```
Manifest ID: ___________

AWB 1: TAC_________ → Added: Yes / No / Duplicate / Error
AWB 2: TAC_________ → Added: Yes / No / Duplicate / Error
AWB 3: TAC_________ → Added: Yes / No / Duplicate / Error
AWB 1 (rescan) → Duplicate warning: Yes / No
```

---

## 5. Shipment Details Page

### Navigation
- [ ] Open shipment from Dashboard quick scan
- [ ] Open shipment from Shipments table
- [ ] Open shipment from Manifest items table

### Barcode Display
- [ ] Large barcode visible at top of page
- [ ] Barcode uses "screenLarge" preset (8px width, 120px height)
- [ ] Barcode is centered
- [ ] AWB number matches shipment
- [ ] Descriptive text appears below barcode

### Screen Scanning
- [ ] Barcode is scannable from screen
- [ ] Scanner captures full AWB correctly
- [ ] Barcode quality is good (no pixelation)
- [ ] Multiple scans work consistently

**Screen Scan Tests:**
```
AWB: TAC_________
Scan 1: Success / Fail
Scan 2: Success / Fail
Scan 3: Success / Fail
Success rate: ___/3
```

---

## 6. Print Label Generation

### Label Preview
- [ ] Click "Print Label" on shipment details
- [ ] Print preview window opens
- [ ] Barcode appears on label
- [ ] Barcode is properly sized for paper
- [ ] AWB number visible below barcode

### Print Verification
- [ ] Print label to PDF
- [ ] Open PDF and zoom to 100%
- [ ] Barcode bars are crisp (no blur)
- [ ] Scan printed barcode with scanner
- [ ] Scanner captures AWB correctly

**Print Test:**
```
PDF file: _____________
Barcode quality: Excellent / Good / Poor
Scan from paper: Success / Fail
```

---

## 7. Cross-Page Scanning

### Global Scan Listener
- [ ] Start on Dashboard
- [ ] Scan AWB → Navigates to shipment details
- [ ] Go to Shipments page
- [ ] Scan AWB → Navigates to shipment details
- [ ] Go to Scanning page
- [ ] Scan AWB → Processes scan locally (no navigation)

### Manifest Context
- [ ] Open manifest builder
- [ ] Scan AWB → Adds to current manifest (no navigation)
- [ ] Close manifest builder
- [ ] Scan AWB → Navigates to shipment details

**Cross-Page Tests:**
```
Dashboard scan: Navigate to details (Pass / Fail)
Shipments scan: Navigate to details (Pass / Fail)
Scanning page: Process locally (Pass / Fail)
Manifest builder: Add to manifest (Pass / Fail)
```

---

## 8. Performance & Stress Testing

### Large Data Sets
- [ ] Shipments table with 100+ rows
- [ ] Barcodes render within 2 seconds
- [ ] Scroll performance is smooth
- [ ] No memory leaks after 5 minutes

### Rapid Scanning
- [ ] Scan 10 AWBs in quick succession
- [ ] All scans are captured correctly
- [ ] No buffer overflow issues
- [ ] UI remains responsive

### Edge Cases
- [ ] Scan while page is loading
- [ ] Scan with network disconnected
- [ ] Scan very long AWB (15+ characters)
- [ ] Scan special characters
- [ ] Partial scan (interrupt with Esc)

**Performance Notes:**
```
100 barcodes render time: ____ms
Rapid scan success rate: ___/10
Memory usage after 5 min: ____MB
```

---

## 9. Browser Compatibility

### Chrome/Edge
- [ ] Barcodes render correctly
- [ ] Scanner input captured
- [ ] Navigation works
- [ ] Print preview works

### Firefox
- [ ] Barcodes render correctly
- [ ] Scanner input captured
- [ ] Navigation works
- [ ] Print preview works

### Safari (if available)
- [ ] Barcodes render correctly
- [ ] Scanner input captured
- [ ] Navigation works
- [ ] Print preview works

---

## 10. Error Handling

### Invalid Input
- [ ] Scan random barcode → Error message
- [ ] Type invalid AWB manually → Error message
- [ ] Scan empty/null value → No crash
- [ ] Scan SQL injection attempt → Sanitized

### Network Errors
- [ ] Disconnect network → Scan fails gracefully
- [ ] Reconnect network → Scanning resumes
- [ ] Timeout during scan → Retry option

### Scanner Errors
- [ ] Disconnect USB receiver → Warning message
- [ ] Reconnect receiver → Auto-recovery
- [ ] Low battery warning (if applicable)

---

## Issues Found

**Issue #1:**
```
Description: 
Steps to reproduce:
Expected behavior:
Actual behavior:
Severity: Critical / High / Medium / Low
```

**Issue #2:**
```
Description: 
Steps to reproduce:
Expected behavior:
Actual behavior:
Severity: Critical / High / Medium / Low
```

**Issue #3:**
```
Description: 
Steps to reproduce:
Expected behavior:
Actual behavior:
Severity: Critical / High / Medium / Low
```

---

## Summary

**Total Tests:** ___  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  

**Overall Status:** ✅ Pass / ❌ Fail / ⚠️ Pass with Issues

**Recommendations:**
```
1. 
2. 
3. 
```

**Sign-off:**
```
Tester: _______________
Date: _________
Time: _________
```

---

## Appendix: Console Logs

**Expected Console Logs:**

```javascript
// Scanner detection
🟢 [ScanningProvider] Key pressed: {key: 'T', keyCode: 84, ...}
🟢 [ScanningProvider] Key pressed: {key: 'A', keyCode: 65, ...}
...
[ScanningProvider] Scanner detected: true
[ScanningProvider] Notifying listeners with code: TAC123456789

// Navigation
[GlobalScanListener] Scan received: {data: 'TAC123456789', source: 'BARCODE_SCANNER'}
[GlobalScanListener] Navigating to /shipments/TAC123456789
```

**Error Logs to Watch For:**

```javascript
// These should NOT appear
❌ [ScanningProvider] Buffer overflow
❌ [UniversalBarcode] Generation failed
❌ Uncaught TypeError
❌ Network error during scan
```

---

**End of Checklist**
