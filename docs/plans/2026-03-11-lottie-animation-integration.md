# Lottie Animation Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Lottie animation placeholders to 4 high-impact sections of the landing page, replacing static Lucide icons and CSS-animated SVGs with a reusable `<LottieSlot>` component that gracefully falls back to a skeleton when no JSON file exists yet.

**Architecture:** A shared `<LottieSlot>` wrapper component handles lazy-loading, error fallback (skeleton pulse), and `prefers-reduced-motion`. Each section swaps its current static visual for a `<LottieSlot>` pointing to a file in `public/lottie/`. When the real `.json` files are dropped in later, they render automatically.

**Tech Stack:** React 19, lottie-react (already installed), Tailwind CSS v4, Lucide React (fallback icons)

---

## Design Rationale (Based on 2025-2026 UI Trends)

Informed by Awwwards-winning logistics sites (CargoKite, Logika, Freezpak) and current SaaS design trends:

1. **Purposeful Micro-Animations** — Every Lottie serves a function (illustrating a service, rewarding interaction), not decoration.
2. **Scroll-Triggered Activation** — Animations only play when visible via `IntersectionObserver`, reducing CPU usage and creating a narrative scroll experience.
3. **Calm Design / Strategic Minimalism** — Animations are subtle, loop slowly, and respect `prefers-reduced-motion`. No jarring or excessive motion.
4. **Product-Led Storytelling** — Each animation visually demonstrates the service it represents (a plane flying a route, a package being tracked).

---

## Placement Map

| Section | Current Visual | Lottie File | Animation Concept | Size |
|---------|---------------|-------------|-------------------|------|
| **Global Fleet** Card 1 | `<Plane>` icon | `fleet-air.json` | Minimal line-art plane banking along a curved route | 200×200 |
| **Global Fleet** Card 2 | `<Ship>` icon | `fleet-sea.json` | Cargo ship gently rocking on abstract waves | 200×200 |
| **Global Fleet** Card 3 | `<Truck>` icon | `fleet-surface.json` | Truck driving along a highway line, wheels spinning | 200×200 |
| **Global Fleet** Card 4 | `<Package>` icon | `fleet-fulfillment.json` | Package being sealed/taped, conveyor belt motion | 200×200 |
| **Tracking Section** | No visual | `tracking-journey.json` | Parcel icon moving along a dotted route from A → B, looping | 300×200 |
| **Stats CTA** | Static stat cards | `stats-growth.json` | Abstract rising bar chart / upward arrow pulse | 120×120 |
| **Contact Section** | Static icons | `contact-envelope.json` | Envelope dropping into a mailbox, subtle loop | 200×200 |

---

## Tasks

### Task 1: Create `<LottieSlot>` Reusable Component

**File:** `components/landing-new/lottie-slot.tsx` [NEW]

```tsx
// Props: src (string path to /lottie/*.json), fallbackIcon (ReactNode), className, width, height
// Behavior:
//   1. Lazy-fetch the JSON from `src`
//   2. If fetch succeeds → render <Lottie> with animationData
//   3. If fetch fails (404) → render a dashed-border placeholder with fallbackIcon + filename label
//   4. Respect prefers-reduced-motion: if enabled, show first frame only (loop={false}, autoplay={false})
//   5. Use IntersectionObserver to only fetch + play when in viewport
```

**Test:** Verify it renders the fallback when JSON doesn't exist, and renders Lottie when it does (hero-truck.json exists).

---

### Task 2: Add Lottie Slots to Global Fleet Cards

**File:** `components/landing-new/global-fleet.tsx` [MODIFY]

For each of the 4 cards, replace the static Lucide icon block:
```tsx
// Before:
<Plane className="w-20 h-20 ..." />

// After:
<LottieSlot
  src="/lottie/fleet-air.json"
  fallbackIcon={<Plane className="w-12 h-12 text-foreground/50" />}
  className="w-[200px] h-[200px]"
/>
```

Repeat for Ship → `fleet-sea.json`, Truck → `fleet-surface.json`, Package → `fleet-fulfillment.json`.

---

### Task 3: Add Lottie Slot to Tracking Section

**File:** `components/landing-new/tracking-section.tsx` [MODIFY]

Add a visual illustration column next to the tracking input form:
```tsx
// Place inside the section, above or beside the input, as a visual anchor
<LottieSlot
  src="/lottie/tracking-journey.json"
  fallbackIcon={<MapPin className="w-12 h-12 text-foreground/50" />}
  className="w-full max-w-[300px] h-[200px] mx-auto mb-6"
/>
```

---

### Task 4: Add Lottie Slot to Stats CTA

**File:** `components/landing-new/stats-cta.tsx` [MODIFY]

Add a subtle background animation behind the stats grid:
```tsx
<LottieSlot
  src="/lottie/stats-growth.json"
  fallbackIcon={null}
  className="absolute right-0 top-1/2 -translate-y-1/2 w-[200px] h-[200px] opacity-10 pointer-events-none"
/>
```

---

### Task 5: Add Lottie Slot to Contact Section

**File:** `components/landing-new/contact-section.tsx` [MODIFY]

Add a mailbox/envelope animation above the contact info:
```tsx
<LottieSlot
  src="/lottie/contact-envelope.json"
  fallbackIcon={<Send className="w-12 h-12 text-foreground/50" />}
  className="w-[200px] h-[200px] mx-auto mb-6"
/>
```

---

### Task 6: Verification

```bash
npm run typecheck
npm run lint
npm run build
```

Visual check: All 7 slots should render as elegant dashed placeholders with the fallback icon and filename label until the real JSON files are provided.

---

## LottieFiles Recommendations (for later)

When sourcing the actual animations, search [LottieFiles.com](https://lottiefiles.com) for:
- `"airplane route"` or `"plane animation minimal"` → fleet-air
- `"cargo ship"` or `"ship waves minimal"` → fleet-sea
- `"delivery truck"` or `"truck driving line art"` → fleet-surface
- `"package box"` or `"packing animation"` → fleet-fulfillment
- `"package tracking"` or `"delivery route map"` → tracking-journey
- `"bar chart growth"` or `"data visualization"` → stats-growth
- `"email envelope"` or `"mailbox animation"` → contact-envelope

**File format:** Use `.dotLottie` (up to 90% smaller) or optimized Lottie JSON. Keep each file under 50KB.
