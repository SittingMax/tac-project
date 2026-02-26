# Scanner Context Awareness Fix Plan

**Date:** 2026-02-17  
**Issue:** GlobalScanListener navigates to shipment details when scanning in manifest builder  
**Root Cause:** No context awareness system to distinguish global vs local scan handling

---

## Problem Analysis

### Current Behavior (Incorrect ❌)
```
User opens manifest builder modal
User scans barcode TAC20260003
↓
1. ManifestScanPanel receives scan → Adds shipment to manifest ✓
2. GlobalScanListener receives scan → Navigates to /tracking?awb=TAC20260003 ✗
↓
Result: Shipment added BUT user navigated away from manifest builder
```

### Expected Behavior (Correct ✅)
```
User opens manifest builder modal
User scans barcode TAC20260003
↓
1. ManifestScanPanel receives scan → Adds shipment to manifest ✓
2. GlobalScanListener checks context → Detects manifest builder is active → SKIPS navigation ✓
↓
Result: Shipment added, user stays in manifest builder
```

### Root Causes

1. **Path-based detection fails for modals:**
   ```typescript
   // Current code in GlobalScanListener.tsx
   if (location.pathname.includes('/manifests/')) {
       return; // Only matches /manifests/123, NOT /manifests
   }
   ```
   Manifest builder is a modal on `/manifests`, not a separate route.

2. **No priority system:**
   - Both global and local handlers receive the same scan event
   - No way for local handler to signal "I'm handling this, don't navigate"

3. **No context tracking:**
   - System doesn't know which component should handle scans
   - Can't distinguish between "dashboard with no active context" vs "manifest builder active"

---

## Solution Architecture

### Approach: Scan Context Provider Pattern

**Concept:** Create a centralized context that tracks which component is currently the "active scan handler". Global listener defers to active handler.

**Benefits:**
- ✅ Works with modals, dialogs, drawers (not route-based)
- ✅ Explicit context registration (clear which component owns scanning)
- ✅ Priority system (local > global)
- ✅ No event propagation hacks
- ✅ Type-safe and testable

**Inspired by:** React's focus management, accessibility patterns, and modal best practices from web research.

---

## Implementation Plan

### Phase 1: Create Scan Context System

#### 1.1 Create `ScanContext` Provider
**File:** `context/ScanContext.tsx` (NEW)

```typescript
export type ScanContextType = 
  | 'GLOBAL'           // Default: navigate anywhere
  | 'MANIFEST_BUILDER' // Building manifest: add items only
  | 'SCANNING_PAGE'    // Dedicated scanning page: process locally
  | 'DISABLED';        // No scanning allowed

export interface ScanContextValue {
  activeContext: ScanContextType;
  setActiveContext: (context: ScanContextType) => void;
  canNavigate: () => boolean; // Helper: can GlobalScanListener navigate?
}

export const ScanContextProvider: React.FC<{children}> = ({children}) => {
  const [activeContext, setActiveContext] = useState<ScanContextType>('GLOBAL');
  
  const canNavigate = useCallback(() => {
    return activeContext === 'GLOBAL';
  }, [activeContext]);
  
  return (
    <ScanContextContext.Provider value={{activeContext, setActiveContext, canNavigate}}>
      {children}
    </ScanContextContext.Provider>
  );
};

export const useScanContext = () => useContext(ScanContextContext);
```

**Why this works:**
- Single source of truth for scan handling context
- Any component can register as active handler
- Global listener queries before navigating

#### 1.2 Update `ManifestBuilderWizard` to Register Context
**File:** `components/manifests/ManifestBuilder/ManifestBuilderWizard.tsx`

```typescript
import { useScanContext } from '@/context/ScanContext';

export function ManifestBuilderWizard({open, ...props}) {
  const { setActiveContext } = useScanContext();
  
  useEffect(() => {
    if (open) {
      console.log('[ManifestBuilder] Registering as active scan context');
      setActiveContext('MANIFEST_BUILDER');
    } else {
      console.log('[ManifestBuilder] Releasing scan context');
      setActiveContext('GLOBAL');
    }
    
    return () => {
      setActiveContext('GLOBAL'); // Cleanup on unmount
    };
  }, [open, setActiveContext]);
  
  // ... rest of component
}
```

**Why this works:**
- Automatically registers when modal opens
- Automatically unregisters when modal closes
- Cleanup on unmount prevents stale context

#### 1.3 Update `GlobalScanListener` to Check Context
**File:** `components/scanning/GlobalScanListener.tsx`

