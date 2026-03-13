# TAC Cargo Portal — Comprehensive UI/UX Refactor Roadmap

> **Status**: Draft — Awaiting approval before any code changes  
> **Date**: 2026-03-13  
> **Scope**: Full design system reconstruction + Tailwind v4 optimization + theme engine + dashboard redesign  
> **Goal**: Transform the current interface into a modern, SaaS-grade, enterprise logistics dashboard

---

## 1. Executive Summary

### The Problem

The TAC portal has a solid tech stack (React 19 + Tailwind v4 + shadcn/ui + Radix + Recharts + TanStack Query) but suffers from **visual inconsistency, aggressive typography, underutilized Tailwind v4 features, and a theme system that treats dark mode as an afterthought**. The result is a functional but visually fragmented application that doesn't match the quality of its engineering.

### The Solution

A phased, non-breaking refactor across 10 workstreams that:

1. Rebuilds the design token system with perceptually balanced OKLCH colors
2. Leverages Tailwind v4-native features (container queries, `@theme`, data attributes, dynamic values)
3. Creates a composable `ui-core` design system layer following compound component patterns
4. Redesigns the dashboard for data-first visual hierarchy
5. Implements a proper dual-surface theme engine (light + dark as first-class)
6. Rebuilds the landing and login pages to match modern 2026 SaaS standards

### Non-Goals

- No backend/API changes — this is purely UI/UX
- No new features — only visual and structural improvements to existing functionality
- No migration away from existing libraries (stays on shadcn/ui, Recharts, react-hook-form)
- No routing changes — same URL structure

---

## 2. Current State Audit (Phase 1 Findings)

### 2.1 Stack Assessment

| Layer | Current | Status | Notes |
|-------|---------|--------|-------|
| Framework | React 19.1.0 | ✅ Latest | Supports `use()`, no `forwardRef` needed |
| Styling | Tailwind CSS 4.1.18 | ✅ Latest | But v4 features underutilized |
| Components | shadcn/ui (radix-lyra) | ✅ Good | Needs wrapper layer |
| Icons | HugeIcons + Lucide | ⚠️ Mixed | Two icon libraries = inconsistency |
| Charts | Recharts | ✅ Good | Needs consistent card wrappers |
| Forms | react-hook-form + Zod | ✅ Good | Needs layout system |
| Animations | GSAP + Motion + Lottie | ⚠️ Heavy | Three animation libraries |
| State | Zustand 5 + TanStack Query v5 | ✅ Good | No changes needed |
| Theme | Custom CSS + ThemeProvider | ⚠️ Needs work | Dark mode is "inverted light" |

### 2.2 Design System Issues

| Issue | Severity | Evidence |
|-------|----------|----------|
| **Aggressive typography** | HIGH | `PageHeader` uses `font-black tracking-tighter uppercase` — screams at the user |
| **Badge readability** | HIGH | `text-[10px] font-mono uppercase tracking-widest` — nearly unreadable |
| **Border radius inconsistency** | MEDIUM | `globals.css` defines `--radius-sm: 0.125rem` but Login uses `rounded-none` 30+ times |
| **Dark mode as afterthought** | HIGH | Light theme uses `oklch(100% 0 0)`, dark uses `oklch(10% 0 0)` — not designed surfaces |
| **KPICard styling** | MEDIUM | Uses `border-white/10` (wrong in light mode), gradient overlays, `text-3xl font-bold` |
| **Three table implementations** | MEDIUM | `CrudTable`, `DataTable`, `EnhancedDataTable` — competing patterns |
| **Mixed icon libraries** | LOW | HugeIcons in dialog close, Lucide everywhere else |
| **`rounded-none` proliferation** | HIGH | Login.tsx alone has 30+ instances of `rounded-none` in inline styles |
| **Unused fonts** | LOW | `Bricolage Grotesque` loaded in HTML but unused; `@fontsource-variable/public-sans` in deps but unused |
| **Dead CSS** | LOW | Badge classes (`.badge--created` etc.) use `oklch(var(--status-created) / 15%)` syntax but those vars aren't OKLCH components |
| **Hardcoded date-picker radius** | LOW | `--rdp-day_button-border-radius: 0 !important` forces zero radius |

### 2.3 Pages Audit Summary

Every authenticated page has its own layout wrapper, spacing scheme, and header style. No two pages share the same structural pattern. See existing `UI_REDESIGN_PLAN.md` Section 2.4 for the full 28-page audit.

### 2.4 Login Page Issues

- 30+ `rounded-none` instances hardcoded
- `font-mono uppercase tracking-widest` used for labels, descriptions, and buttons
- Success toast uses `rounded-none` and `font-mono font-bold uppercase tracking-widest`
- Custom input fields instead of shared `Input` component
- Gradient background blobs use `rounded-none` (square blobs)

