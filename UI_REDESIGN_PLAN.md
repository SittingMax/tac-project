# TAC Cargo Portal — Comprehensive UI Redesign Plan

> **Status**: Draft — Awaiting approval before execution
> **Scope**: Full design system creation + all authenticated pages
> **Goal**: Enterprise-grade, logistics-standard, consistent, polished SaaS UI

---

## 1. Executive Summary

The TAC portal has the correct tech stack (shadcn/ui + Radix + Tailwind v4 + TanStack Table + react-hook-form + Zod) but lacks a **design system layer**. Components are used as isolated primitives rather than a cohesive system, resulting in:

- Inconsistent page layouts (no shared container/header pattern)
- Cramped forms with wrong grid spacing
- Dialogs too narrow for logistics data entry
- Raw database UUIDs exposed in the UI
- No typography hierarchy (page headers use `font-black tracking-tighter uppercase` — too aggressive)
- No consistent stat card / KPI pattern across pages
- Three competing table implementations (`DataTable`, `EnhancedDataTable`, `CrudTable`)
- All border-radius set to `0px` (too harsh — needs soft rounding)
- Inconsistent spacing (random `space-y-*` and `gap-*` values)

**Solution**: Create a `components/ui-core/` design system layer that wraps shadcn primitives, then migrate every page to use it.

---

## 2. Current State Audit

### 2.1 Existing Components (components/ui/ — 65 files)

| Component | Status | Issues |
|-----------|--------|--------|
| `button.tsx` | ✅ Good | `rounded-none` everywhere — needs soft radius |
| `card.tsx` | ✅ Good | `rounded-none`, padding okay |
| `badge.tsx` | ⚠️ Okay | `font-mono uppercase text-[10px]` — too aggressive |
| `dialog.tsx` | ⚠️ Needs work | Default `sm:max-w-lg` (512px) too narrow |
| `input.tsx` | ⚠️ Needs work | `h-9` too short for enterprise forms, needs `h-10` |
| `form.tsx` | ✅ Good | Standard shadcn form |
| `data-table.tsx` | ⚠️ Competing | Drag handles, native checkboxes, "telemetry" language |
| `enhanced-data-table.tsx` | ⚠️ Competing | Full-featured but rarely used |
| `page-header.tsx` | ⚠️ Needs rework | `font-black tracking-tighter uppercase` too harsh |
| `table.tsx` | ✅ Good | Standard shadcn table primitives |
| `tabs.tsx` | ✅ Good | Standard |
| `select.tsx` | ✅ Good | Standard |
| `sheet.tsx` | ✅ Good | Standard |
| `skeleton.tsx` | ✅ Good | Multiple skeleton variants |

### 2.2 Domain Components (components/domain/)

| Component | Status | Issues |
|-----------|--------|--------|
| `KPICard.tsx` | ⚠️ Inconsistent | Uses `border-white/10`, gradient accent — needs standardization |
| `StatusBadge.tsx` | ✅ Good | Uses CSS class map, comprehensive status coverage |

### 2.3 CRUD Components (components/crud/)

| Component | Status | Issues |
|-----------|--------|--------|
| `CrudTable.tsx` | ⚠️ Primary table | Uses raw `<table>` instead of shadcn `Table` primitives |
| `CrudUpsertDialog.tsx` | ⚠️ Too narrow | Uses default Dialog (max-w-lg = 512px) |
| `CrudDeleteDialog.tsx` | ✅ Good | Simple confirmation dialog |
| `CrudRowActions.tsx` | ✅ Good | Dropdown menu pattern |

### 2.4 Pages Audit (28 pages)