```typescript
import { useScanContext } from '@/context/ScanContext';

export const GlobalScanListener: React.FC = () => {
  const { canNavigate, activeContext } = useScanContext();
  const { subscribe } = useScanner();
  const navigate = useNavigate();
  
  useEffect(() => {
    const unsubscribe = subscribe((data: string, source: ScanSource) => {
      console.log('[GlobalScanListener] Scan received:', { 
        data, 
        source,
        activeContext,
        canNavigate: canNavigate()
      });
      
      // Check if we can navigate
      if (!canNavigate()) {
        console.log(`[GlobalScanListener] Skipping - active context: ${activeContext}`);
        return;
      }
      
      // Process scan and navigate
      const cleanData = data.trim().toUpperCase();
      
      if (cleanData.startsWith('TAC')) {
        toast.info(`Opening Shipment: ${cleanData}`);
        navigate(`/tracking?awb=${cleanData}`);
        return;
      }
      
      // ... other handlers
    });
    
    return unsubscribe;
  }, [subscribe, navigate, canNavigate, activeContext]);
  
  return null;
};
```

**Why this works:**
- Queries context before navigation
- Logs context state for debugging
- Respects local handler priority

---

### Phase 2: Update Other Pages

#### 2.1 Scanning Page
**File:** `pages/Scanning.tsx`

```typescript
const { setActiveContext } = useScanContext();

useEffect(() => {
  setActiveContext('SCANNING_PAGE');
  return () => setActiveContext('GLOBAL');
}, [setActiveContext]);
```

#### 2.2 Future: Invoice Builder, Batch Operations
Apply same pattern to any page that needs local scan handling.

---

### Phase 3: Playwright E2E Tests

#### 3.1 Test File Structure
**File:** `tests/e2e/scanner-context.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Scanner Context Awareness', () => {
  
  test('should navigate to shipment from dashboard', async ({ page }) => {
    // Setup: Login and go to dashboard
    await page.goto('/dashboard');
    
    // Simulate scanner input
    await page.keyboard.type('TAC20260003');
    await page.keyboard.press('Enter');
    
    // Verify: Navigated to tracking page
    await expect(page).toHaveURL(/\/tracking\?awb=TAC20260003/);
  });
  
  test('should add to manifest without navigation', async ({ page }) => {
    // Setup: Login and open manifest builder
    await page.goto('/manifests');
    await page.click('[data-testid="create-manifest-button"]');
    
    // Fill manifest details
    await page.selectOption('[name="type"]', 'GROUND');
    await page.selectOption('[name="from_hub_id"]', 'DEL');
    await page.selectOption('[name="to_hub_id"]', 'BOM');
    await page.click('text=Next');
    
    // Verify: On "Add Shipments" step
    await expect(page.locator('text=Scan AWB')).toBeVisible();
    
    // Get initial item count
    const initialRows = await page.locator('table tbody tr').count();
    
    // Simulate scanner input
    await page.keyboard.type('TAC20260003');
    await page.keyboard.press('Enter');
    
    // Wait for scan to process
    await page.waitForTimeout(500);
    
    // Verify: Still on manifests page (NOT navigated)
    await expect(page).toHaveURL(/\/manifests$/);
    
    // Verify: Shipment added to table
    const newRows = await page.locator('table tbody tr').count();
    expect(newRows).toBe(initialRows + 1);
    
    // Verify: AWB appears in table
    await expect(page.locator('text=TAC20260003')).toBeVisible();
  });
  
  test('should prevent duplicate adds in manifest', async ({ page }) => {
    // ... setup manifest builder
    
    // Scan same AWB twice
    await page.keyboard.type('TAC20260003');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    await page.keyboard.type('TAC20260003');
    await page.keyboard.press('Enter');
    
    // Verify: Duplicate warning appears
    await expect(page.locator('text=already in manifest')).toBeVisible();
    
    // Verify: Only one row for this AWB
    const matchingRows = await page.locator(`tr:has-text("TAC20260003")`).count();
    expect(matchingRows).toBe(1);
  });
  
  test('should resume global navigation after closing manifest', async ({ page }) => {
    // Setup: Open and close manifest builder
    await page.goto('/manifests');
    await page.click('[data-testid="create-manifest-button"]');
    await page.click('[aria-label="Close"]'); // Close modal
    
    // Verify: Back on manifests list
    await expect(page.locator('text=Fleet Manifests')).toBeVisible();
    
    // Simulate scanner input
    await page.keyboard.type('TAC20260003');
    await page.keyboard.press('Enter');
    
    // Verify: Global navigation resumes (navigates to tracking)
    await expect(page).toHaveURL(/\/tracking\?awb=TAC20260003/);
  });
  
  test('should handle rapid scans in manifest', async ({ page }) => {
    // ... setup manifest builder
    
    const awbs = ['TAC20260001', 'TAC20260002', 'TAC20260003'];
    
    for (const awb of awbs) {
      await page.keyboard.type(awb);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200); // Small delay between scans
    }
    
    // Verify: All AWBs added
    for (const awb of awbs) {
      await expect(page.locator(`text=${awb}`)).toBeVisible();
    }
    
    // Verify: Still on manifests page
    await expect(page).toHaveURL(/\/manifests$/);
  });
});
```

#### 3.2 Test Coverage Goals
- ✅ Global navigation from dashboard
- ✅ Local handling in manifest builder
- ✅ Context cleanup after modal close
- ✅ Duplicate detection in manifest
- ✅ Rapid scanning performance
- ✅ Cross-browser compatibility

---

