# Manifest Density Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the Manifest Builder into a high-density, keyboard-first enterprise logistics workflow.

**Architecture:** Use `sm` and `compact` variants for all core ShadCN inputs, selects, tabs, and buttons. Restrict all Lucide icons to `size={16}` and `strokeWidth={1.5}`. Compress global spacing by switching to `gap-3` and card internals to `p-3`. Flatten form layouts into horizontal queues for scanning, time-picking, and metrics.

**Tech Stack:** React, Tailwind CSS, ShadCN UI, Lucide React

---

### Task 1: Update Size Rules & Typography
**(TaskName: "Implementing ShadCN size rules")**

**Files:**
- Modify: `components/manifests/ManifestBuilder/steps/StepManifestSetup.tsx`
- Modify: `components/manifests/ManifestBuilder/steps/StepAddShipments.tsx`

**Step 1: Write the failing test**
Run: `npm run typecheck`
Expected: PASS

**Step 2: Write minimal implementation**
Sweep through all `Input`, `SelectTrigger`, and `Button` components and enforce `size="sm"` or `className="h-8 text-sm"`. Enforce `CardContent` paddings to `p-3`. Standardize typographies: titles to `text-sm font-medium`, labels to `text-xs text-muted-foreground`.

**Step 3: Run test to verify it passes**
Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**
```bash
git add components/manifests/ManifestBuilder/steps/
git commit -m "style: enforce high-density shadcn sizing and typography"
```

### Task 2: Standardize Icon Consistency
**(TaskName: "Implementing Icon rules")**

**Files:**
- Modify: `components/manifests/ManifestBuilder/steps/StepManifestSetup.tsx`
- Modify: `components/manifests/ManifestBuilder/steps/StepAddShipments.tsx`

**Step 1: Write the failing test**
N/A (visual)

**Step 2: Write minimal implementation**
Standardize all `Plane`, `Truck`, `Package`, `Scan`, `Calendar` icons to `size={16}` exactly. Normalize the stroke weights to `strokeWidth={1.5}`. Erase mixed outline/filled sizing discrepancies.

**Step 3: Run test to verify it passes**
Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**
```bash
git add components/manifests/ManifestBuilder/steps/
git commit -m "style: standardize enterprise icon weights and sizes"
```

### Task 3: Overhaul Flight Details & Date Picker Layout
**(TaskName: "Implementing Date picker rules")**

**Files:**
- Modify: `components/manifests/ManifestBuilder/steps/StepManifestSetup.tsx`

**Step 1: Write the failing test**
N/A (visual)

**Step 2: Write minimal implementation**
Convert the Flight Details fields to a `grid-cols-3 gap-3` row (Airline | Flight | Date). Replace the blocky text Date input with Shadcn's compact `Popover` + `Button size="sm"` trigger + `Calendar` overlay. Consolidate ETD and ETA rows into ultra-dense inline rows.

**Step 3: Run test to verify it passes**
Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**
```bash
git add components/manifests/ManifestBuilder/steps/
git commit -m "feat: squash flight details into semantic horizontal grid"
```

### Task 4: Shrink Stepper & Scan Controls
**(TaskName: "Implementing stepper and scan controls rules")**

**Files:**
- Modify: `components/manifests/ManifestBuilder/WizardStepper.tsx`
- Modify: `components/manifests/ManifestBuilder/steps/StepAddShipments.tsx`

**Step 1: Write the failing test**
N/A (visual)

**Step 2: Write minimal implementation**
Replace the oversized Stepper with a horizontal `Tabs size="sm"` mimicking `[1] Setup — [2] Shipments — [3] Finalize`. Convert the Add Shipments Stats grid from heavy graphic cards into dense `grid-cols-4` single-row KPI badges (`Added 0 | Dup 0 | Err 0 | Kg 0`).

**Step 3: Run test to verify it passes**
Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**
```bash
git add .
git commit -m "style: compress stepper and shipment scan controls"
```
