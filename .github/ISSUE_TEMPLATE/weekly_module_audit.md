---
name: "📋 Weekly Module Audit"
about: "Structured audit for one domain module — rotate weekly"
title: "[AUDIT] Week <N> — <Module Name>"
labels: ["audit", "quality"]
assignees: []
---

## Module: <!-- Shipments | Manifests | Finance | Scanning | Auth | Dashboard -->

**Audit Week:** <!-- 1–6 -->
**Auditor:** @
**Date:** YYYY-MM-DD

---

## 1. Architecture

- [ ] Single responsibility respected
- [ ] Component size < 400 lines
- [ ] Business logic inside services, not components
- [ ] No domain mixing (e.g., finance logic in shipment component)

## 2. State Management

- [ ] Zustand store not bloated (< 15 actions)
- [ ] No derived state duplication
- [ ] No conflicting sources of truth
- [ ] Auth state comes from single canonical store

## 3. Supabase Safety

- [ ] Queries typed (no `.select('*')` without generic)
- [ ] Error handling explicit — no empty `catch {}`
- [ ] No silent swallowed errors
- [ ] No broad `any` on Supabase returns

## 4. Performance

- [ ] Table rendering memoized
- [ ] Heavy components lazy-loaded
- [ ] React Query properly caching (staleTime, gcTime set)
- [ ] No unnecessary re-renders (verified with React DevTools)

## 5. Test Coverage

- [ ] Unit tests for store logic
- [ ] E2E path for critical flow
- [ ] Edge cases covered (empty state, error state, boundary values)

---

## Findings

### 🔴 Critical
<!-- List critical findings or write "None" -->

### 🟠 High
<!-- List high-risk findings or write "None" -->

### 🟡 Medium
<!-- List medium findings or write "None" -->

### 🟢 Low
<!-- List low findings or write "None" -->

---

## Action Items

| # | Finding | Severity | Owner | Target Date |
|---|---------|----------|-------|-------------|
| 1 | | | | |

---

## Auditor Sign-off

- [ ] All findings documented
- [ ] Action items assigned
- [ ] Follow-up scheduled