### Phase 4: Documentation & Best Practices

#### 4.1 Developer Guidelines
**File:** `docs/SCANNER_CONTEXT_GUIDELINES.md` (NEW)

```markdown
# Scanner Context Guidelines

## When to Register a Custom Scan Context

Register a custom scan context when your component needs to:
1. Handle scans locally (don't trigger global navigation)
2. Process scans differently than the default behavior
3. Temporarily disable scanning

## How to Register

```typescript
import { useScanContext } from '@/context/ScanContext';

function MyComponent() {
  const { setActiveContext } = useScanContext();
  
  useEffect(() => {
    setActiveContext('MY_CUSTOM_CONTEXT');
    return () => setActiveContext('GLOBAL');
  }, [setActiveContext]);
}
```

## Best Practices

1. **Always cleanup:** Reset to 'GLOBAL' on unmount
2. **Effect dependencies:** Include `setActiveContext` in deps array
3. **Log context changes:** Use console.log for debugging
4. **Test both states:** Test with context active AND after cleanup
```

---

## Alternatives Considered

### Alternative 1: Event Propagation Control ❌
**Approach:** Call `event.stopPropagation()` in manifest scan handler

**Why rejected:**
- Keyboard wedge scanners don't use React synthetic events
- Can't stop propagation of native `keydown` events after they reach window
- Brittle: requires perfect event handler ordering

### Alternative 2: Route-Based Detection ❌
**Approach:** Check `location.pathname` for specific routes

**Why rejected:**
- Doesn't work for modals/dialogs (same route)
- Hard to maintain (add every new page)
- Breaks with nested routes

### Alternative 3: DOM Focus Tracking ❌
**Approach:** Check if scan input is focused inside manifest builder

**Why rejected:**
- Scanner sends keystrokes to `window`, not focused element
- Focus state is unreliable during rapid scanning
- Accessibility issues

### Alternative 4: Disable Global Listener When Modal Open ❌
**Approach:** Unmount GlobalScanListener when manifest builder opens

**Why rejected:**
- React portals and re-mounting cause flickering
- Breaks other global features (header scan, quick search)
- Poor user experience

---

## Migration Path

### Step 1: Add Context Provider (Non-breaking)
- Wrap app in `ScanContextProvider`
- Default context is 'GLOBAL' (current behavior)
- No changes needed to existing code

### Step 2: Update GlobalScanListener (Non-breaking)
- Check `canNavigate()` before navigation
- If context is 'GLOBAL', behaves exactly as before
- Log context for debugging

### Step 3: Register Manifest Builder (Fix)
- Set context to 'MANIFEST_BUILDER' when open
- GlobalScanListener skips navigation
- Manifest scanning works as expected

### Step 4: Add Tests (Verification)
- Playwright tests verify all scenarios
- Catch regressions in future changes

### Step 5: Document Pattern (Maintenance)
- Guidelines for future components
- Examples and best practices

---

## Success Metrics

### Before Fix ❌
- Manifest builder: Scan → Add + Navigate (incorrect)
- User frustration: High
- Manual workaround: Navigate back to manifest, scan again
- Test coverage: 0%

### After Fix ✅
- Manifest builder: Scan → Add only (correct)
- User experience: Seamless
- No manual intervention needed
- Test coverage: 5 E2E tests covering all scenarios

---

## Implementation Checklist

- [ ] Create `ScanContext.tsx` provider
- [ ] Wrap app in `ScanContextProvider`
- [ ] Update `GlobalScanListener` to check context
- [ ] Register `ManifestBuilderWizard` as active context
- [ ] Register `Scanning` page as active context
- [ ] Create Playwright test file `scanner-context.spec.ts`
- [ ] Write 5 core E2E tests
- [ ] Run tests locally and verify pass
- [ ] Document pattern in guidelines
- [ ] Update `BARCODE_IMPLEMENTATION_COMPLETE.md`

---

## Timeline

**Estimated Time:** 2-3 hours

1. **Phase 1 (1 hour):** Implement context system
2. **Phase 2 (30 min):** Update components
3. **Phase 3 (1 hour):** Write and debug Playwright tests
4. **Phase 4 (30 min):** Documentation

---

## References

### Web Research Findings
1. **Modal keyboard accessibility** (dev.to):
   - Focus trapping patterns
   - Keydown listener maps
   - Event handler priority

2. **React modal best practices** (stackoverflow):
   - Stop propagation doesn't work for global listeners
   - Use context or state to track modal open/closed
   - Portal event handling challenges

3. **Event delegation patterns**:
   - Local handlers should block global handlers
   - Context-based priority system
   - Explicit registration/cleanup

### Related Files
- `context/ScanningProvider.tsx` - Existing scan detection
- `context/useScanner.ts` - Scan subscription hook
- `components/scanning/GlobalScanListener.tsx` - Navigation logic
- `hooks/useManifestScan.ts` - Manifest scan handler

---

**Author:** AI Assistant (Verdent)  
**Date:** February 17, 2026  
**Status:** ✅ Plan Complete, Ready for Implementation
