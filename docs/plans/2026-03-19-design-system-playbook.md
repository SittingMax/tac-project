# TAC Enterprise Portal — Design System Playbook

> **Version**: 1.0 — March 2026  
> **Project Stack**: React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · Radix Primitives · TanStack Query/Table · Supabase

---

## Part 1: Full UI/UX Audit Report

### Phase 1 — Global UI Flow Audit

#### ✅ Strengths Found
- `PageHeader`, `PageContainer`, `SectionCard` layout shell components exist and are used.
- `WizardStepper` is compact and follows enterprise density rules.
- `globals.css` has a complete semantic token system (background, foreground, status-*, sidebar-*).
- Design tokens: all radii set to `0px` (sharp enterprise style) — correct for logistics ERP.
- Status color tokens (`--status-success`, `--status-error`, `--status-warning`) are defined and used.
- Icon standardization was partially applied (Lucide `size={16} strokeWidth={1.5}`).

#### ❌ Critical Violations Found

| # | Violation | Pages Affected |
|---|-----------|----------------|
| 1 | `transition-all` used instead of property-specific transitions | Settings, Scanning, Analytics, Dashboard (fixed in Phase 1 purge) |
| 2 | `space-y-N` / `space-x-N` anti-patterns (ShadCN forbids these) | 90+ instances across pages (fixed in Phase 1 purge) |
| 3 | `outline-none` without `focus-visible` ring replacement (a11y gap) | Dashboard (3 instances, fixed) |
| 4 | Form input heights inconsistent: mix of `h-8`, `h-10`, `h-11` | Exceptions, Customers vs Manifests |
| 5 | Card padding varies: `p-3`, `p-4`, `p-5`, `p-6` across same page type | Finance, Inventory, Analytics |
| 6 | Icon sizing inconsistent: `className="w-4 h-4"` vs `size={16}` vs `className="size-4"` | 50+ components across all modules |
| 7 | Grid gaps inconsistent: `gap-4`, `gap-6`, `gap-8`, `gap-16` on equivalent-purpose grids | Analytics, ShiftReport, Customers |
| 8 | `format()` from date-fns used directly instead of `Intl.DateTimeFormat` via `lib/formatters.ts` | Bookings, Exceptions, Messages, ShiftReport |
| 9 | Manifest Builder form steps have no visible top-of-modal "Next/Back" button anchoring | ManifestBuilder wizard |
| 10 | Invoice multi-step form dialog lacks sticky footer; buttons scroll off-screen | MultiStepCreateInvoice |
| 11 | `<button>` elements (not `<Button>`) used for toggle groups in Inventory hub filter | Inventory.tsx lines 233-260 |
| 12 | Missing `aria-label` on icon-only buttons in Messages, Management action columns | Messages, Management |
| 13 | Some pages (ShiftReport, ArrivalAudit) use raw `format(date-fns)` in JSX cells | ShiftReport, Bookings, Messages |

#### Page-Level Findings

| Page | Layout Shell | Spacing | Typography | Icons | Form |
|---|---|---|---|---|---|
| Dashboard | ✅ PageContainer | ⚠️ Hero `p-8` too large | ✅ | ✅ (fixed) | N/A |
| Analytics | ✅ | ⚠️ KPI `p-6`→fixed to `p-4` | ✅ | ⚠️ `w-4 h-4` style | N/A |
| Bookings | ✅ | ✅ | ✅ | ⚠️ `format(date)` not `formatDate()` | Standard single form |
| Shipments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manifests | ✅ | ✅ | ✅ | ⚠️ mixed sizing in steps | ❌ No sticky wizard footer |
| Inventory | ✅ | ✅ fixed | ✅ | ⚠️ `w-4 h-4` mixed | ⚠️ Raw `<button>` segments |
| Exceptions | ✅ | ✅ fixed | ✅ | ✅ | ⚠️ `h-11` inconsistent inputs |
| Invoices | ✅ | ⚠️ `p-6` dialog content | ✅ | ✅ | ❌ Buttons scroll off-screen |
| Customers | ✅ | ✅ fixed | ✅ | ✅ | ⚠️ `h-11` inputs now fixed |
| Management | ✅ | ✅ | ✅ | ⚠️ missing aria-labels | ✅ |
| Messages | ✅ | ✅ | ✅ | ⚠️ `h-4 w-4` style | N/A |
| ShiftReport | ✅ | ✅ fixed | ✅ | ✅ size={} style | N/A |
| Settings | ✅ | ✅ fixed | ✅ | ✅ | N/A |

