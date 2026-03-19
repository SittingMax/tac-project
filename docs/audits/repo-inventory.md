# Repo Inventory — Batch 1 Baseline

## Scope

This inventory captures the cleanup-relevant findings used to start Batch 1 of the project cleanup and UI unification program.

## Confirmed duplicate or overlapping implementations

- `components/bookings/BookingForm.tsx`
- `components/portal/BookingForm.tsx`
- `components/shipping/ShippingLabel.tsx`
- `components/domain/ShippingLabel.tsx`
- `hooks/useDebounce.ts`
- `lib/hooks/useDebounce.ts`
- `components/crud/CrudTable.tsx`
- `components/ui-core/table/data-table.tsx`

## Confirmed shared-foundation issues addressed in Batch 1

- `hooks/useShipments.ts`
  - local shipment query keys
  - debug console leakage
  - relative imports instead of `@/`
- `store/authStore.ts`
  - duplicated sensitive-storage cleanup logic
  - persisted auth state included unnecessary user data
  - local module-access logic duplicated shared policy responsibilities
- `hooks/useRBAC.ts`
  - depended on a legacy store path instead of the auth store
  - duplicated policy access through non-authoritative helpers
- `lib/feedback.ts`
  - assumed browser audio/haptic capabilities without explicit runtime guards

## Existing shared policy surface

- `lib/access-control.ts` already existed with role grouping helpers.
- Batch 1 expands that file into the shared UI-facing access layer for:
  - role-group access
  - module access
  - boolean permission checks
  - role hierarchy comparisons
  - default role routing

## Repository hygiene findings

The repository root currently contains many generated or investigative artifacts, including logs, reports, diff dumps, tree dumps, and temporary analysis outputs.

Examples observed during the audit:

- `build_err_utf8.txt`
- `ci_failures.txt`
- `compile_errors.txt`
- `errors.txt`
- `eslint-output.txt`
- `lint-output.txt`
- `lint.log`
- `playwright-results.json`
- `playwright_results.txt`
- `tree_components.txt`
- `tree_hooks.txt`
- `tree_lib.txt`
- `tree_pages.txt`
- `ts_errors.log`
- `tsc_output.txt`
- `rls_report.json`
- `stats.html`

## Cleanup note for this batch

The worktree is already dirty with unrelated in-progress edits. Because of that, Batch 1 focuses on:

- documenting cleanup targets
- tightening ignore rules
- centralizing shared foundations
- adding targeted tests

Bulk deletion of root artifacts should happen in a dedicated clean-tree hygiene pass.

## Storybook and test posture

- `.storybook/` exists and is functional but current reusable-component coverage is still light.
- `tests/e2e/` includes both critical workflows and heavier stress/visual suites.
- `tests/README.md` is stale and should be updated in a later cleanup phase.

## Next cleanup targets after Batch 1

- Collapse duplicate booking and shipping label implementations.
- Standardize on `CrudTable` as the canonical table foundation.
- Rationalize test portfolio and dependency overlap.
- Tighten CI enforcement after the codebase is brought into compliance.
