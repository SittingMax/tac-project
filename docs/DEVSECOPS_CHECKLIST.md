# TAC Portal — DevSecOps Enforcement Checklist

Operational checklist for configuring and maintaining enterprise-grade CI/CD governance.

---

## 1. GitHub Branch Protection Rules

Configure on **`main`** and **`develop`** branches:

- [x] Require pull request reviews before merging
- [x] Require status checks to pass before merging
- [x] Require conversation resolution before merging
- [x] Require linear history (squash or rebase only)
- [ ] Require signed commits *(optional — enable when team is ready)*
- [x] Do not allow bypassing the above settings

### Required Status Checks

All of these must pass before any PR can merge:

| Check | Workflow | Job |
|-------|----------|-----|
| Security & Type Safety | `code-quality.yml` | `security-checks` |
| Code Quality (lint, format, `any` count) | `code-quality.yml` | `code-quality` |
| Unit Tests | `code-quality.yml` | `unit-tests` |
| Build & Bundle Check | `code-quality.yml` | `build-check` |
| CodeQL Analysis | `codeql.yml` | `analyze` |
| CSS Lint | `css-lint.yml` | `css-lint` |

**Conditionally required** (runs only when environment is configured):
| Check | Condition |
|-------|-----------|
| E2E Tests | Supabase env vars present + not Dependabot |

---

## 2. CI Auto-Reject Rules

A PR is automatically blocked if any of these occur:

| Trigger | Gate |
|---------|------|
| `npm run typecheck` fails | Build Integrity |
| `npm run lint` fails | Build Integrity |
| Unit test failure | Build Integrity |
| Build failure | Build Integrity |
| `any` count > 200 | Type Safety |
| `console.log` file count > 300 | Code Quality |
| Bundle size > 100 MB | Performance |
| Direct `JsBarcode` import | Barcode Compliance |
| `dangerouslySetInnerHTML` without DOMPurify | Security |
| `service_role` in client code | Security |
| Critical npm audit vulnerability | Security |

---

## 3. Quarterly Audit Schedule

| Quarter | Audit Window | Lead |
|---------|-------------|------|
| Q1 (Jan–Mar) | Last week of March | — |
| Q2 (Apr–Jun) | Last week of June | — |
| Q3 (Jul–Sep) | Last week of September | — |
| Q4 (Oct–Dec) | Last week of December | — |

### Audit Deliverable Sections

Each quarterly audit must produce:

1. Executive Summary
2. Critical Findings (🔴)
3. High-Risk Findings (🟠)
4. Medium Findings (🟡)
5. Performance Observations
6. Security Observations
7. Barcode / Scanner Stability
8. Recommended Refactors
9. 30-Day Remediation Plan
10. Enterprise Readiness Score

---

## 4. Weekly Module Audit Rotation

| Week | Domain |
|------|--------|
| 1 | Shipments |
| 2 | Manifests |
| 3 | Finance |
| 4 | Scanning |
| 5 | Auth |
| 6 | Dashboard |

### Per-Module Checklist

- [ ] Single responsibility respected
- [ ] Components < 400 lines
- [ ] Business logic in services, not components
- [ ] No domain mixing
- [ ] Zustand store not bloated
- [ ] No derived state duplication
- [ ] Supabase queries typed
- [ ] Error handling explicit (no silent catch)
- [ ] Table rendering memoized
- [ ] Heavy components lazy-loaded
- [ ] React Query properly caching
- [ ] Unit tests for store
- [ ] E2E path for critical flow
- [ ] Edge cases covered

---

## 5. Enterprise Readiness Scoring

Rate 1–10 across each category. Target scores for production readiness:

| Category | Target | Current |
|----------|--------|---------|
| Type Safety | 9+ | __ |
| Dependency Hygiene | 9+ | __ |
| Security Posture | 8.5+ | __ |
| Barcode Reliability | 9+ | __ |
| Scanner Robustness | 9+ | __ |
| Architectural Consistency | 9+ | __ |
| Test Coverage | 85%+ | __% |

---

## 6. Monthly Metrics to Track

| Metric | Tool / Source |
|--------|-------------|
| Type coverage % | `tsc --noEmit` pass rate |
| `any` count | CI `code-quality` job output |
| Average PR size (lines) | GitHub Insights |
| Test coverage % | Vitest `--coverage` report |
| Mean time to merge | GitHub Insights |
| Security vulnerability count | `npm audit` + CodeQL |
| Bundle size trend | CI `build-check` job output |

---

## 7. Dependency Security Policy Reference

Full policy: [`docs/DEPENDENCY_SECURITY_POLICY.md`](./DEPENDENCY_SECURITY_POLICY.md)

Key rules:
- `@supabase/supabase-js` — **manual review required** for all updates
- Patch updates for non-critical deps → auto-merge eligible
- Minor dev-dep updates → auto-merge eligible
- Major updates → **always manual review**
- `npm audit --audit-level=high` must pass in CI