| Page | Layout Pattern | Table | Stats | Dialog Size | Issues |
|------|---------------|-------|-------|-------------|--------|
| `Shipments.tsx` | Own wrapper | CrudTable | None inline | Default (lg) | No stat cards, raw search |
| `Bookings.tsx` | Own wrapper | CrudTable | Inline Cards | N/A | Raw UUID in ID column |
| `Manifests.tsx` | Own wrapper | DataTable | KPICard | Wizard | Mix of Card styles |
| `Scanning.tsx` | Own wrapper | None | Inline badges | N/A | Complex, no Page pattern |
| `Inventory.tsx` | Own wrapper | Raw Table | Inline Cards | N/A | Manual pagination, raw Table |
| `Exceptions.tsx` | Own wrapper | CrudTable | KPICard | Default (lg) | Small dialog for forms |
| `Finance.tsx` | Own wrapper | CrudTable | Inline Cards | Default (lg) | Small dialog for invoice |
| `Customers.tsx` | Own wrapper | CrudTable | None | CrudUpsert (lg) | No stat cards |
| `Management.tsx` | Own wrapper | CrudTable | None | Custom dialog | No stat cards |
| `Settings.tsx` | Own wrapper | Raw Table | None | N/A | Tabs but inconsistent |
| `ShiftReport.tsx` | container mx-auto | None | Cards | N/A | Own heading style |
| `Messages.tsx` | Own wrapper | Raw Table | Cards | Default (lg) | Raw table, small dialog |
| `Dashboard.tsx` | Own wrapper | None | Mixed | N/A | Complex, KPI grid |
| `AnalyticsDashboard.tsx` | Own wrapper | None | Cards | N/A | Own layout |
| `WarehouseDashboard.tsx` | Own wrapper | None | Cards | N/A | Own layout |
| `Notifications.tsx` | Own wrapper | None | None | N/A | List layout |

### 2.5 CSS / Theme Audit (globals.css)

| Token | Current Value | Issue |
|-------|---------------|-------|
| `--radius-*` | All `0px` | Too harsh — no rounding at all |
| `--font-sans` | `Plus Jakarta Sans, Inter` | ✅ Good font choice already |
| `--font-mono` | `Geist Mono, JetBrains Mono` | ✅ Good |
| Shadows | Properly defined | ✅ Good |
| Status colors | Defined via oklch | ✅ Good |
| Border color | oklch-based | ✅ Good |

### 2.6 Fonts (index.html)

Currently loading from Google Fonts:
- `Geist Mono` (300–700) — monospace
- `Bricolage Grotesque` (200–800) — **not used anywhere in CSS**
- `Plus Jakarta Sans` (300–800) — primary sans

**Issue**: `Bricolage Grotesque` loaded but unused. `@fontsource-variable/public-sans` in package.json but CSS uses `Plus Jakarta Sans`. Dead weight.

---

## 3. Design System Architecture

### 3.1 New Folder Structure

```
components/ui-core/
├── layout/
│   ├── page-container.tsx    # Max-width wrapper + padding + animation
│   └── page-header.tsx       # Title + description + actions (replaces ui/page-header.tsx)
│
├── data/
│   ├── stat-card.tsx          # KPI / metric card (replaces KPICard.tsx)
│   ├── stat-grid.tsx          # Grid wrapper for stat cards (2/3/4 col)
│   └── id-badge.tsx           # Formatted ID display (CN-2026-0001)
│
├── table/
│   └── data-table-toolbar.tsx # Reusable toolbar: search + filters + actions
│
├── form/
│   ├── form-section.tsx       # Titled section with separator
│   └── form-grid.tsx          # Responsive grid for form fields (2-col, 3-col)
│
├── dialog/
│   └── sized-dialog.tsx       # Dialog with size presets (sm/md/lg/xl/2xl)
│
├── typography/
│   ├── heading.tsx            # h1–h4 with consistent scale
│   └── text.tsx               # body/label/meta text variants
│
└── index.ts                   # Barrel export
```

### 3.2 Why a Wrapper Layer?

Pages should **never** compose raw shadcn primitives for structural layout. Instead:

```tsx
// ❌ Current — every page invents its own layout
<div className="flex-1 space-y-6 animate-in fade-in ...">
  <div className="flex items-center justify-between">
    <PageHeader title="..." />
    <Button>New</Button>
  </div>
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    <Card>...</Card>
  </div>
  <CrudTable ... />
</div>

// ✅ Target — consistent structure
<PageContainer>
  <PageHeader title="..." description="..." actions={<Button>New</Button>} />
  <StatGrid columns={4}>
    <StatCard title="Pending" value={7} icon={<Clock />} />
    <StatCard title="Created Today" value={3} icon={<Plus />} />
  </StatGrid>
  <CrudTable ... />
</PageContainer>
```

---

## 4. Component Specifications

### 4.1 PageContainer

```
Purpose: Top-level page wrapper
Max widths: default=1400px, narrow=900px, wide=1600px, full=100%
Padding: px-4 sm:px-6 lg:px-8, py-6
Vertical spacing: space-y-6
Animation: animate-in fade-in slide-in-from-bottom-2 duration-500
```