---

### Phase 2 — Design System Audit

#### Token System Status
```css
/* ✅ Correctly defined in globals.css */
--background, --foreground          → semantic surface tokens
--primary, --primary-foreground     → brand tokens  
--muted, --muted-foreground         → secondary content
--status-success/error/warning/info → operational state
--sidebar-*                         → navigation tokens
/* Radii all = 0px — enterprise sharp style ✅ */
/* Font = Plus Jakarta Sans + Geist Mono ✅ */
```

#### Tailwind v4 Compliance
- ✅ Uses `@theme {}` block (not deprecated `@layer base`).
- ✅ CSS variables routed through `@theme` into Tailwind utility classes.
- ⚠️ Some components still check `gray-*`, `slate-*` classes (CI guard prevents merge).
- ✅ `@custom-variant dark` correctly defined.

#### ShadCN Composition Rules
- ✅ `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` used correctly in Customers, Management.
- ❌ `Exceptions.tsx` uses raw `<Label>/<Input>` without Form wrapper — validation messages won't display correctly.
- ❌ `<button>` used in Inventory hub filter instead of `<ToggleGroup>/<ToggleGroupItem>`.
- ⚠️ `CrudUpsertDialog` uses custom wrapper, not using ShadCN `Dialog` directly but OK.

---

### Phase 3 — Form UX Audit

#### Multi-Step Form Violations

**Enterprise Best Practices (from research):**
- 3–6 steps max, 4–8 fields per step.
- Sticky footer with Back/Next/Submit always visible.
- Step progress indicator always at top.
- Inline validation after field blur, not only on submit.
- Save state on step navigation (no data loss on Back).

| Form | Steps | Sticky Footer | Progress | Inline Validation | Issues |
|------|-------|--------------|----------|-------------------|--------|
| Manifest Builder | 4 steps ✅ | ❌ No sticky | ✅ WizardStepper | ⚠️ partial | Buttons scroll off on mobile |
| Invoice Multi-Step | 3 steps ✅ | ❌ No sticky | ⚠️ basic | ⚠️ partial | Buttons scroll off; Close btn disappears |
| Shipment Create | 1 step | ✅ | N/A | ✅ zod | OK |
| Customer Form | 1 step | CrudUpsertDialog handles | N/A | ✅ | OK |
| Booking Form | 1 step | CrudUpsertDialog handles | N/A | ✅ | OK |
| Exception Raise | 1 step | Standard dialog | N/A | ✅ | OK |

**Root Cause:** Multi-step forms use `DialogContent` with a scrolling content area. The "Next"/"Submit" button is placed inside the scrolling container instead of in a CSS `position: sticky` footer.

**Fix pattern:**
```tsx
<DialogContent className="flex flex-col max-h-[90vh] p-0">
  <DialogHeader className="px-6 pt-6 pb-0 shrink-0">...</DialogHeader>
  
  {/* Sticky step progress */}
  <div className="px-6 pt-4 pb-2 shrink-0 border-b">
    <WizardStepper steps={steps} currentStep={currentStep} />
  </div>
  
  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto px-6 py-4">
    {renderCurrentStep()}
  </div>
  
  {/* Sticky footer — ALWAYS VISIBLE */}
  <div className="shrink-0 border-t px-6 py-4 flex items-center justify-between bg-background">
    <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1}>
      <ChevronLeft size={16} strokeWidth={1.5} /> Back
    </Button>
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Step {currentStep} of {total}</span>
      <Button onClick={handleNext}>
        {isLastStep ? 'Submit' : 'Continue'} <ChevronRight size={16} strokeWidth={1.5} />
      </Button>
    </div>
  </div>
</DialogContent>
```

---

### Phase 4 — Component Architecture Audit

