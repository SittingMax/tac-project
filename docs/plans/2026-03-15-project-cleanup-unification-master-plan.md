# TAC Cargo Portal — Project Cleanup & UI Unification Master Plan

> **Status**: Approved for phased execution  
> **Date**: 2026-03-15  
> **Owner**: Cascade audit + planning pass  
> **Scope**: Full-project cleanup covering repository hygiene, code health, architectural deduplication, dependency consolidation, test rationalization, CI enforcement, and unified UI rollout

---

## 1. Executive Summary

The TAC Cargo Enterprise Portal has a strong stack and substantial recent hardening work, but the repository still carries accumulated duplication, mixed abstractions, root-level artifact clutter, permissive CI thresholds, uneven Storybook coverage, and multiple overlapping implementations for the same workflows.

This plan defines a **safe, phased cleanup program** that preserves production behavior while standardizing the codebase around a single UI system and a small set of authoritative foundations.

### Primary goals

1. Remove repository and code-level clutter without breaking core workflows.
2. Standardize the project on one UI system and one set of canonical primitives.
3. Consolidate duplicated files, packages, hooks, and architectural patterns.
4. Tighten code health, type safety, persistence boundaries, and CI rules.
5. Reduce maintenance cost and make future work faster and safer.

### Guiding decisions

- **Unified UI is the priority.**
- **`@/components/crud/CrudTable` is the canonical table foundation.**
- **Booking uses one shared domain form core with thin context wrappers only where necessary.**
- **`@/lib/queryKeys` is the only source of React Query keys.**
- **RBAC policy lives in one shared access-control module.**
- **Barcode rendering must flow through the existing UniversalBarcode pattern only.**

### Non-goals

- No large backend redesign.
- No routing rewrite unless required by cleanup safety.
- No broad feature expansion during cleanup phases.
- No package removals before import/use verification.

---

## 2. Audit Snapshot

### 2.1 Confirmed redundancy hotspots

- `components/bookings/BookingForm.tsx`
- `components/portal/BookingForm.tsx`
- `components/shipping/ShippingLabel.tsx`
- `components/domain/ShippingLabel.tsx`
- `hooks/useDebounce.ts`
- `lib/hooks/useDebounce.ts`
- `components/crud/CrudTable.tsx`
- `components/ui-core/table/data-table.tsx`

### 2.2 Confirmed code health issues

- `hooks/useShipments.ts`
  - local `shipmentKeys`
  - `console.debug`
  - `eslint-disable-next-line no-console`
  - relative imports instead of `@/`
- `store/authStore.ts`
  - embedded module access matrix
  - persistence concerns for sensitive user fields
- `hooks/useRBAC.ts`
  - overlaps with access logic that should be centralized
- `lib/feedback.ts`
  - should use explicit browser/feature detection and safer timer discipline

### 2.3 Confirmed repo/process issues

- Storybook exists in `.storybook/` but current coverage is light.
- `tests/README.md` is stale relative to current app/test setup.
- `.github/workflows/code-quality.yml` allows overly permissive thresholds for `console.log` and `any`.
- Repo root contains many generated logs, diffs, reports, and ad-hoc outputs that should not remain part of normal project hygiene.

---

## 3. Canonical Architecture Targets

### 3.1 UI and page architecture

Adopt a unified `ui-core` layer for page structure and system presentation:

- `@/components/ui-core/PageContainer`
- `@/components/ui-core/PageHeader`
- `@/components/ui-core/SectionCard`
- `@/components/ui-core/StatCard`
- `@/components/ui-core/FormGrid`
- `@/components/ui-core/SizedDialog`
- `@/components/ui-core/EmptyState`
- `@/components/ui-core/FilterToolbar`

### 3.2 Table architecture

Canonical table:

- `@/components/crud/CrudTable`

Migration target:

- `@/components/ui-core/table/data-table.tsx` becomes either:
  - a thin compatibility wrapper around `CrudTable`, or
  - fully retired after page migration.

### 3.3 Domain foundations

Canonical foundations:

- Query keys: `@/lib/queryKeys`
- Access control: `@/lib/access-control`
- Shared hooks: single canonical implementation only
- Barcode rendering: UniversalBarcode wrapper only
- Booking form model: shared form core + thin public/staff wrappers

---

## 4. Phased Execution Plan

## Phase 0 — Inventory Baseline

**Outcome**: Establish a deletion-safe inventory and a measurable starting point.

### File targets

- `docs/audits/repo-inventory.md`
- `components/`
- `hooks/`
- `lib/`
- `pages/`
- `store/`
- `tests/`
- `supabase/`
- `.storybook/`
- `.github/workflows/`

### Tasks