### 4.2 PageHeader (Redesigned)

```
Purpose: Consistent page title + subtitle + action buttons
Title: text-2xl font-semibold tracking-tight (NOT font-black uppercase)
Description: text-sm text-muted-foreground
Icon: Optional, rendered in a bg-primary/10 rounded-lg container
Actions: Right-aligned slot for buttons
Separator: Optional bottom border
Badge: Optional inline badge (e.g., LIVE indicator)
```

**Why redesign?** Current `page-header.tsx` uses:
- `text-3xl md:text-4xl font-black tracking-tighter uppercase` — screams at the user
- `font-mono text-[10px] tracking-widest uppercase` for description — unreadable
- A decorative `/` after every title — unnecessary visual noise

Enterprise dashboards use clean, quiet typography. The data should be loud, not the headers.

### 4.3 StatCard (Replaces KPICard)

```
Purpose: Metric display card with icon, value, subtitle, trend
Structure:
  - Title: text-sm font-medium text-muted-foreground
  - Value: text-2xl font-semibold tracking-tight
  - Subtitle: text-xs text-muted-foreground
  - Icon: Size-9 rounded-lg bg-{color}/10 container
  - Trend: Optional up/down/neutral with percentage
Uses: shadcn Card underneath
```

**Why replace KPICard?** Current `KPICard.tsx`:
- Uses `border-white/10` (wrong in light mode)
- Has a gradient overlay (`bg-gradient-to-bl from-primary/10`)
- `text-3xl font-bold` — too heavy

### 4.4 StatGrid

```
Purpose: Responsive grid for StatCards
Columns: 2 on mobile, configurable 2/3/4 on desktop
Gap: gap-4
```

### 4.5 IdBadge

```
Purpose: Display formatted IDs instead of raw UUIDs
Format: PREFIX-YEAR-SEQ (e.g., CN-2026-0001, INV-2026-0008)
Fallback: If no sequence, show truncated UUID (first 8 chars)
Style: font-mono text-xs bg-muted px-2 py-0.5 rounded-md
Supports: Copy-on-click
```

**Formatting rules:**
| Entity | Prefix | Example |
|--------|--------|---------|
| Shipment | CN | CN-2026-0001 |
| Invoice | INV | INV-2026-0008 |
| Customer | CUS | CUS-0021 |
| Manifest | MNF | MNF-0002 |
| Booking | BKG | BKG-0001 |
| User/Staff | USR | USR-0001 |
| Message | MSG | MSG-0003 |
| Exception | EXC | EXC-0001 |

For entities with `cn_number` (shipments), use the real CN. For others, derive from the UUID or creation order.

### 4.6 FormSection

```
Purpose: Group related form fields with a title + optional description
Structure:
  - Title: text-base font-medium
  - Description: text-sm text-muted-foreground
  - Separator above (optional)
  - Children: form fields
Spacing: space-y-4
```

### 4.7 FormGrid

```
Purpose: Responsive column layout for form fields
Variants: 1-col, 2-col (default), 3-col
Gap: gap-x-6 gap-y-4
Responsive: grid-cols-1 on mobile, target cols on md+
```

### 4.8 SizedDialog

```
Purpose: Dialog with standardized size presets
Sizes:
  - sm: max-w-md (448px) — confirmations, simple forms
  - md: max-w-lg (512px) — single-section forms
  - lg: max-w-2xl (672px) — multi-section forms
  - xl: max-w-4xl (896px) — complex forms (shipment, invoice)
  - 2xl: max-w-6xl (1152px) — wizards, multi-step
  - full: max-w-[calc(100vw-4rem)] — full-screen dialogs
Wraps: existing Dialog + DialogContent with size prop
```

**Dialog size assignments:**
| Dialog | Size |
|--------|------|
| Delete confirmation | sm |
| Message reply | md |
| Customer create/edit | lg |
| User create/edit | lg |
| Exception raise/resolve | lg |
| Shipment create | xl |
| Invoice create | xl |
| Manifest wizard | 2xl |
| Booking form | xl |

### 4.9 Heading / Text Typography

```
Heading variants:
  h1: text-2xl font-semibold tracking-tight
  h2: text-xl font-semibold tracking-tight
  h3: text-lg font-medium
  h4: text-base font-medium

Text variants:
  body: text-sm
  label: text-xs font-medium uppercase tracking-wide text-muted-foreground
  meta: text-xs text-muted-foreground
  mono: font-mono text-xs
```