#### Current Structure
```
components/
  ui/                ← ShadCN primitives (40+ components) ✅
  ui-core/           ← Project design system ✅
    layout/          ← PageContainer, PageHeader, SectionCard, DashboardLayout ✅
    form/            ← FormSection, FormGrid, FormFooter, FormWizard ✅
    dialog/          ← SizedDialog ✅
    data/            ← IdBadge ✅
    table/           ← ⚠️ underdeveloped
    feedback/        ← ⚠️ underdeveloped
    typography/      ← ⚠️ underdeveloped
  domain/            ← StatusBadge ✅
  crud/              ← CrudTable, CrudUpsertDialog, CrudDeleteDialog ✅
  manifests/         ← ManifestBuilder wizard ✅
  finance/           ← MultiStepCreateInvoice ⚠️ (needs sticky footer)
  shipments/         ← CreateShipmentForm, ShipmentDetails ✅
  scanning/          ← BarcodeScanner, ScanPreviewDialog ✅
  settings/          ← GeneralTab, UsersTab, etc. ✅
```

#### Missing / Underdeveloped
- ❌ No `FieldGroup` component (repeated field label+input patterns inline everywhere)
- ❌ No `Toolbar` reusable component (each page builds its own header toolbar)
- ❌ No `PageTemplate` base — forms, lists, details pages each build slightly different layouts
- ⚠️ `ui-core/table/` empty — `CrudTable` lives in `crud/` instead
- ⚠️ `ui-core/feedback/` needs `EmptyState`, `LoadingState`, `ErrorState` exports
- ⚠️ `ui-core/typography/` exists but no standard heading components used

---

## Part 2: Design System Playbook

### Rule 1: Layout

```
PageContainer          → wraps every page (max-width, padding)
PageHeader             → sticky top header with title + actions
SectionCard            → every logical group of content
```

**Never** lay out raw content without these wrappers.  
**Never** use `max-w-*` directly on page content — always via `PageContainer maxWidth` prop.

```tsx
// ✅ Correct
<PageContainer>
  <PageHeader title="Shipments" description="...">
    <Button>New Shipment</Button>
  </PageHeader>
  <SectionCard title="All Shipments">
    <CrudTable ... />
  </SectionCard>
</PageContainer>

// ❌ Wrong
<div className="p-6 max-w-7xl mx-auto">
  <h1>Shipments</h1>
  ...
</div>
```

---

### Rule 2: Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Icon + label inline |
| `gap-2` | 8px | Button content, badge content |
| `gap-3` | 12px | Form row, tight card content |
| `gap-4` | 16px | **Standard grid gap, section gap** |
| `gap-6` | 24px | Section dividers, card to card |
| `gap-8` | 32px | Page section top-level |

**Never use `space-y-*` or `space-x-*`** — always `flex flex-col gap-*` or `flex gap-*`.  
**Never use `p-8`** in cards; maximum is `p-4` for `SectionCard` content.

---

### Rule 3: Border Usage

All borders use semantic tokens, never raw colors:

```tsx
// ✅ Correct
<div className="border border-border">
<div className="border-t border-border/50">

// ❌ Wrong
<div className="border border-gray-200">
<div className="border border-slate-300">
```

Radii are always `rounded-none` (0px) per design token. The project uses flat, sharp enterprise aesthetic.

---

### Rule 4: Typography Scale

| Element | Class | Weight |
|---------|-------|--------|
| Page title (`h1`) | `text-2xl font-semibold tracking-tight` | 600 |
| Section title | `text-base font-semibold` | 600 |
| Card label | `text-xs font-mono uppercase tracking-widest text-muted-foreground` | 400 |
| Body / table | `text-sm` | 400 |
| Micro / timestamp | `text-xs text-muted-foreground` | 400 |
| CN/ID mono | `font-mono font-bold text-primary` | 700 |

**Never** use `text-lg` for labels. **Never** bold `text-muted-foreground`.

---

### Rule 5: Button Rules

| Variant | Usage |
|---------|-------|
| `default` | Primary action (New, Save, Submit) |
| `secondary` | Cancel, secondary confirm |
| `outline` | Filters, toggles, subtle actions |
| `ghost` | Icon-only actions in tables |
| `destructive` | Delete, raise exception, irreversible |

**Standard button sizes:**
- Table rows / toolbars: `size="sm"` → `h-8 px-3 text-sm`
- Form actions (main): `size="default"` → `h-9`
- Hero / page CTAs: `size="default"` with `font-semibold`

