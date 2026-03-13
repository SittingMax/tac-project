# TAC Branding Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the `TacLogo` component from a generic `lucide-react` Box icon to a stunning, avant-garde geometric minimalist mark with ultra-premium typography.

**Architecture:** We will modify the `TacLogo` component (`c:\logi\tac-portal\components\shared\tac-logo.tsx`) in place. The modification will rip out the generic icon and generic text classes, replacing them with a custom inline SVG emblem and strictly controlled layout classes utilizing font-mono tracking and leading rules.

**Tech Stack:** React, Tailwind CSS v4, inline SVG.

---

### Task 1: Redesign `TacLogo` Component

**Files:**
- Modify: `components/shared/tac-logo.tsx:28-60`

**Step 1: Write minimal implementation**

Rewrite `content` definition in `TacLogo` ensuring semantic SVG geometry and ultra-high tracking on the subtitle.
No tests needed for simple UI component changes, visual validation occurs in browser.

**Step 2: Run typecheck to verify component integrity**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Run linter**

Run: `npm run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add components/shared/tac-logo.tsx
git commit -m "feat(ui): redesign TAC logo with avant-garde geometric aesthetic"
```