### 4.10 DataTableToolbar (Reusable)

```
Purpose: Consistent toolbar for all table pages
Structure:
  - Search input (left)
  - Filter buttons (left, after search)
  - Custom content slot (center/right)
  - Column visibility toggle (right)
  - Export button (right, optional)
Wraps: Existing pattern from CrudTable toolbar
```

---

## 5. Global CSS Changes (globals.css)

### 5.1 Border Radius — From 0px to Soft Rounded

```css
/* BEFORE (current) */
--radius-sm: 0px;
--radius-md: 0px;
--radius-lg: 0px;
--radius-xl: 0px;

/* AFTER */
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.25rem;   /* 20px */
--radius-3xl: 1.5rem;    /* 24px */

--radius: 0.5rem; /* base radius */
```

**Impact**: Every `rounded-none` in shadcn components becomes `rounded-md` automatically via CSS variables. Components that explicitly use `rounded-none` in className will need manual updates.

### 5.2 Explicit `rounded-none` Removal

Many components have `rounded-none` hardcoded in their className strings. These need to be removed so they pick up the theme radius. Affected files:

- `components/ui/button.tsx` — base class + size variants
- `components/ui/card.tsx` — base + header + footer + image slots
- `components/ui/badge.tsx` — base class
- `components/ui/input.tsx` — base class
- `components/ui/dialog.tsx` — DialogContent
- `components/domain/KPICard.tsx` — container + icon box
- `components/domain/StatusBadge.tsx` — container + dot
- `components/crud/CrudTable.tsx` — table container
- Many page-level inline styles

### 5.3 Input Height

```css
/* Input: h-9 (36px) → h-10 (40px) for better touch targets */
/* This is done in input.tsx, not CSS */
```

### 5.4 Clean Up Unused Font

Remove `@fontsource-variable/public-sans` from package.json (unused — CSS uses Plus Jakarta Sans from Google Fonts). Optionally remove `Bricolage Grotesque` from index.html if unused.

---

## 6. Table Strategy — Consolidation

### Current state: 3 competing table components

1. **`CrudTable`** — Used by most pages (Shipments, Bookings, Finance, Customers, Management, Exceptions). Uses raw `<table>` element, not shadcn Table primitives.
2. **`DataTable`** — Used by Manifests. Uses shadcn Table primitives. Has drag handles and "telemetry" language.
3. **`EnhancedDataTable`** — Full-featured (filters, bulk actions, column visibility, export). Rarely used.

### Strategy: Enhance CrudTable, deprecate the others

**CrudTable is the winner** because:
- Most pages already use it
- It has the best API (loading states, empty states, toolbar slot, search, bulk actions)
- It just needs shadcn Table primitives instead of raw `<table>`

**Changes to CrudTable:**
1. Replace raw `<table>` with shadcn `Table/TableHeader/TableBody/TableRow/TableCell/TableHead`
2. Use shadcn `Checkbox` instead of native checkboxes (already done)
3. Standardize header style: `text-xs font-medium uppercase tracking-wide` (not `text-[10px] font-mono tracking-widest`)
4. Standardize row height: `py-3` (not `py-4` or inconsistent)
5. Add page-size selector from EnhancedDataTable
6. Keep column resize capability

**Pages using raw Table primitives** (Inventory, Messages, Settings) will be migrated to CrudTable.

---

## 7. Form System Improvements

### Current Issues
- Forms use single-column layout in narrow dialogs
- No visual grouping of related fields
- Labels are inconsistent (some uppercase tracking-widest, some normal)
- No consistent grid pattern

### Target Pattern

```tsx
<SizedDialog size="xl">
  <DialogHeader>
    <DialogTitle>Create Shipment</DialogTitle>
    <DialogDescription>Enter shipment details</DialogDescription>
  </DialogHeader>

  <FormSection title="Consignee Details" icon={<User />}>
    <FormGrid columns={2}>
      <FormField name="consigneeName" ... />
      <FormField name="consigneePhone" ... />
    </FormGrid>
    <FormField name="deliveryAddress" ... />
    <FormGrid columns={3}>
      <FormField name="city" ... />
      <FormField name="state" ... />
      <FormField name="zip" ... />
    </FormGrid>
  </FormSection>

  <FormSection title="Package Details" icon={<Package />}>
    <FormGrid columns={2}>
      <FormField name="count" ... />
      <FormField name="weight" ... />
    </FormGrid>
  </FormSection>
</SizedDialog>
```