**Never use `h-12 text-base` inside forms** — use `h-10 text-sm font-medium`.

**All icon-only buttons must have `aria-label`:**
```tsx
// ✅ Correct
<Button variant="ghost" size="icon" aria-label="Archive message">
  <Archive size={16} strokeWidth={1.5} />
</Button>
```

---

### Rule 6: Form Rules

```
FormSection → named group of related fields
FormGrid    → 1, 2, or 3 column grid of fields
FormFooter  → actions bar (Cancel/Submit)
```

**Standard input height: `h-8 px-3 text-sm`** (high-density enterprise style).  
**Standard select height: `h-8`**.  
**All inputs need `id` matching `htmlFor` of label.**  
**All inputs inside React Hook Form use `FormField > FormItem > FormLabel + FormControl + FormMessage`.**

```tsx
// ✅ Standard form field pattern
<FormField
  control={form.control}
  name="cn_number"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="text-xs font-mono text-muted-foreground uppercase">CN Number</FormLabel>
      <FormControl>
        <Input className="h-8 px-3 text-sm bg-transparent" placeholder="e.g. TAC-24-001234" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### Rule 7: Table Rules

All data tables use `CrudTable` which wraps TanStack Table.

- Column header: `text-xs font-mono uppercase tracking-widest text-muted-foreground`
- Row height: allow content to dictate (no fixed height)
- Action column: always right-aligned, icon-only `Button ghost size="icon"` with `aria-label`
- CN Number column: always `font-mono font-bold text-primary`
- Status column: always `<StatusBadge status={...} />`
- Date columns: use `formatDate()` or `formatDateTime()` from `@/lib/formatters` — never raw `format()` from `date-fns`

---

### Rule 8: Icon Rules

**Canonical icon usage:**
```tsx
// ✅ All icons — no exceptions
<IconName size={16} strokeWidth={1.5} />

// ✅ For larger hero icons
<IconName size={20} strokeWidth={1.5} />

// ❌ Never these patterns
<IconName className="w-4 h-4" />
<IconName className="h-4 w-4" />
<IconName className="size-4" />
```

Always import from `lucide-react`. Never directly import JsBarcode.

---

### Rule 9: Modal / Dialog Rules

**Size classes for `DialogContent`:**
```tsx
sm:max-w-md    → confirm dialogs, alerts
sm:max-w-xl    → single-step forms  
sm:max-w-2xl   → two-column forms
sm:max-w-4xl   → multi-step wizards, scanners
```

**Multi-step modal pattern (REQUIRED):**
```tsx
<DialogContent className="flex flex-col max-h-[90vh] p-0 overflow-hidden">
  <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
    <DialogTitle>Create Manifest</DialogTitle>
  </DialogHeader>
  
  {/* Progress — STICKY, always above scroll */}
  <div className="px-6 py-3 shrink-0 border-b bg-muted/30">
    <WizardStepper steps={steps} currentStep={step} />
  </div>
  
  {/* Scrollable step content */}
  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4">
    {renderStep()}
  </div>
  
  {/* Footer — STICKY, always visible */}
  <div className="shrink-0 border-t px-6 py-4 flex items-center justify-between bg-background">
    <Button variant="outline" onClick={goBack} disabled={isFirst}>
      <ChevronLeft size={16} strokeWidth={1.5} className="mr-1.5" /> Back
    </Button>
    <span className="text-xs text-muted-foreground">Step {step} of {total}</span>
    <Button onClick={goNext} disabled={isSubmitting}>
      {isLast ? (isSubmitting ? 'Saving…' : 'Submit') : 'Continue'}
      {!isLast && <ChevronRight size={16} strokeWidth={1.5} className="ml-1.5" />}
    </Button>
  </div>
</DialogContent>
```

---

### Rule 10: Status Badge Rules

Always use the `<StatusBadge status={value} />` component from `@/components/domain/status-badge`.  
Never build ad-hoc badge styling for status values.

Status values map to:
- `OPEN`, `CRITICAL`, `HIGH` → `destructive` variant
- `RESOLVED`, `DELIVERED`, `CLOSED` → `text-status-success`
- `IN_PROGRESS`, `MEDIUM`, `PENDING` → `text-status-warning`
- `LOW`, `CREATED` → `secondary` variant

---

### Rule 11: Color Usage Rules

**Only semantic tokens. Never hardcoded colors.**

```tsx
// ✅ Always
<div className="bg-primary text-primary-foreground">
<div className="text-status-error">
<div className="border-border">