- Produce a duplicate-file inventory and responsibility map.
- Produce a package overlap inventory grouped by capability.
- Record current failing or warning checks.
- Flag root-level generated artifacts for deletion, archival, or `.gitignore` coverage.

### Verification

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test:unit`
- `npm run build`

### Risk / rollback

- No destructive source changes in this phase.
- If inventory notes are incomplete, pause deletions until coverage is accurate.

---

## Phase 1 — Repository Hygiene

**Outcome**: Clean root clutter and prevent artifact re-accumulation.

### File targets

- `.gitignore`
- `README.md`
- `docs/`
- `scripts/`
- root-level artifact files currently sitting beside source

### Tasks

- Delete or archive one-off logs, diffs, temporary text outputs, and old reports.
- Move any durable reference material into `docs/`.
- Review root scripts and archive/remove one-off migration/recovery utilities that are no longer needed.
- Extend `.gitignore` to cover every recurring generated artifact category observed in the audit.

### Acceptance criteria

- Root contains source/config/docs, not transient investigation outputs.
- No newly generated local artifacts appear as untracked noise after normal dev/test flows.

### Verification

- `git status --short`
- `npm run lint`
- `npm run format:check`

### Risk / rollback

- If a script or report is still operationally required, move it to `docs/archive/` or `scripts/archive/` instead of deleting.

---

## Phase 2 — Critical Code Health & Security

**Outcome**: Remove confirmed code smells and centralize security-sensitive logic.

### File targets

- `hooks/useShipments.ts`
- `lib/queryKeys.ts`
- `store/authStore.ts`
- `hooks/useRBAC.ts`
- `lib/feedback.ts`
- `lib/access-control.ts` (new)
- `tests/unit/store/authStore.test.ts`
- `tests/unit/lib/access-control.test.ts`

### Tasks

- Remove debug console leaks and `eslint-disable` suppressions from `useShipments`.
- Replace local shipment query keys with `@/lib/queryKeys`.
- Convert noncompliant relative imports in touched files to `@/` imports.
- Extract RBAC/module access policy to `@/lib/access-control`.
- Refactor store and hooks to consume the shared RBAC layer.
- Stop persisting unnecessary user PII in auth persistence.
- Extract reusable storage cleanup helper from `authStore`.
- Harden `feedback.ts` with explicit browser capability detection.

### Acceptance criteria

- No app-facing `console.debug` remains in the shipment flow.
- Query key ownership is centralized.
- Access policy is defined once and reused.
- Persisted auth state contains only justified fields.

### Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit -- tests/unit/store/authStore.test.ts`
- `npm run test:unit -- tests/unit/lib/access-control.test.ts`

### Risk / rollback

- Ship in small commits so query invalidation regressions are easy to isolate.
- If auth persistence changes break session restoration, roll back only the persistence slice while keeping access-control extraction.

---

## Phase 3 — Core Deduplication

**Outcome**: Eliminate competing implementations for the same core concerns.

### File targets

- `components/bookings/BookingForm.tsx`
- `components/portal/BookingForm.tsx`
- `components/shipping/ShippingLabel.tsx`
- `components/domain/ShippingLabel.tsx`
- `hooks/useDebounce.ts`
- `lib/hooks/useDebounce.ts`
- related consumers discovered during migration

### Tasks

- Extract a shared booking form core and keep only minimal context wrappers where submission/auth behavior differs.
- Compare the two `ShippingLabel` implementations and collapse them into a shared core or one canonical implementation.
- Choose a single `useDebounce` location, update imports, delete the duplicate.
- Rename wrappers explicitly where needed to avoid ambiguous filenames.

### Acceptance criteria

- No duplicate domain component files remain for booking, shipping label, or debounce behavior.
- Shared logic exists in one place with clear wrapper boundaries.

### Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit -- tests/unit/hooks/useDebounce.test.ts`
- affected workflow smoke tests in app or Playwright where relevant

### Risk / rollback

- Do not remove wrappers until every consumer is migrated.
- If public/staff flows diverge too much, preserve wrappers but centralize only the shared field/validation/render core.

---

## Phase 4 — Table System Unification

**Outcome**: Standardize the app on one table foundation.

### File targets

- `components/crud/CrudTable.tsx`
- `components/crud/index.ts`
- `components/ui-core/table/data-table.tsx`
- pages currently using `DataTable`, including:
  - `pages/Shipments.tsx`
  - `pages/Exceptions.tsx`
  - `pages/Customers.tsx`
  - `pages/Finance.tsx`
  - `pages/Management.tsx`
  - `pages/Inventory.tsx`
  - `pages/Manifests.tsx`
  - `pages/Bookings.tsx`
  - `pages/admin/Messages.tsx`
- supporting table consumers under `components/settings/tables/`

### Tasks