### Affected Form Dialogs
| Form | Current Container | Target |
|------|-------------------|--------|
| CreateShipmentForm | Dialog (default lg) | SizedDialog xl |
| BookingDialog | Dialog (default lg) | SizedDialog xl |
| MultiStepCreateInvoice | Dialog (custom) | SizedDialog xl |
| CrudUpsertDialog (Customer) | Dialog (default lg) | SizedDialog lg |
| CrudUpsertDialog (Staff) | Dialog (custom) | SizedDialog lg |
| Exception raise | Dialog (default lg) | SizedDialog lg |
| Exception resolve | Dialog (default lg) | SizedDialog md |
| Message view | Dialog (default lg) | SizedDialog md |

---

## 8. Page-by-Page Migration Plan

Every page follows the same target structure:

```tsx
<PageContainer>
  <PageHeader title="..." description="..." actions={...} />
  <StatGrid columns={N}>          {/* optional */}
    <StatCard ... />
  </StatGrid>
  <CrudTable ... />                {/* or custom content */}
  <SizedDialog size="...">        {/* modals */}
    ...
  </SizedDialog>
</PageContainer>
```

### Phase 2A — Core Operations Pages

#### Shipments.tsx
- [x] Wrap in `PageContainer`
- [x] Replace `PageHeader` (ui) with `PageHeader` (ui-core)
- [x] Add `StatGrid` with shipment count KPIs (total, in-transit, delivered today, exceptions)
- [x] CrudTable already used — just needs toolbar cleanup
- [x] Dialog → `SizedDialog size="xl"` for create form
- [x] Format IDs with `IdBadge` in columns

#### Bookings.tsx
- [x] Wrap in `PageContainer`
- [x] Replace inline header with `PageHeader` (ui-core)
- [x] Replace inline Card stats with `StatGrid` + `StatCard`
- [x] Replace raw UUID in ID column with `IdBadge`
- [x] CrudTable already used

#### Manifests.tsx
- [x] Wrap in `PageContainer`
- [x] Replace inline header with `PageHeader` (ui-core)
- [x] Replace `KPICard` with `StatCard`
- [x] Keep DataTable (it works here) or migrate to CrudTable
- [x] Wizard dialog already large — verify sizing

### Phase 2B — Warehouse Pages

#### Scanning.tsx
- [x] Wrap in `PageContainer`
- [x] Add `PageHeader` with mode selector in actions slot
- [x] Keep specialized scanning layout (camera + feed grid)
- [x] Standardize card usage

#### Inventory.tsx
- [x] Wrap in `PageContainer`
- [x] Replace inline header with `PageHeader` (ui-core)
- [x] Replace inline stat Cards with `StatGrid` + `StatCard`
- [x] **Migrate raw Table to CrudTable** (biggest change)
- [x] Replace manual Pagination with CrudTable built-in pagination

#### Exceptions.tsx
- [x] Wrap in `PageContainer`
- [x] Replace `KPICard` with `StatCard`
- [x] Dialog → `SizedDialog size="lg"` for raise/resolve
- [x] CrudTable already used

### Phase 2C — Business Pages

#### Finance.tsx
- [x] Wrap in `PageContainer`
- [x] Replace inline stat Cards with `StatGrid` + `StatCard`
- [x] Dialog → `SizedDialog size="xl"` for invoice create
- [x] CrudTable already used
- [x] Format invoice IDs with `IdBadge`

#### Customers.tsx
- [x] Wrap in `PageContainer`
- [x] Add `PageHeader` (ui-core)
- [x] Add `StatGrid` (total, business, individual, corporate counts)
- [x] CrudUpsertDialog → use `SizedDialog size="lg"`
- [x] Format IDs with `IdBadge`

### Phase 2D — Admin Pages

#### Management.tsx
- [x] Wrap in `PageContainer`
- [x] Add `PageHeader` (ui-core)
- [x] Add `StatGrid` (total staff, active, by role)
- [x] Dialog → `SizedDialog size="lg"` for user forms
- [x] Format IDs with `IdBadge`

