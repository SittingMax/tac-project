# TAC Portal Code Review (2026-02-15)

## Scope
High-level full-project review focused on build/tooling health, type safety, architecture consistency, and obvious runtime risks.

## Critical Issues

### 1) ESLint is currently non-runnable in this environment due to dependency mismatch
- `eslint.config.js` imports `@eslint/js`, but `package.json` does not declare `@eslint/js` in `devDependencies`.
- This makes linting fail immediately before code rules are evaluated.
- Impact: CI/static analysis blind spot; regressions can ship unnoticed.

### 2) Lockfile / install reproducibility is broken (`npm ci` fails)
- `npm ci` fails with package-lock sync errors (e.g. invalid/missing `ajv`, `keyv`, and `rollup` lock entries).
- Impact: deterministic installs are broken, increasing CI failure risk and onboarding friction.

## High-Priority Code Quality / Correctness Risks

### 3) Dual type systems with overlapping domain models
- `types.ts` defines key business enums/unions (`ShipmentStatus`, `ManifestStatus`, `UserRole`) as string unions.
- `types/domain.ts` defines the same concepts as enums and includes additional states/values (e.g., `ManifestStatus.DRAFT|BUILDING|RECONCILED`).
- Impact: drift and incompatible assumptions across modules.

### 4) Broad `any` suppression around core data access paths
- Multiple stores/services suppress `@typescript-eslint/no-explicit-any` globally or cast Supabase operations to `any`.
- Examples include `store/scanQueueStore.ts`, `store/managementStore.ts`, and most files in `lib/services/`.
- Impact: lost compile-time guarantees on critical create/update/query paths.

### 5) Manifest edit mode has an acknowledged incomplete path
- `ManifestBuilderWizard` explicitly notes a TODO: edit flow does not load existing manifest data into `setupData`.
- Impact: editing can start from partial/default state and create inconsistent UX/behavior.

### 6) Invoice mapping indicates unresolved enum mismatch risk
- `lib/data-access/supabase-repository.ts` contains an inline comment on `paymentMode` cast: `// Mismatched enum names?`.
- Impact: potential mis-mapping between DB values and app enum, causing incorrect finance behavior.

### 7) Competing auth state stores increase state divergence risk
- `store/index.ts` has a legacy persisted `isAuthenticated` + `user` store.
- `store/authStore.ts` contains the Supabase session-backed auth model.
- Impact: two sources of truth for auth/session state can diverge and cause inconsistent gatekeeping.

## Medium Priority

### 8) Debug logging still present across production paths
- Multiple runtime files still use `console.*` in app logic (stores/components/services).
- Impact: noisy logs, potential leakage of operational context, harder incident triage.

## Recommended Remediation Order
1. Restore reproducible dependency graph (`npm ci`) and lint execution first.
2. Consolidate to one domain type source (prefer `types/domain.ts` + compatibility exports).
3. Remove `any` from Supabase paths using generated DB types and typed repository boundaries.
4. Complete manifest edit prefill logic before further manifest feature expansion.
5. Collapse auth state into one store and deprecate legacy persisted auth state.
6. Replace ad-hoc `console` usage with centralized logger + environment-aware sinks.

## Commands run for this review
- `npm run -s lint`
- `npm run -s typecheck`
- `npm ci`
- `npm install`
- `rg --files`
- `rg -n "@typescript-eslint/no-explicit-any|\bany\b" hooks lib pages store components --glob '*.{ts,tsx}'`
- `sed -n '1,220p' eslint.config.js`
- `cat package.json`
- `cat tsconfig.json`
- `sed -n '1,180p' types.ts`
- `sed -n '1,180p' types/domain.ts`
- `sed -n '120,200p' components/manifests/ManifestBuilder/ManifestBuilderWizard.tsx`
- `sed -n '130,190p' lib/data-access/supabase-repository.ts`
- `sed -n '1,180p' store/index.ts`
- `sed -n '1,220p' store/authStore.ts`


## Continued Review Findings (Phase 2)

### 9) Broken npm scripts reference files that do not exist
- `package.json` defines:
  - `audit:hub-codes: node scripts/audit-hub-codes.js`
  - `guard:no-mock-data: node scripts/no-mock-data-guard.mjs`
  - `theme-audit: powershell -ExecutionPolicy Bypass -File scripts/theme-audit.ps1`
- But `scripts/` currently does not contain `audit-hub-codes.js`, `no-mock-data-guard.mjs`, or `theme-audit.ps1`.
- Impact: expected quality/safety guard commands are dead and will fail in local dev and CI.

### 10) Browser runtime code uses `process.env.NODE_ENV`
- `lib/notifications/service.ts` checks `process.env.NODE_ENV` inside client code.
- In Vite client code, `import.meta.env` is the canonical env API; direct `process.env` usage is brittle and can cause runtime reference issues depending on bundler polyfills.
- Impact: development logging path can fail unexpectedly in browser runtime.

### 11) Environment variable naming drift for OpenRouter key
- Runtime env validation expects `VITE_OPENROUTER_API_KEY`.
- Documentation instructs developers to set `OPENROUTER_API_KEY` (without `VITE_` prefix).
- Impact: AI-related integrations can appear misconfigured even when developers follow docs.

### 12) Dependency update PR template has broken policy link
- `.github/PULL_REQUEST_TEMPLATE/dependency_update.md` links to `../docs/DEPENDENCY_SECURITY_POLICY.md`.
- Relative path is incorrect from `.github/PULL_REQUEST_TEMPLATE/`; expected path should traverse two levels to repo root (`../../docs/...`).
- Impact: reviewers cannot follow policy link directly from the template.

### 13) README appears substantially stale vs current codebase
- README states versions and structure that do not match current repo reality (e.g., React RC version, Tailwind “v4 (CDN)”, mock-login/default credentials, and multiple legacy file paths).
- Impact: onboarding friction and misleading operational assumptions for contributors.

## Updated Remediation Order (top-first)
1. Fix package/dependency reproducibility and restore lint/typecheck/build execution.
2. Repair dead npm script references and cross-platform audit scripts.
3. Consolidate domain type definitions and remove broad `any` suppressions in data layer.
4. Resolve browser env usage inconsistencies (`process.env` vs `import.meta.env`) and env var naming drift in docs.
5. Complete manifest edit prefill behavior and deprecate duplicate auth state sources.
6. Refresh README + PR template links to align docs with current architecture.

## Additional Commands run in Phase 2
- `npm run -s build`
- `npm run -s audit:hub-codes`
- `npm run -s guard:no-mock-data`
- `npm run -s theme-audit`
- `rg --files scripts`
- `rg -n "OPENROUTER|openrouter|VITE_OPENROUTER_API_KEY" --glob '*.{ts,tsx,md}'`
- `sed -n '1,220p' lib/notifications/service.ts`
- `nl -ba .github/PULL_REQUEST_TEMPLATE/dependency_update.md | sed -n '1,120p'`
- `nl -ba README.md | sed -n '1,220p'`
