# TAC Cargo - Enterprise Design Tokens (v1.0)

## Purpose
This document defines the enterprise semantic color and typography system.
Only semantic tokens may be used in UI code. No direct hex/rgb values.

---

## 1) Color System (Semantic)

### 1.1 Core Neutrals
```
--bg-app
--bg-surface
--bg-muted

--border-subtle
--border-strong

--text-primary
--text-secondary
--text-muted
```

### 1.2 Brand Accent
```
--accent-primary
--accent-hover
--accent-soft
```

**Allowed Uses**
- Primary CTA
- Active nav item
- Focus ring
- Selected state

**Not allowed**
- Card backgrounds
- Status indicators
- Charts by default

### 1.3 Status Colors (Operational Semantics)
```
--status-success
--status-warning
--status-error
--status-info
--status-neutral
```

**Rule**: Status colors must never equal brand colors.

### 1.4 Charts
```
CHART_COLORS = {
  primary: var(--accent-primary)
  secondary: var(--status-info)
  success: var(--status-success)
  warning: var(--status-warning)
  error: var(--status-error)
  grid: var(--border-subtle)
  axis: var(--text-muted)
}
```

Rules:
- No hex values
- No gradients
- Max 3 colors per chart
- Gridlines always subtle

---

## 2) Typography

### 2.1 Font Stack
```
--font-sans: "Inter", system-ui, -apple-system, BlinkMacSystemFont
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular
```

### 2.2 Type Scale
```
--text-xs: 11px
--text-sm: 13px
--text-base: 14px
--text-md: 15px
--text-lg: 16px
--text-xl: 18px
--text-2xl: 20px
```

### 2.3 Font Weights
```
--font-regular: 400
--font-medium: 500
--font-semibold: 600
```

Rules:
- Avoid 700+
- Tables default to 14px
- AWB/IDs use mono

---

## 3) Density & Spacing

### Cards
- Reduce padding by ~15%
- Flat surfaces, no heavy shadows

### Tables
- Row height: 44-48px
- Header contrast stronger than body
- AWB/IDs in mono

---

## 4) Usage Rules

**Allowed**
```
<div className="bg-surface text-foreground border border-border" />
<button className="bg-primary text-white hover:bg-primary-hover" />
<span className="text-success">Delivered</span>
<code className="font-mono text-sm">AWB123</code>
```

**Forbidden**
- bg-purple-*
- text-gray-*
- bg-[#...]
- inline styles for color

---

## 5) Enforcement
- No Tailwind default colors
- No inline styles
- All color values must map to CSS variables