// ❌ Never
<div className="bg-blue-600 text-white">
<div className="text-red-500">
<div className="border-gray-200">
<div className="bg-slate-100">
```

For status overlays: use `bg-status-X/10 text-status-X border-status-X/30`.

---

### Rule 12: Transition Rules

```tsx
// ✅ Explicit, GPU-friendly
className="transition-colors duration-200"
className="transition-opacity duration-150"
className="transition-transform duration-200"

// ❌ Never
className="transition-all"
```

---

## Part 3: Standard Page Templates

### Template A: List/Table Page
```tsx
<PageContainer>
  <PageHeader title="Shipments" description="...">
    <Button size="sm">Filter</Button>
    <Button>+ New Shipment</Button>
  </PageHeader>
  
  {/* Optional KPI row */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <StatCard ... />
  </div>
  
  <SectionCard title="All Shipments" description="...">
    {/* Optional toolbar inside SectionCard */}
    <div className="flex items-center gap-2 mb-4">
      <Input placeholder="Search..." className="h-8 w-[240px]" />
      <Select><SelectTrigger className="h-8 w-[140px]">...</SelectTrigger></Select>
    </div>
    <CrudTable columns={columns} data={data} />
  </SectionCard>
</PageContainer>
```

### Template B: Settings Page
```tsx
<PageContainer maxWidth="wide">
  <PageHeader title="Settings" />
  <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
    <aside>
      <SectionCard contentClassName="p-2">
        <SidebarNav ... />
      </SectionCard>
    </aside>
    <main>
      <SectionCard title={currentTab.label} description={currentTab.description}>
        {renderTab()}
      </SectionCard>
    </main>
  </div>
</PageContainer>
```

### Template C: Multi-Step Form Dialog
Follow the Modal Rule 9 pattern above.  
Steps definition:
```tsx
const STEPS = [
  { id: 1, name: 'Setup' },
  { id: 2, name: 'Shipments' },
  { id: 3, name: 'Review' },
];
```

### Template D: Detail Page
```tsx
<PageContainer>
  <PageHeader title={shipment.cn_number}>
    <Button variant="outline"><Printer size={16} strokeWidth={1.5} /> Print Label</Button>
  </PageHeader>
  
  <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
    <div className="flex flex-col gap-4">
      <SectionCard title="Shipment Details">...</SectionCard>
      <SectionCard title="Timeline">...</SectionCard>
    </div>
    <div className="flex flex-col gap-4">
      <SectionCard title="Customer">...</SectionCard>
      <SectionCard title="Actions">...</SectionCard>
    </div>
  </div>
</PageContainer>
```

### Template E: Analytics / Dashboard Page
```tsx
<PageContainer>
  <PageHeader title="Analytics" description="Live operations overview" />
  
  {/* KPI grid */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {/* KPI cards: p-4, text-2xl value, text-sm label, icon size={16} */}
  </div>
  
  {/* Charts */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Chart section: flex flex-col gap-4 with border-b header */}
  </div>
  
  {/* Widget / anomaly zone */}
  <div className="pt-6 border-t border-border/40">
    <AnomalyDetectorWidget />
  </div>
</PageContainer>
```

---

## Part 4: Reusable Component Plan

### Missing Components to Build

#### `<FieldGroup>` — wrap a label + control pair
```tsx
// In: components/ui-core/form/field-group.tsx
interface FieldGroupProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}
```

#### `<Toolbar>` — page-level action bar
```tsx
// In: components/ui-core/layout/toolbar.tsx
interface ToolbarProps {
  left?: React.ReactNode;   // search, filters
  right?: React.ReactNode;  // actions, buttons
  className?: string;
}
```

#### `<IconButton>` — accessible icon-only button
```tsx
// In: components/ui-core/feedback/icon-button.tsx
// Wraps Button ghost+icon with mandatory aria-label
interface IconButtonProps {
  label: string;  // maps to aria-label
  icon: React.ElementType;
  onClick?: () => void;
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'default';
}
```

#### `<LoadingRow>` / `<ErrorBoundaryFallback>` — standardized states
- Unify empty/loading/error state rendering across all tables and SectionCards.

---

## Part 5: Fix Strategy — Safe Incremental Refactoring

> Do not break existing code. Apply changes in order, verifying CI after each phase.

### Step 1: Freeze the Token System ✅ DONE
- `globals.css` tokens are finalized. Do not add new hardcoded values.

### Step 2: Fix Multi-Step Form Sticky Footer (HIGH PRIORITY)
**Target files:**
- `components/finance/MultiStepCreateInvoice.tsx` — apply sticky footer pattern
- `components/manifests/ManifestBuilder/index.tsx` — apply sticky footer pattern

**Test:** Open Invoice form → scroll content → verify Back/Next always visible.

### Step 3: Migrate Raw `format()` → `formatDate()`/`formatDateTime()`
**Target files:** `Bookings.tsx`, `Messages.tsx`, `Exceptions.tsx`, `ShiftReport.tsx`

```tsx
// Replace
import { format } from 'date-fns';
{format(new Date(row.getValue('created_at')), 'dd MMM yyyy, HH:mm')}

// With
import { formatDateTime } from '@/lib/formatters';
{formatDateTime(row.getValue('created_at'))}
```

### Step 4: Replace Raw `<button>` with ShadCN Components
**Target:** `Inventory.tsx` hub filter → use `ToggleGroup` from `@/components/ui/toggle-group`.

### Step 5: Add Missing `aria-label` to Icon Buttons
**Target:** `Messages.tsx` action column, `Management.tsx` action column.

### Step 6: Standardize All Icon Usage to `size={}` Props
Run final audit grep: `grep -rn "className=\"w-4 h-4\"\|className=\"h-4 w-4\"\|className=\"size-4\"" components/`.

### Step 7: Build Missing `FieldGroup` and `IconButton` components
Add to `components/ui-core/form/field-group.tsx` and `components/ui-core/feedback/icon-button.tsx`.

### Step 8: Update CrudTable Header Style
Standardize all column headers to `text-xs font-mono uppercase tracking-widest`.

### Step 9: Run Full CI Suite
```bash
npm run typecheck   # must be 0 errors
npm run lint        # must be 0 errors  
npm run format:check
npm run guard:no-mock-data
```

### Step 10: Storybook Documentation
For each `ui-core` component, ensure a `.stories.tsx` file exists documenting:
- All variants
- Correct vs incorrect usage example

---

## Part 6: Component Priority Matrix

| Component | Priority | Status |
|-----------|----------|--------|
| Multi-step sticky footer fix | 🔴 Critical | TODO |
| Migrate format() → formatters | 🔴 Critical | TODO |
| Raw `<button>` migration | 🟡 High | TODO |
| Missing `aria-label` | 🔴 A11y Critical | TODO |
| Icon size migration (remaining) | 🟡 High | In Progress |
| `FieldGroup` component | 🟢 Medium | TODO |
| `IconButton` component | 🟢 Medium | TODO |
| `Toolbar` component | 🟢 Medium | TODO |
| Storybook coverage | 🔵 Low | TODO |
| Virtualization for large lists | 🔵 Low | TODO |

---

## Quick Reference Card

```
Layout:     PageContainer → PageHeader → SectionCard
Spacing:    gap-4 (standard) · p-4 (cards) · gap-6 (sections)
Inputs:     h-8 px-3 text-sm (standard form inputs)
Buttons:    size="sm" (tables) · size="default" (forms)
Icons:      size={16} strokeWidth={1.5} · ALWAYS props not className
Borders:    border-border · border-border/50 (subtle) · NEVER gray/slate
Colors:     semantic tokens ONLY · bg-primary · text-status-error
Dates:      formatDate() / formatDateTime() from @/lib/formatters
Table:      CrudTable → TanStack Table wrapper
Forms:      FormField > FormItem > FormLabel + FormControl + FormMessage
Modals:     DialogContent p-0 flex flex-col max-h-[90vh] + sticky footer
Wizard:     WizardStepper always ABOVE scroll area · footer BELOW scroll area
Status:     <StatusBadge status={...} /> ALWAYS
Aria:       All icon buttons need aria-label
```