---

## 3. Web Research Findings (Phase 2)

### 3.1 Tailwind CSS v4 Features to Leverage

Based on the [Tailwind v4.0 release](https://tailwindcss.com/blog/tailwindcss-v4):

| Feature | Current Usage | Opportunity |
|---------|---------------|-------------|
| **CSS-first `@theme`** | ✅ Already using | Expand with semantic token layers |
| **OKLCH palette** | ✅ Already using | Improve perceptual balance across themes |
| **Container queries (`@container`)** | ❌ Not used | Use for responsive cards, sidebar-aware layouts |
| **Dynamic utility values** | ❌ Not used | Use `grid-cols-15`, `px-17` without config |
| **Data attribute variants** | Minimal | Use `data-state`, `data-active` for component styling |
| **CSS theme variables** | ✅ Partially | Expose all tokens as CSS vars for Motion/GSAP |
| **`color-mix()` via opacity** | ✅ Implicit | Leverage for hover/active state generation |
| **3D transforms** | ❌ Not used | Subtle card hover effects, login animation |
| **Gradient interpolation** | ❌ Not used | Use `in oklch` for vivid gradients |
| **`@starting-style`** | ❌ Not used | Entry animations without JS |
| **`not-*` variant** | ❌ Not used | Useful for "all except" styling patterns |

### 3.2 Modern SaaS Dashboard Trends (2026)

From [Muzli 2026 Dashboard Inspiration](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/) and [Stan Vision UX/UI Trends 2026](https://www.stan.vision/journal/ux-ui-trends-shaping-digital-products):

**Key Principles:**

1. **Spatial design with purpose** — Depth and layering should guide attention hierarchy, not just look trendy. Three-tier hierarchy: background data → active workspace → contextual actions.

2. **Dark mode as a designed surface** — 82% of users have dark mode enabled. A properly designed dark mode saw 60% reduced bounce rate and 170% more pages/session (Terra case study). Dark mode needs its own color tokens, elevation shadows, and contrast ratios — not just "inverted light."

3. **Functional micro-interactions** — Well-designed micro-interactions lead to 8% faster task completion and 12% fewer user errors. Animations should communicate information, not just move things.

4. **Quiet typography, loud data** — Enterprise dashboards use clean, restrained typography. The data (KPIs, charts, metrics) should be the visual focal point, not the headers.

5. **Soft, balanced color palettes** — The trend is towards "calm and futuristic" with soft gradients, clear spacing, and approachable color schemes. High-chroma neon accents are being replaced by muted, balanced tones.

6. **Glassmorphism with intent** — Only use transparency and blur when it communicates layering hierarchy. Apple launched Liquid Glass and added a "turn off" toggle 7 weeks later.

**What's NOT trending:**
- Glassmorphism overload (use sparingly and with purpose)
- Corporate Memphis illustration
- `font-black tracking-tighter uppercase` (aggressive) — replaced by `font-semibold tracking-tight` (confident)
- Neon/acid accent colors in enterprise contexts

### 3.3 OKLCH Color System Best Practices

From [OKLCH.net](https://oklch.net/), [oklch.fyi](https://oklch.fyi/), and the [Building Components skill: design-tokens reference](/.agents/skills/building-components/references/design-tokens.mdx):

- **Perceptual uniformity** — Equal numerical changes in L/C/H produce equal visual changes
- **Lightness (L)** should be the primary lever for theme differentiation (light: L=0.95–1.0 backgrounds; dark: L=0.10–0.18 backgrounds)
- **Chroma (C)** controls saturation — enterprise UIs should use C=0.01–0.05 for neutrals, C=0.10–0.20 for accents (not C=0.30 which is neon-level)
- **Hue (H)** rotation creates harmonious palettes — use analogous (±30°) for cohesion or complementary (180°) for emphasis
- **Accessible contrast** — WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text; OKLCH makes this predictable via L difference

### 3.4 Component Architecture Patterns (Skills Research)

From the **building-components** and **vercel-composition-patterns** skills:

- **Compound components** — Break monolithic components into Root/Trigger/Content/Item subcomponents with shared context
- **CVA (Class Variance Authority)** — Already used in button/badge; extend to all ui-core components
- **`cn()` ordering** — base → variants → conditionals → user overrides
- **Data attributes for state** — Use `data-slot`, `data-variant`, `data-size`, `data-state` (already in shadcn components)
- **No boolean prop proliferation** — Use composition (children, slots) instead of `isCompact`, `showIcon`, `hasAction`
- **React 19: no forwardRef** — Use `ref` as a regular prop; use `use()` instead of `useContext()`

---

## 4. Design System Architecture

### 4.1 Color Token Redesign

The current palette uses C=0.3 (neon-level chroma) for the primary accent. This is too aggressive for an enterprise logistics dashboard. The redesign brings it to C=0.15–0.18 for a more professional, balanced look.

#### Light Theme Palette

```
Background layers:
  --bg:         oklch(99%  0     0)       /* Warm off-white, not pure white */
  --panel:      oklch(100% 0     0)       /* Cards float above bg */
  --surface:    oklch(97%  0     0)       /* Subtle surface distinction */

Text hierarchy:
  --text-primary:  oklch(15%  0.005 260)  /* Near-black with slight warmth */
  --text-secondary: oklch(45% 0.01  260)  /* Secondary content */
  --text-muted:    oklch(55%  0.01  260)  /* Metadata, captions */
  --text-disabled: oklch(70%  0     0)    /* Disabled state */

Primary accent (Indigo-violet, professional):
  --primary:       oklch(55%  0.18  270)  /* Confident but not neon */
  --primary-hover: oklch(48%  0.20  270)  /* Darker on hover */
  --primary-fg:    oklch(99%  0     0)    /* White text on primary */

Borders:
  --border:        oklch(90%  0.005 260)  /* Subtle, barely visible */
  --border-strong: oklch(85%  0.01  260)  /* Emphasized borders */
  --input:         oklch(88%  0.005 260)  /* Input borders, slightly stronger */

Status (enterprise-appropriate chroma):
  --success:  oklch(55%  0.15  155)  /* Green — clear but not neon */
  --warning:  oklch(72%  0.14  80)   /* Amber — warm but readable */
  --error:    oklch(55%  0.18  25)   /* Red — urgent but not alarming */
  --info:     oklch(55%  0.15  250)  /* Blue — informational */
```

#### Dark Theme Palette (Designed Surface, Not Inverted)

```
Background layers:
  --bg:         oklch(14%  0.005 260)  /* Rich dark, not OLED black */
  --panel:      oklch(18%  0.008 260)  /* Cards with subtle blue tint */
  --surface:    oklch(22%  0.008 260)  /* Elevated surface */

Text hierarchy:
  --text-primary:  oklch(95%  0     0)    /* Bright but not pure white */
  --text-secondary: oklch(72% 0.01  260)  /* Secondary */
  --text-muted:    oklch(58%  0.01  260)  /* Muted */

Primary accent (lighter in dark mode for contrast):
  --primary:       oklch(72%  0.16  275)  /* Brighter for dark bg */
  --primary-hover: oklch(78%  0.18  275)  /* Even brighter on hover */
  --primary-fg:    oklch(14%  0     0)    /* Dark text on bright primary */

Borders:
  --border:        oklch(25%  0.008 260)  /* Subtle dark border */
  --border-strong: oklch(30%  0.01  260)  /* Emphasized */
  --input:         oklch(28%  0.008 260)  /* Input border */

Status (increased lightness for dark backgrounds):
  --success:  oklch(68%  0.15  155)
  --warning:  oklch(78%  0.14  80)
  --error:    oklch(68%  0.18  25)
  --info:     oklch(68%  0.15  250)
```

#### Design Rationale

| Decision | Rationale |
|----------|-----------|
| C=0.15–0.18 vs C=0.30 for primary | C=0.30 is neon-level; enterprise dashboards use muted accents |
| Off-white (99%) vs pure white (100%) | Reduces eye strain; warmer, more approachable |
| Dark bg oklch(14%) vs oklch(10%) | True black is harsh; 14% with blue tint is richer and more comfortable |
| Blue-tinted neutrals (H=260) | Slight cool undertone across neutrals creates cohesion with indigo primary |
| Status at C=0.15 vs C=0.25 | Lower chroma = professional; still clearly distinguishable |

### 4.2 Typography Scale

Replace the aggressive `font-black tracking-tighter uppercase` pattern with a calm, professional hierarchy:

```
Page title:    text-2xl   font-semibold  tracking-tight       (was: text-4xl font-black tracking-tighter uppercase)
Section head:  text-xl    font-semibold  tracking-tight
Card title:    text-base  font-medium
Label:         text-sm    font-medium    text-muted-foreground
Body:          text-sm    leading-relaxed
Meta/caption:  text-xs    text-muted-foreground
Monospace:     text-xs    font-mono      (data IDs, codes, timestamps)
Badge:         text-[11px] font-medium   tracking-wide         (was: text-[10px] font-mono uppercase tracking-widest)
```

### 4.3 Spacing System

Standardize on a 4px base grid with these semantic scales:

```
Page padding:        px-4 sm:px-6 lg:px-8, py-6
Section gap:         space-y-6 (between major sections)
Card padding:        p-4 (compact) or p-6 (default)
Form field gap:      gap-y-4 gap-x-6
Stat grid gap:       gap-4
Table toolbar gap:   gap-3
Button group gap:    gap-2
Dialog padding:      p-6
```

### 4.4 Border Radius Scale

Update from current ultra-minimal to soft, modern rounding:

```css
--radius-sm:  0.375rem;  /* 6px — inputs, badges */
--radius-md:  0.5rem;    /* 8px — buttons, small cards */
--radius-lg:  0.75rem;   /* 12px — cards, dialogs */
--radius-xl:  1rem;      /* 16px — large panels */
--radius-2xl: 1.25rem;   /* 20px — hero sections */
--radius:     0.5rem;    /* base radius for shadcn */
```

### 4.5 Shadow Scale (Refined)

The existing shadow scale is well-designed. Minor adjustments:

```css
/* Keep existing OKLCH-based shadows but add elevation-aware dark mode shadows */
.dark {
  --shadow-sm: 0 4px 12px 0 oklch(0% 0 0 / 20%);  /* Stronger in dark mode */
  --shadow-md: 0 12px 32px -4px oklch(0% 0 0 / 30%);
  /* ... rest follow same pattern */
}
```

---

## 5. Tailwind v4 Optimization Plan

### 5.1 Container Queries

Use `@container` for responsive card layouts that adapt to sidebar state:

```tsx
// Stat cards in dashboard adapt to container width, not viewport
<div className="@container">
  <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-4 gap-4">
    <StatCard ... />
  </div>
</div>
```

**Where to apply:**
- `StatGrid` — responsive columns based on container
- Chart card wrappers — show/hide legends based on container width
- Sidebar content — compact vs expanded views
- Form dialogs — responsive grid inside dialog body

### 5.2 Data Attribute Variants

Use `data-*` attributes for component state styling (already partially adopted via shadcn):

```tsx
// Enhanced button with data-loading state
<Button data-loading={isLoading} className="data-loading:opacity-50 data-loading:pointer-events-none">
  <Loader2 className="hidden data-loading:inline animate-spin" />
  Save
</Button>
```

**Where to apply:**
- `data-state="active|inactive"` on sidebar items
- `data-variant` on cards for colored accents
- `data-status` on status badges
- `data-loading` on buttons and forms

### 5.3 Dynamic Utility Values

Leverage Tailwind v4's removal of arbitrary value brackets for common utilities:

```tsx
// Before: grid-cols-[repeat(15,minmax(0,1fr))]
// After:  grid-cols-15

// Before: w-[17rem]
// After:  w-68 (17 * 4 = 68 spacing units)
```

### 5.4 Gradient Interpolation

Use `in oklch` for perceptually smooth gradients:

```tsx
// Hero gradients with OKLCH interpolation for vivid transitions
<div className="bg-gradient-to-r from-primary to-accent in-oklch" />
```

### 5.5 `@starting-style` for Entry Animations

Replace some GSAP/Motion entry animations with pure CSS:

```css
dialog[open] {
  opacity: 1;
  transform: scale(1);

  @starting-style {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

---

## 6. Component System Rebuild

### 6.1 `ui-core` Design System Layer

Following the **building-components** skill principles (composability, accessibility, customizability, lightweight, transparency) and **vercel-composition-patterns** (compound components, no boolean prop proliferation):

```
components/ui-core/
├── layout/
│   ├── page-container.tsx    # Max-width wrapper + padding + animation
│   └── page-header.tsx       # Title + description + actions (replaces old page-header)
│
├── data/
│   ├── stat-card.tsx          # KPI / metric card (replaces KPICard)
│   ├── stat-grid.tsx          # Responsive @container grid for stat cards
│   └── id-badge.tsx           # Formatted ID display (CN-2026-0001)
│
├── table/
│   └── data-table-toolbar.tsx # Reusable toolbar: search + filters + actions
│
├── form/
│   ├── form-section.tsx       # Titled section with separator
│   └── form-grid.tsx          # Responsive grid for form fields
│
├── dialog/
│   └── sized-dialog.tsx       # Dialog with size presets (sm/md/lg/xl/2xl)
│
├── typography/
│   ├── heading.tsx            # h1–h4 with consistent scale
│   └── text.tsx               # body/label/meta text variants
│
├── feedback/
│   └── empty-state.tsx        # Consistent empty/no-data pattern
│
└── index.ts                   # Barrel export
```

### 6.2 Component Specifications

#### PageContainer (Compound Component)

```tsx
// Usage:
<PageContainer maxWidth="default"> {/* default | narrow | wide | full */}
  {children}
</PageContainer>

// Implementation: wraps content with consistent max-width, padding, entry animation
// Uses @starting-style for CSS-only fade-in
```

#### PageHeader (Redesigned)

```tsx
// Usage:
<PageHeader
  title="Shipments"
  description="Track and manage all consignment notes"
  icon={<Package />}    // Optional icon in bg-primary/10 rounded-lg container
  badge={<LiveBadge />} // Optional inline badge
>
  <Button>Create Shipment</Button>  {/* Actions slot via children */}
</PageHeader>

// Typography: text-2xl font-semibold tracking-tight (NOT font-black uppercase)
```

#### StatCard (Replaces KPICard)

```tsx
// Usage:
<StatCard
  title="In Transit"
  value={42}
  subtitle="across 3 corridors"
  icon={<Truck />}
  trend={{ value: 12, direction: 'up' }}
  onClick={() => navigate('/shipments?status=IN_TRANSIT')}
/>

// Uses @container for responsive layout
// Card component underneath, consistent border-radius from theme
```

#### StatGrid (Container Query Responsive)

```tsx
// Usage:
<StatGrid columns={4}>  {/* 1-4, responsive via @container */}
  <StatCard ... />
</StatGrid>

// Implementation: @container wrapper with @sm:grid-cols-2 @lg:grid-cols-{columns}
```

#### SizedDialog

```tsx
// Usage:
<SizedDialog size="xl">  {/* sm | md | lg | xl | 2xl | full */}
  <DialogHeader>...</DialogHeader>
  <DialogBody>...</DialogBody>  {/* scrollable body */}
  <DialogFooter>...</DialogFooter>
</SizedDialog>

// Size map: sm=448px, md=512px, lg=672px, xl=896px, 2xl=1152px, full=calc(100vw-4rem)
```

#### FormSection + FormGrid

```tsx
// Usage:
<FormSection title="Consignee Details" icon={<User />}>
  <FormGrid columns={2}>
    <FormField name="name" ... />
    <FormField name="phone" ... />
  </FormGrid>
  <FormField name="address" ... /> {/* Full-width field */}
  <FormGrid columns={3}>
    <FormField name="city" ... />
    <FormField name="state" ... />
    <FormField name="zip" ... />
  </FormGrid>
</FormSection>
```

#### Heading + Text (Typography Components)

```tsx
// Usage:
<Heading level={1}>Shipments</Heading>      // text-2xl font-semibold tracking-tight
<Heading level={2}>Package Details</Heading> // text-xl font-semibold tracking-tight
<Text variant="label">Status</Text>          // text-sm font-medium text-muted-foreground
<Text variant="meta">Updated 2h ago</Text>   // text-xs text-muted-foreground
<Text variant="mono">CN-2026-0001</Text>     // text-xs font-mono
```

### 6.3 Shadcn Primitive Updates

| Component | Change | Impact |
|-----------|--------|--------|
| `button.tsx` | Add `rounded-md` to base class via theme radius | All buttons get soft corners |
| `badge.tsx` | Change `text-[10px] font-mono uppercase tracking-widest` → `text-[11px] font-medium tracking-wide` | Readable badges |
| `input.tsx` | Already `h-10` ✅; ensure `rounded-md` via theme | Better touch targets |
| `dialog.tsx` | Add `rounded-lg` via theme; default `sm:max-w-lg` stays | Soft dialog corners |
| `card.tsx` | Add `rounded-lg` via theme radius | Soft card corners |
| Date picker | Remove `--rdp-day_button-border-radius: 0 !important` | Rounded date picker |

---

## 7. Theme Engine Implementation

### 7.1 Architecture

```
Theme Layer Stack:
┌─────────────────────────────────────┐
│  @theme { }                         │ ← Tailwind v4 theme variables (static)
├─────────────────────────────────────┤
│  :root { --bg, --primary, ... }     │ ← Light theme tokens (default)
├─────────────────────────────────────┤
│  .dark { --bg, --primary, ... }     │ ← Dark theme tokens (class-based)
├─────────────────────────────────────┤
│  @layer base { *, body }            │ ← Reset + body defaults
├─────────────────────────────────────┤
│  @layer components { .badge--*, }   │ ← Component-level overrides
├─────────────────────────────────────┤
│  @layer utilities { ... }           │ ← Tailwind utilities (auto-generated)
└─────────────────────────────────────┘
```

### 7.2 Theme Switching

Current: `ThemeProvider` applies `.dark` class to `documentElement` + inline script in `index.html` prevents FOWT.

**Keep this pattern** — it works correctly. Improvements:

1. Add `color-scheme: light` / `color-scheme: dark` for native form element theming
2. Ensure system preference detection uses `prefers-color-scheme` media query
3. Add smooth `transition-colors duration-200` on theme switch (already present in layout)

### 7.3 Dark Mode as First-Class Surface

Instead of simply inverting values, the dark theme gets independently designed tokens:

- **Backgrounds**: Rich dark (14%) with slight blue tint, not OLED black (10%)
- **Cards**: Elevated panels at 18% lightness, distinct from background
- **Shadows**: Stronger opacity (20–30%) to be visible against dark backgrounds
- **Status colors**: Higher lightness (68% vs 55%) for readability on dark backgrounds
- **Primary accent**: Higher lightness (72% vs 55%) for sufficient contrast

---

## 8. Dashboard Redesign

### 8.1 Current Dashboard Structure

```
PageHeader (aggressive typography) + LIVE indicator + date range + export
  └── Hero Banner (KPI summary tiles)
  └── KPIGrid (mixed stat cards)
  └── 3-column chart grid (9 charts in Suspense boundaries)
  └── QuickActions
  └── DomainOverview
  └── LiveActivityFeed + OperationalHealth
```

### 8.2 Redesigned Dashboard Structure

```
PageContainer
  └── PageHeader title="Dashboard" + date range picker + refresh
  │
  └── StatGrid columns={4}  ← Container-query responsive
  │     ├── StatCard "Total Shipments" (trend: up)
  │     ├── StatCard "In Transit" (navigable)
  │     ├── StatCard "SLA Compliance" (trend indicator)
  │     └── StatCard "Open Exceptions" (alert color if high)
  │
  └── Primary Charts Grid (2-column, @container responsive)
  │     ├── ShipmentTrendChart (full-width span)
  │     └── RealtimeCorridorActivity + StatusDistribution (side by side)
  │
  └── Secondary Charts Grid (3-column, @container responsive)
  │     ├── RevenueTrendChart
  │     ├── HubPerformanceChart
  │     └── ChartBarInteractive
  │
  └── Operational Section (2-column)
  │     ├── LiveActivityFeed (scrollable, compact)
  │     └── QuickActions (role-scoped)
  │
  └── DomainOverview (System Modules, collapsible)
```

### 8.3 Chart Card Standardization

Every chart gets a consistent wrapper:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Shipment Trends</CardTitle>
    <CardDescription>Last 30 days</CardDescription>
    <CardAction>
      <Button variant="ghost" size="icon-sm"><MoreHorizontal /></Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <div className="@container">
      <ShipmentTrendChart />
    </div>
  </CardContent>
</Card>
```

---

## 9. Form System Refactor

### 9.1 Current Issues

- Single-column layouts in narrow `sm:max-w-lg` (512px) dialogs
- No visual grouping of related fields
- Inconsistent label typography (some `uppercase tracking-widest`, some normal)
- No responsive grid pattern

### 9.2 Target Pattern

See Section 6.2 FormSection + FormGrid specifications.

### 9.3 Dialog Size Assignments

| Dialog | Current | Target | Reason |
|--------|---------|--------|--------|
| Delete confirmation | sm:max-w-lg | SizedDialog sm (448px) | Simple confirmation |
| Message reply | sm:max-w-lg | SizedDialog md (512px) | Single section |
| Customer create/edit | sm:max-w-lg | SizedDialog lg (672px) | Multi-field |
| User create/edit | custom | SizedDialog lg (672px) | Multi-field |
| Exception raise/resolve | sm:max-w-lg | SizedDialog lg (672px) | Multi-section |
| Shipment create | sm:max-w-lg | SizedDialog xl (896px) | Complex, multi-section |
| Invoice create | custom | SizedDialog xl (896px) | Multi-step wizard |
| Booking form | sm:max-w-lg | SizedDialog xl (896px) | Complex form |
| Manifest wizard | custom | SizedDialog 2xl (1152px) | Multi-step |

---

## 10. Layout Refactor

### 10.1 Sidebar

- Keep current sidebar structure (it works well)
- Update colors to use new palette tokens
- Remove any `rounded-none` instances
- Use `data-state="active"` for active item styling

### 10.2 Header

- Keep current functionality (sidebar toggle, breadcrumb, search, scan, theme, notifications)
- Update backdrop-blur styling to use new surface tokens
- Ensure consistent spacing

### 10.3 Main Content Area

```tsx
// Current:
<motion.main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
  <div className="mx-auto max-w-screen-2xl">{children}</div>
</motion.main>

// Target: same structure, PageContainer handles inner constraints
<motion.main className="flex-1 overflow-auto">
  {children}  {/* PageContainer handles padding + max-width */}
</motion.main>
```

---

## 11. Landing + Login Rebuild

### 11.1 Login Page Overhaul

**Current problems:**
- 30+ `rounded-none` instances
- `font-mono uppercase tracking-widest` everywhere
- Custom input fields (not using shared Input component)
- Square gradient blobs

**Target:**
- Use shared `Input` component with proper `rounded-md`
- Normal `text-sm font-medium` labels (not mono uppercase)
- Rounded gradient blobs for soft ambient effect
- Clean glassmorphism on card (purposeful, not decorative)
- Streamlined form with consistent spacing
- Shared `Button` component for submit

### 11.2 Landing Page

- Update to match new color palette
- Replace aggressive typography with calm, professional tone
- Ensure dark mode is fully designed (not just inverted)

---

## 12. Execution Phases

### Phase 0: Foundation — globals.css + Theme Tokens (~1 session)

**Changes:**
1. Update OKLCH color tokens for both light and dark themes
2. Update radius tokens from current values to soft rounded
3. Update shadow scale for dark mode
4. Remove `--rdp-day_button-border-radius: 0 !important`
5. Remove unused font imports and dependencies
6. Add `color-scheme` property

**Verification:** `npm run typecheck && npm run lint && npm run build`

### Phase 1: Shadcn Primitive Polish (~1 session)

**Changes:**
1. Update `button.tsx` — ensure radius from theme, no explicit `rounded-none`
2. Update `badge.tsx` — change typography from aggressive mono to readable
3. Update `input.tsx` — ensure radius from theme
4. Update `dialog.tsx` — ensure radius, review default max-width
5. Update `card.tsx` — ensure radius from theme
6. Remove any explicit `rounded-none` from shadcn primitives

**Verification:** `npm run typecheck && npm run lint` + visual review of all component states

### Phase 2: Create ui-core Components (~2 sessions)

**Changes:**
1. `page-container.tsx` — max-width wrapper + padding + entry animation
2. `page-header.tsx` — title + description + actions (calm typography)
3. `stat-card.tsx` — KPI card with trend, icon, navigation
4. `stat-grid.tsx` — @container responsive grid
5. `id-badge.tsx` — formatted ID display
6. `form-section.tsx` — titled section with separator
7. `form-grid.tsx` — responsive column grid
8. `sized-dialog.tsx` — dialog with size presets
9. `heading.tsx` + `text.tsx` — typography components
10. `empty-state.tsx` — consistent no-data pattern
11. `index.ts` — barrel export

**Verification:** `npm run typecheck && npm run lint` + storybook-style visual test in isolation

### Phase 3: Table Consolidation (~1 session)

**Changes:**
1. Update `CrudTable` to use shadcn `Table` primitives
2. Standardize header typography
3. Standardize row height and spacing
4. Add page-size selector

**Verification:** All pages using CrudTable still render correctly

### Phase 4: Page Migration (Batched — ~4 sessions)

| Batch | Pages | Focus |
|-------|-------|-------|
| A | Shipments, Bookings, Manifests | Core operations |
| B | Scanning, Inventory, Exceptions | Warehouse |
| C | Finance, Customers | Business |
| D | Management, Messages, Settings, ShiftReport | Admin |
| E | Dashboard, AnalyticsDashboard, WarehouseDashboard | Dashboards |

Each page: wrap in PageContainer, use PageHeader, use StatCard/StatGrid, format IDs.

**Verification per batch:** `npm run typecheck && npm run lint && npm run build`

### Phase 5: Form Dialog Sizing (~1 session)

**Changes:**
1. Update all form dialogs to use SizedDialog
2. Apply FormSection + FormGrid inside complex forms
3. Test each dialog opens at correct size

**Verification:** Open every dialog, verify sizing and layout

### Phase 6: Dashboard Redesign (~1 session)

**Changes:**
1. Restructure Dashboard.tsx layout
2. Apply StatCard/StatGrid pattern
3. Standardize chart card wrappers
4. Add @container responsive behavior
5. Review role-scoped visibility

**Verification:** Visual review at multiple viewport sizes; role-based testing

### Phase 7: Login + Landing Rebuild (~1 session)

**Changes:**
1. Remove all `rounded-none` from Login.tsx
2. Switch to shared Input/Button components
3. Update typography to calm professional style
4. Update landing page to match new palette
5. Test dark mode thoroughly

**Verification:** Visual review + Playwright auth tests

### Phase 8: Theme Engine Polish (~1 session)

**Changes:**
1. Final dark mode tuning — contrast ratios, elevation shadows
2. Color-scheme property integration
3. Smooth theme transition testing
4. Remove any remaining hardcoded color classes

**Verification:** `npm run theme-audit:ci` + visual review in both themes

### Phase 9: Final Polish + Verification (~1 session)

**Changes:**
1. Remove deprecated old `PageHeader` (or mark as legacy)
2. Clean up unused CSS (dead badge classes, unused animations)
3. Run full CI pipeline: typecheck, lint, format, build
4. Run Playwright E2E suite
5. Visual regression comparison
6. Performance audit (bundle size, Lighthouse)

**Verification:** Full CI green + visual sign-off

---

## 13. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Radius change breaks layouts | LOW | MEDIUM | Phase 0 is isolated CSS vars — instant revert |
| Color token change breaks contrast | MEDIUM | HIGH | Test every component in both themes before proceeding |
| CrudTable refactor breaks pages | LOW | HIGH | Keep same API, only change internals |
| Dialog resizing breaks form layout | MEDIUM | MEDIUM | Test each dialog individually |
| Badge typography change affects density | MEDIUM | LOW | `text-[11px]` vs `text-[10px]` is minimal size change |
| Dark mode redesign looks wrong | MEDIUM | MEDIUM | Design tokens independently, not by inverting |
| Landing page customers notice change | LOW | LOW | Landing page is public but low-traffic |

---

## 14. Success Criteria

After completion, the TAC portal must:

1. ✅ Have a perceptually balanced OKLCH color palette (C ≤ 0.20 for accents)
2. ✅ Dark mode is a designed surface, not inverted light
3. ✅ All pages use `PageContainer` + `PageHeader` from ui-core
4. ✅ All KPI displays use `StatCard` / `StatGrid`
5. ✅ All data tables use `CrudTable` with shadcn Table primitives
6. ✅ All modals use `SizedDialog` with appropriate size
7. ✅ All forms use `FormSection` + `FormGrid` for multi-field layouts
8. ✅ Typography is calm and professional (no `font-black uppercase` in headers)
9. ✅ Border radius is soft and consistent (no `rounded-none` proliferation)
10. ✅ Container queries used for responsive dashboard cards
11. ✅ Formatted IDs shown (not raw UUIDs) in all visible UI
12. ✅ Login page uses shared components, no custom inputs
13. ✅ CI passes: typecheck, lint, format, build, guard scripts
14. ✅ Playwright E2E suite passes
15. ✅ No regressions in functionality

---

## 15. Alternatives Considered

### A. Full Component Library Migration (Rejected)

**Option**: Migrate from shadcn/ui to a different library (e.g., Ark UI, Park UI).  
**Why rejected**: shadcn/ui is well-established in this codebase, the team knows it, and it's the correct base layer. The problem isn't the primitives — it's the lack of a design system layer on top.

### B. CSS-in-JS / Styled Components (Rejected)

**Option**: Use Emotion/Styled Components for component theming.  
**Why rejected**: Tailwind v4's CSS-first configuration + OKLCH + CSS variables already provides everything needed. Adding a CSS-in-JS layer would increase bundle size and complexity.

### C. Radical Redesign with New Layout (Rejected)

**Option**: Completely new layout (e.g., top-nav instead of sidebar).  
**Why rejected**: The current sidebar layout is standard for logistics dashboards. The problem is styling, not structure. Changing layout would break user muscle memory and require retraining.

### D. Incremental Color Tweaks Only (Rejected)

**Option**: Just adjust a few color values and call it done.  
**Why rejected**: The issues are systemic (typography, spacing, component patterns, theme architecture). Spot fixes would create more inconsistency, not less.

---

## 16. Estimated Timeline

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| Phase 0: Foundation | ~1 session | None |
| Phase 1: Shadcn Polish | ~1 session | Phase 0 |
| Phase 2: ui-core Components | ~2 sessions | Phase 0+1 |
| Phase 3: Table Consolidation | ~1 session | Phase 0+1 |
| Phase 4: Page Migration | ~4 sessions | Phase 2+3 |
| Phase 5: Form Dialog Sizing | ~1 session | Phase 2 |
| Phase 6: Dashboard Redesign | ~1 session | Phase 2 |
| Phase 7: Login + Landing | ~1 session | Phase 0+1 |
| Phase 8: Theme Polish | ~1 session | All above |
| Phase 9: Final Verification | ~1 session | All above |

**Total: ~14 sessions** (can be parallelized — Phases 3+5+6+7 are independent after Phase 2)

---

## 17. Files Changed Summary

### New files (~13)
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
- `components/ui-core/feedback/empty-state.tsx`
- `components/ui-core/index.ts`
- Unit tests for ui-core components

### Modified files (~35+)
- `globals.css` — complete token redesign
- `index.html` — remove unused font, add color-scheme
- `package.json` — remove unused @fontsource dependency
- `components/ui/button.tsx` — radius from theme
- `components/ui/badge.tsx` — typography update
- `components/ui/card.tsx` — radius from theme
- `components/ui/input.tsx` — radius from theme
- `components/ui/dialog.tsx` — radius from theme
- `components/domain/KPICard.tsx` — deprecate or replace
- `components/crud/CrudTable.tsx` — shadcn Table primitives
- `components/layout/DashboardLayout.tsx` — padding delegation
- `components/auth/Login.tsx` — full rebuild
- All 28 page files — PageContainer + PageHeader migration
- Various form dialog components — SizedDialog + FormSection/FormGrid

### Deprecated
- `components/ui/page-header.tsx` — replaced by ui-core version
- `components/domain/KPICard.tsx` — replaced by ui-core StatCard
- `@fontsource-variable/public-sans` — unused dependency