- Audit every `DataTable` usage and map missing capabilities required from `CrudTable`.
- Extend `CrudTable` only where necessary to reach feature parity.
- Migrate page consumers incrementally.
- Retire `DataTable` or reduce it to a compatibility wrapper during transition.
- Remove `EnhancedDataTable` if it exists outside current audited files.

### Acceptance criteria

- One table primitive serves all page-level data grids.
- Styling, filtering, selection, pagination, toolbar patterns, and loading states are consistent.

### Verification

- `npm run typecheck`
- `npm run lint`
- affected page smoke checks
- targeted Playwright flows for shipments, manifests, finance, customers, and management

### Risk / rollback

- Migrate one page family at a time.
- If a page exposes a missing feature, add it to `CrudTable` rather than fork another table.

---

## Phase 5 — UI-Core and Page Shell Unification

**Outcome**: Create a visually and structurally consistent application shell.

### File targets

- `components/ui-core/`
- `pages/Dashboard.tsx`
- `pages/Shipments.tsx`
- `pages/Manifests.tsx`
- `pages/Finance.tsx`
- `pages/Customers.tsx`
- `pages/Inventory.tsx`
- `pages/Exceptions.tsx`
- `pages/Settings.tsx`
- `pages/Management.tsx`
- `pages/admin/*.tsx`
- shared section/card components used across pages

### Tasks

- Promote `ui-core` to the shared presentation layer for page shells.
- Standardize spacing, header structure, card composition, empty/loading/error states, and dialog sizing.
- Replace layout-specific ad-hoc wrappers with reusable `ui-core` primitives.
- Normalize page structure across all authenticated surfaces.
- Ensure semantic color tokens remain the only color source in component/page code.

### Acceptance criteria

- Major authenticated pages share the same structural rhythm and surface conventions.
- New pages can be built from shared primitives rather than custom shells.

### Verification

- `npm run lint`
- `npm run guard:page-shell`
- `npm run format:check`
- `npm run storybook`
- manual review across desktop and mobile breakpoints

### Risk / rollback

- Keep UI changes batch-scoped by page family.
- If a page depends on unique layout rules, wrap those in `ui-core` rather than reintroducing one-off shells.

---

## Phase 6 — Storybook as the UI Playbook

**Outcome**: Turn Storybook into the authoritative sandbox for UI quality.

### File targets

- `.storybook/main.ts`
- `.storybook/preview.tsx`
- `components/**/*.stories.tsx`
- `pages/**/*.stories.tsx`

### Tasks

- Add stories for all shared `ui-core` primitives.
- Add stories for the canonical `CrudTable` in loading, empty, filtered, selected, and bulk-action states.
- Add stories for booking form wrappers and shared form sections.
- Add accessibility and theme states to the core stories.
- Define a minimal story coverage bar for all reusable components.

### Acceptance criteria

- Storybook covers shared UI foundations, not only landing-page marketing surfaces.
- New reusable components are expected to ship with stories.

### Verification

- `npm run storybook`
- `npm run build-storybook`

### Risk / rollback

- Story creation is additive and low risk.
- Keep stories near the component they document.

---

## Phase 7 — Dependency Consolidation

**Outcome**: Reduce bundle and maintenance overhead by removing true overlap.

### File targets

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- files using barcode, PDF, print, editor, animation, and chart packages
- `docs/DEPENDENCY_SECURITY_POLICY.md`

### Capability groups to audit

- Barcode/scanning
  - `jsbarcode`
  - `bwip-js`
  - `@zxing/browser`
  - `@zxing/library`
- PDF/print/export
  - `jspdf`
  - `jspdf-autotable`
  - `pdf-lib`
  - `react-to-print`
  - `qrcode`
  - `qrcode.react`
- Editor/content
  - `@tiptap/*`
  - `react-markdown`
  - `dompurify`
- Animation/presentation
  - `gsap`
  - `motion`
  - `lottie-react`
- Legacy or likely suspect types/packages
  - `@types/react-router-dom`
  - umbrella `radix-ui` package

### Tasks

- Verify actual import usage before uninstalling anything.
- Collapse overlapping libraries only after choosing a canonical capability per concern.
- Prefer route-level lazy loading for heavy but justified packages.
- Remove outdated or unused type packages.

### Acceptance criteria

- No redundant package families remain without a clear justification.
- Bundle size and dependency complexity trend downward.

### Verification

- `npm ls --depth=0`
- `npm run build`
- bundle visualizer review if configured

### Risk / rollback

- Package removals should be isolated one family at a time.
- If a library is only used in a rare workflow, confirm that workflow manually before final removal.

---

## Phase 8 — Test Portfolio Rationalization

**Outcome**: Keep strong coverage while reducing duplication and maintenance drag.

### File targets

- `tests/README.md`
- `tests/unit/**`
- `tests/e2e/**`
- `playwright.config.ts`
- test utilities and fixtures

