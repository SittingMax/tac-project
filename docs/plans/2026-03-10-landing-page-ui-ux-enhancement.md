# Landing Page UI/UX Enhancement Plan

| Field | Value |
|---|---|
| **Author** | Antigravity |
| **Date** | 2026-03-10 |
| **Status** | Draft |
| **Estimated effort** | ~8 hours across 15 tasks |

## Context

The TAC Portal landing page (`pages/LandingPage.tsx`) renders 7 sections: HeroFinal → TrackingSection → SystemCapabilities → GlobalFleet → ContactSection → Footer → TacBot. A design audit revealed:

1. **An unused `StatsCTA` component** with animated counters — built but never wired in
2. **6 motion primitives** (`FadeUp`, `StaggerChildren`, `ScrollProgress`, `ParallaxLayer`, `TextReveal`, `CountUp`) — none used on the landing page
3. **Content duplication** between SystemCapabilities and GlobalFleet (same 4 services shown twice)
4. **Dead CTAs** — "Start a Shipment" and "Explore Capabilities" don't navigate anywhere
5. **Confusing technical labels** — "Manual Tracking", "Track by CN", "Custody Log"
6. **Excessive whitespace** — `py-24` padding throughout creates dead air

---

## 🟢 Tier 1 — Quick Wins

### Task 1: Wire StatsCTA into LandingPage

**File:** `pages/LandingPage.tsx`

**What:** Import `StatsCTA` from `@/components/landing-new/stats-cta` and render it between `<GlobalFleet />` and `<ContactSection />`.

**Acceptance:** StatsCTA section visible on page with animated counters triggering on scroll.

---

### Task 2: Add ScrollProgress indicator to LandingPage

**File:** `pages/LandingPage.tsx`

**What:** Import `ScrollProgress` from `@/components/motion/ScrollProgress` and render it as the first child of the `<div>` wrapper (before `<main>`).

**Acceptance:** Purple progress bar visible at top of viewport, filling as user scrolls.

---

### Task 3: Add FadeUp animations to TrackingSection

**File:** `components/landing-new/tracking-section.tsx`

**What:**
- Import `FadeUp` from `@/components/motion/FadeUp`
- Wrap the section header (badge + h2 + description) in `<FadeUp>`
- Wrap the tracking card in `<FadeUp delay={0.2}>`

**Acceptance:** Tracking section heading and card animate in when scrolled into view.

---

### Task 4: Add FadeUp animations to SystemCapabilities

**File:** `components/landing-new/system-capabilities.tsx`

**What:**
- Import `FadeUp` and `StaggerChildren` from `@/components/motion/`
- Wrap the section header block in `<FadeUp>`
- Wrap the capabilities grid in `<StaggerChildren>`
- Add `motion.div` with `staggerItemVariants` to each capability card

**Acceptance:** Section heading fades in first, then cards stagger in one by one on scroll.

---

### Task 5: Add FadeUp animations to GlobalFleet

**File:** `components/landing-new/global-fleet.tsx`

**What:**
- Import `FadeUp` and `StaggerChildren`
- Wrap section header in `<FadeUp>`
- Wrap the 4-card grid in `<StaggerChildren>`

**Acceptance:** Same scroll-reveal behavior as SystemCapabilities.

---

### Task 6: Add FadeUp animations to ContactSection

**File:** `components/landing-new/contact-section.tsx`

**What:**
- Import `FadeUp`
- Wrap headline in `<FadeUp>`
- Wrap contact info column in `<FadeUp delay={0.1}>`
- Wrap form column in `<FadeUp delay={0.2}>`

**Acceptance:** Contact section elements cascade in on scroll.

---

### Task 7: Fix dead CTAs

**Files:**
- `components/landing-new/hero-final.tsx` — "Start a Shipment" button currently links to `#` or has no navigation. Wire it to smooth-scroll to the tracking section (`#tracking`) or open `BookingDialog`.
- `components/landing-new/system-capabilities.tsx` — "Explore Capabilities" button. Wire to smooth-scroll to `#fleet` section, or remove if redundant.

**Acceptance:** All CTA buttons navigate to a meaningful destination.

---

### Task 8: Rename confusing labels

**Files:**
- `components/landing-new/tracking-section.tsx`:
  - Badge: "Manual Tracking" → "Shipment Tracking"
  - Tab 1: "Track by CN" → "Track by Number"
  - Tab 2: "Custody Log" → "View History"
  - Input placeholder: "Enter CN Number" → "Enter tracking number"

**Acceptance:** All user-facing labels use plain English.

---

## 🟡 Tier 2 — Meaningful Polish

### Task 9: Add TextReveal to section headings

**Files:** `hero-final.tsx`, `tracking-section.tsx`, `system-capabilities.tsx`, `global-fleet.tsx`, `contact-section.tsx`

**What:** Replace static `<h2>` headings with `<TextReveal>` component for word-by-word reveal animation on scroll.

**Acceptance:** Section headings animate word-by-word when scrolled into viewport.

---

### Task 10: Reduce excessive section padding

**Files:** All landing section components

**What:** Audit and reduce `py-24` to `py-16` or `py-20` where the section feels empty. Keep `py-24` for Hero only.

**Acceptance:** Sections feel tighter; less dead whitespace when scrolling.

---

### Task 11: Add social proof strip to Hero

**File:** `components/landing-new/hero-final.tsx`

**What:** Replace the generic Lucide icons in "Trusted Enterprise Partners" with actual text-based partner/client names (e.g., "Kangla Global", "Siroi Logistics", "Loktak Hydro", "Ima Exports" — from old design) styled as a horizontal marquee or static row.

**Acceptance:** Real partner names visible below the hero CTA.

---

### Task 12: Differentiate SystemCapabilities vs GlobalFleet

**Files:** `system-capabilities.tsx`, `global-fleet.tsx`

**What:**
- **SystemCapabilities** becomes the "HOW" section — focus on technology/capabilities (real-time tracking, route optimization, secure packaging, multi-modal network). Rename heading to "Built with Precision" or similar.
- **GlobalFleet** stays as the "WHAT" section — the 4 service offerings (Air Freight, Surface, Pick & Drop, Packing).

This removes the current duplication where both sections describe the same 4 services.

**Acceptance:** Each section has a distinct purpose; no repeated content.

---

### Task 13: Enhance Contact section left column

**File:** `components/landing-new/contact-section.tsx`

**What:** Add a customer testimonial quote card below the "Operating Hours" block to fill the dead space. Use a hardcoded testimonial with attribution (name, company).

**Acceptance:** Left column is visually balanced with the form on the right.

---

## 🔴 Tier 3 — Premium

### Task 14: Hero parallax depth

**File:** `components/landing-new/hero-final.tsx`

**What:** Wrap the hero image/drone visual in `<ParallaxLayer depth={0.15}>` to create subtle depth when scrolling.

**Acceptance:** Hero image moves at a different rate than text when scrolling, creating depth illusion.

---

### Task 15: Footer social links + brand consistency

**File:** `components/landing-new/footer.tsx`

**What:**
- Wire social links to actual profiles (or remove)
- Standardize brand name across footer
- Add WhatsApp direct link

**Acceptance:** No dead `#` links; consistent brand naming.

---

## Execution Order

```
Tier 1 (Tasks 1-8) → Tier 2 (Tasks 9-13) → Tier 3 (Tasks 14-15)
```

Tasks within each tier can be done in parallel where they touch different files. Tasks 3-6 (adding FadeUp) can be parallelized.

## Verification

After each tier:
1. `npm run build` — zero errors
2. Browser check at `http://localhost:5173` — visual verification of each change
3. Mobile check at 375px viewport width