#### Messages.tsx (admin)
- [x] Wrap in `PageContainer`
- [x] Replace inline stat Cards with `StatGrid` + `StatCard`
- [x] **Migrate raw Table to CrudTable**
- [x] Dialog → `SizedDialog size="md"` for message view

#### Settings.tsx
- [x] Wrap in `PageContainer`
- [x] Replace inline header with `PageHeader` (ui-core)
- [x] Keep Tabs layout
- [x] Use `FormSection` + `FormGrid` inside each tab
- [x] **Migrate raw Table (audit logs) to CrudTable**

#### ShiftReport.tsx
- [x] Wrap in `PageContainer`
- [x] Replace custom heading with `PageHeader` (ui-core)
- [x] Replace inline Cards with `StatGrid` + `StatCard`

### Phase 2E — Dashboard Pages

#### Dashboard.tsx
- [x] Wrap in `PageContainer`
- [x] Replace header with `PageHeader` (ui-core)
- [x] KPIGrid already well-structured — align with `StatCard` pattern
- [x] Standardize chart card wrappers

#### AnalyticsDashboard.tsx
- [x] Wrap in `PageContainer`
- [x] Standardize stat cards

#### WarehouseDashboard.tsx
- [x] Wrap in `PageContainer`
- [x] Standardize stat cards

---

## 9. Status Badge System (Already Good — Minor Polish)

`StatusBadge.tsx` is well-built. Changes needed:
- Remove `rounded-none` so it picks up theme radius
- Status dot: use `rounded-full` (always circular, even with border-radius changes)
- Consider adding `variant` prop for `outline` vs `filled` styles

---

## 10. Spacing System (Enforcement)

### Rules

| Context | Spacing |
|---------|---------|
| Page vertical sections | `space-y-6` (via PageContainer) |
| Card internal padding | `p-4` (sm) or `p-6` (default) |
| Form field gap | `gap-y-4 gap-x-6` |
| Form section gap | `space-y-6` |
| Stat grid gap | `gap-4` |
| Table toolbar gap | `gap-4` |
| Button group gap | `gap-2` |
| Dialog internal gap | `gap-6` |

### Anti-patterns to remove
- `space-y-8`, `space-y-12` — too much for card sections
- `gap-2` between form fields — too tight
- `mb-6`, `mb-8` — use `space-y-*` on parent instead
- `p-8` on cards — too much internal padding

---

## 11. Color System (Already Good — Enforcement)

The CSS token system is well-designed. Enforcement rules:

- **NEVER** use `bg-gray-*`, `text-slate-*`, `border-zinc-*` (CI already guards this)
- **ALWAYS** use semantic tokens: `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `bg-card`, `border-border`
- **Status colors**: Use `text-status-success`, `bg-status-warning/10`, etc.
- **Primary actions**: `bg-primary text-primary-foreground`
- **Destructive**: `bg-destructive/10 text-destructive`

---

## 12. Execution Phases

### Phase 0: Foundation (globals.css + primitives) — ~1 hour
1. Update `globals.css` radius tokens from `0px` to soft rounded
2. Remove explicit `rounded-none` from shadcn primitives (button, card, badge, input, dialog, checkbox, select, etc.)
3. Update input height from `h-9` to `h-10`
4. Remove unused `@fontsource-variable/public-sans` dependency
5. **Verify**: `npm run typecheck && npm run lint`

### Phase 1: Create ui-core components — ~2 hours
1. `components/ui-core/layout/page-container.tsx`
2. `components/ui-core/layout/page-header.tsx`
3. `components/ui-core/data/stat-card.tsx`
4. `components/ui-core/data/stat-grid.tsx`
5. `components/ui-core/data/id-badge.tsx`
6. `components/ui-core/form/form-section.tsx`
7. `components/ui-core/form/form-grid.tsx`
8. `components/ui-core/dialog/sized-dialog.tsx`
9. `components/ui-core/typography/heading.tsx`
10. `components/ui-core/typography/text.tsx`
11. `components/ui-core/index.ts` (barrel export)
12. **Verify**: `npm run typecheck && npm run lint`

### Phase 2: Upgrade CrudTable — ~1 hour
1. Replace raw `<table>` with shadcn Table primitives
2. Standardize header typography
3. Standardize row height and spacing
4. Add page-size selector
5. **Verify**: All pages using CrudTable still work

### Phase 3: Migrate pages (batch by batch) — ~4 hours
- **Batch A**: Shipments, Bookings, Manifests
- **Batch B**: Scanning, Inventory, Exceptions
- **Batch C**: Finance, Customers
- **Batch D**: Management, Messages, Settings, ShiftReport
- **Batch E**: Dashboard, AnalyticsDashboard, WarehouseDashboard
- After each batch: `npm run typecheck && npm run lint`

### Phase 4: Dialog sizing pass — ~1 hour
1. Update all form dialogs to use `SizedDialog` with correct size
2. Apply `FormSection` + `FormGrid` inside complex forms
3. **Verify**: All dialogs open at correct size

### Phase 5: ID formatting pass — ~1 hour
1. Update all column definitions that show raw IDs
2. Replace with `IdBadge` component
3. Target: Bookings, Finance, Customers, Management, Messages, Exceptions

### Phase 6: Final polish + verification — ~1 hour
1. Full `npm run typecheck`
2. Full `npm run lint`
3. Run `npm run guard:page-shell`
4. Full `npm run build` (production build)
5. Visual review of all pages
6. Remove deprecated old `PageHeader` (or mark as legacy)

---

## 13. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Radius change breaks existing layout | Phase 0 is isolated — can revert CSS vars |
| CrudTable refactor breaks pages | Keep same API, only change internals |
| Dialog resizing breaks form layout | Test each form dialog individually |
| New components unused | Migrate pages in batches, verify each |
| TypeScript errors from refactor | Run typecheck after every batch |

---

## 14. Success Criteria

After completion, every authenticated page must:

1. ✅ Be wrapped in `<PageContainer>`
2. ✅ Use `<PageHeader>` from ui-core (not the old one)
3. ✅ Use `<StatCard>` / `<StatGrid>` for KPI displays
4. ✅ Use `<CrudTable>` with shadcn Table primitives for data tables
5. ✅ Use `<SizedDialog>` with appropriate size for all modals
6. ✅ Show formatted IDs (not raw UUIDs) in all visible UI
7. ✅ Use `<FormSection>` + `<FormGrid>` for multi-field forms
8. ✅ Have consistent spacing (space-y-6 between sections, gap-4 in grids)
9. ✅ Have soft border-radius (not sharp 0px corners)
10. ✅ Pass typecheck, lint, page-shell guard, and build

---

## 15. Files Changed Summary (Estimated)

### New files (~12)
- `components/ui-core/layout/page-container.tsx`
- `components/ui-core/layout/page-header.tsx`
- `components/ui-core/data/stat-card.tsx`
- `components/ui-core/data/stat-grid.tsx`
- `components/ui-core/data/id-badge.tsx`
- `components/ui-core/form/form-section.tsx`
- `components/ui-core/form/form-grid.tsx`
- `components/ui-core/dialog/sized-dialog.tsx`
- `components/ui-core/typography/heading.tsx`
- `components/ui-core/typography/text.tsx`
- `components/ui-core/index.ts`

### Modified files (~30+)
- `globals.css` — radius tokens
- `components/ui/button.tsx` — remove rounded-none
- `components/ui/card.tsx` — remove rounded-none
- `components/ui/badge.tsx` — remove rounded-none
- `components/ui/input.tsx` — remove rounded-none, height
- `components/ui/dialog.tsx` — remove rounded-none
- `components/crud/CrudTable.tsx` — use shadcn Table primitives
- `components/crud/CrudUpsertDialog.tsx` — use SizedDialog
- `components/domain/KPICard.tsx` — align with StatCard or deprecate
- `components/domain/StatusBadge.tsx` — remove rounded-none on dot
- `pages/Shipments.tsx`
- `pages/Bookings.tsx`
- `pages/Manifests.tsx`
- `pages/Scanning.tsx`
- `pages/Inventory.tsx`
- `pages/Exceptions.tsx`
- `pages/Finance.tsx`
- `pages/Customers.tsx`
- `pages/Management.tsx`
- `pages/Settings.tsx`
- `pages/ShiftReport.tsx`
- `pages/admin/Messages.tsx`
- `pages/Dashboard.tsx`
- `pages/AnalyticsDashboard.tsx`
- `pages/WarehouseDashboard.tsx`
- `pages/Notifications.tsx`
- Various column definition files
- Various form components

### Deleted/deprecated files
- `components/ui/page-header.tsx` — replaced by ui-core version (keep until all imports migrated)
- `@fontsource-variable/public-sans` — remove from package.json