### Tasks

- Split E2E suites into:
  - critical default CI flows
  - opt-in stress suites
  - visual regression suites
- Refactor repeated setup into shared fixtures/helpers.
- Update stale test docs to match real base URLs and execution patterns.
- Add unit coverage for extracted access-control and persistence helpers.
- Prune redundant or overlapping E2E scenarios after mapping coverage overlap.

### Acceptance criteria

- Default CI runs the essential workflows only.
- Stress and visual suites remain available without slowing every change.
- Test docs reflect the current app and CI configuration.

### Verification

- `npm run test:unit`
- `npm run test`
- optional targeted stress or visual runs as separate checks

### Risk / rollback

- Do not delete broad tests until an equivalent or tighter targeted suite exists.
- Keep snapshots only where they detect meaningful regressions.

---

## Phase 9 — CI and Guardrail Tightening

**Outcome**: Prevent reintroduction of the same problems.

### File targets

- `.github/workflows/code-quality.yml`
- `eslint.config.js`
- scripts under `scripts/`
- optional new guard scripts under `scripts/`

### Tasks

- Replace permissive `console.log` and `any` thresholds with strict anti-regression rules.
- Add checks for:
  - non-`@/` imports where disallowed
  - local query key factories outside `@/lib/queryKeys`
  - duplicate direct barcode imports
  - raw forbidden color utilities in app code
  - unjustified `eslint-disable` usage
- Align local lint-staged behavior with CI expectations.

### Acceptance criteria

- New drift is caught automatically in CI.
- Local pre-commit flow and CI expectations are consistent.

### Verification

- `npm run lint`
- `npm run format:check`
- CI dry-run on a representative branch

### Risk / rollback

- Introduce new checks only after the codebase is brought into compliance for that rule.

---

## Phase 10 — Documentation and Handoff

**Outcome**: Make the cleaned architecture maintainable by the whole team.

### File targets

- `docs/INDEX.md`
- `docs/README.md`
- `docs/PROJECT_DOCUMENTATION.md`
- `docs/REVIEWER_GUIDE.md`
- `AGENTS.md` if conventions need updating after cleanup

### Tasks

- Document canonical primitives and module boundaries.
- Document the final table, booking, barcode, access-control, and query-key standards.
- Update reviewer guidance for verifying cleanup batches.
- Link this plan from docs indexes if it becomes the active execution document.

### Acceptance criteria

- Contributors can follow the canonical architecture without guesswork.
- Reviewers know what to reject when duplicate patterns reappear.

### Verification

- Internal documentation review
- cross-link validation in docs index files

### Risk / rollback

- Documentation updates are low risk and should trail each completed phase.

---

## 5. Batch Execution Order

### Batch 1

- Phase 0
- Phase 1
- Phase 2

### Batch 2

- Phase 3
- Phase 4

### Batch 3

- Phase 5
- Phase 6

### Batch 4

- Phase 7
- Phase 8

### Batch 5

- Phase 9
- Phase 10

This order minimizes risk by cleaning and stabilizing foundations before large UI migration or package removals.

---

## 6. Global Verification Checklist

Run after each batch:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
```

Run when UI flows are affected:

```bash
npm run test
```

Run when dependency or bundling work is affected:

```bash
npm run build
```

Run when reusable UI primitives are added or refactored:

```bash
npm run storybook
npm run build-storybook
```

---

## 7. Rollout Rules

- Ship only one cleanup family at a time.
- Do not combine package removals with broad UI migrations in the same change set.
- Keep wrapper compatibility during migrations, then delete the old abstraction only after all consumers are moved.
- Prefer extraction and replacement over sweeping rewrites.
- Treat repository hygiene as part of code quality, not optional maintenance.

---

## 8. Exit Criteria

The cleanup program is complete when all of the following are true:

- Root-level clutter has been removed or archived.
- Duplicate core files have been collapsed to canonical implementations.
- `CrudTable` is the shared table foundation.
- Booking and shipping label flows no longer maintain parallel implementations without shared cores.
- Query keys, RBAC, and persistence boundaries are centralized.
- Storybook documents the reusable UI system.
- CI enforces the standards that the cleanup introduced.
- Tests and docs reflect the new architecture.

---

## 9. Immediate Next Execution Target

Start with **Batch 1**:

1. Create `docs/audits/repo-inventory.md`.
2. Clean root artifact clutter and tighten `.gitignore`.
3. Refactor `hooks/useShipments.ts` to use `@/lib/queryKeys` and remove console leaks.
4. Extract `@/lib/access-control.ts` and migrate `authStore` / `useRBAC` to it.
5. Add targeted unit coverage for the extracted access-control and auth persistence logic.

This batch establishes the safe foundation for every later cleanup phase.
