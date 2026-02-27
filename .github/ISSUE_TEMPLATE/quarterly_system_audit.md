---
name: "🔍 Quarterly System Audit"
about: "Full system audit — run every quarter"
title: "[AUDIT] Q<N> YYYY — Full System Audit"
labels: ["audit", "quality", "security"]
assignees: []
---

## Audit Period: Q<!-- 1/2/3/4 --> <!-- YYYY -->

**Lead Auditor:** @
**Date Range:** YYYY-MM-DD → YYYY-MM-DD

---

## Section 1 — Executive Summary

<!-- 3-5 sentence overview of system health, critical risks, and key metrics -->

---

## Section 2 — Critical Findings (🔴)

| # | Finding | Impact | Affected Module |
|---|---------|--------|-----------------|
| | | | |

---

## Section 3 — High-Risk Findings (🟠)

| # | Finding | Impact | Affected Module |
|---|---------|--------|-----------------|
| | | | |

---

## Section 4 — Medium Findings (🟡)

| # | Finding | Impact | Affected Module |
|---|---------|--------|-----------------|
| | | | |

---

## Section 5 — Performance Observations

- [ ] First contentful paint measured: ___ms
- [ ] Bundle size: ___MB
- [ ] Largest JS chunk: ___KB
- [ ] PDF generation time (avg): ___ms
- [ ] Large shipment table (100+ rows): ___ms render

---

## Section 6 — Security Observations

### A. Tooling Health

- [ ] Lockfile reproducible (`npm ci` clean)
- [ ] ESLint strict (no disabled rules in production code)
- [ ] TypeScript strict mode enforced
- [ ] All npm scripts valid and runnable

### B. Dependency Review

- [ ] `@supabase/supabase-js` — version reviewed, changelog checked
- [ ] `zod` — version reviewed
- [ ] `pdf-lib` — version reviewed
- [ ] Unused packages removed
- [ ] License compliance validated
- [ ] `npm audit --audit-level=high` passes

### C. Security Hardening

- [ ] CSP headers configured
- [ ] No XSS risk (all innerHTML sanitized)
- [ ] Invoice/financial data not logged
- [ ] No public key misuse
- [ ] No service role keys in client bundle

---

## Section 7 — Barcode / Scanner Stability

### Stress Test Results

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| 100 rapid scans | | |
| 500 table barcodes | | |
| Manifest builder open + scan | | |
| Finance preview open + scan | | |

### Measurements

- [ ] No memory growth observed
- [ ] No duplicate dialogs
- [ ] No context collision
- [ ] No listener stacking

---

## Section 8 — Recommended Refactors

| # | Refactor | Priority | Effort Estimate |
|---|----------|----------|-----------------|
| | | | |

---

## Section 9 — 30-Day Remediation Plan

| Week | Action | Owner | Status |
|------|--------|-------|--------|
| Week 1 | | | ⬜ |
| Week 2 | | | ⬜ |
| Week 3 | | | ⬜ |
| Week 4 | | | ⬜ |

---

## Section 10 — Enterprise Readiness Score

| Category | Score (1–10) | Target | Delta |
|----------|-------------|--------|-------|
| Type Safety | | 9+ | |
| Dependency Hygiene | | 9+ | |
| Security Posture | | 8.5+ | |
| Barcode Reliability | | 9+ | |
| Scanner Robustness | | 9+ | |
| Architectural Consistency | | 9+ | |
| Test Coverage | __% | 85%+ | |

**Overall Readiness:** <!-- Ready / Needs Work / Critical Gaps -->

---

## Auditor Sign-off

- [ ] All 10 sections completed
- [ ] Critical findings have owners
- [ ] Remediation plan approved by lead
- [ ] Next quarterly audit scheduled
