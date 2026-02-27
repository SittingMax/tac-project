# TAC Portal — Reviewer Training Guide

A concise reference for anyone reviewing PRs against this codebase.

---

## The 5-Gate Framework

Every PR must clear all applicable gates before merge.

| Gate | Scope | Blocking? |
|------|-------|-----------|
| **1 — Build Integrity** | `typecheck`, `lint`, `test:unit`, `build` all green | Always |
| **2 — Type Safety** | No new `any`, no `as unknown as`, canonical domain types | Always |
| **3 — Security** | No XSS vectors, no key leaks, no raw `process.env` | Always |
| **4 — Barcode & Scanner** | `UniversalBarcode` only, `ScanContext` respected | If touched |
| **5 — Business Logic** | Correct status transitions, invoice ≠ shipment, payment mapping | If touched |

---

## Gate 1 — Build Integrity

**Verify the author confirmed all commands passed locally:**

```
npm ci → npm run typecheck → npm run lint → npm run test:unit → npm run test → npm run build
```

**Reject if:**
- Lockfile changes are unexplained
- ESLint rules disabled via `// eslint-disable`
- Type errors suppressed with `@ts-ignore` / `@ts-expect-error`
- Tests skipped with `.skip`

---

## Gate 2 — Type Safety

| Pattern | Verdict |
|---------|---------|
| `: any` | 🔴 Block — use proper type |
| `as unknown as X` | 🔴 Block — refactor |
| String literal status (`=== 'delivered'`) | 🟠 Flag — use enum/const from domain types |
| Supabase `.select('*')` without type param | 🟡 Flag — type the return |
| Enum defined locally instead of imported | 🟡 Flag — import from canonical source |

---

## Gate 3 — Security Review

Applies to **any PR touching**: Supabase · PDF · TipTap · AI · Auth

| Check | How |
|-------|-----|
| No raw HTML injection | Search for `dangerouslySetInnerHTML` — must pair with `DOMPurify.sanitize()` |
| No env misuse | `process.env` only in config — client code uses `import.meta.env` |
| No service key leak | `service_role` / `SUPABASE_SERVICE_ROLE` never in client bundle |
| No sensitive logging | No PII, tokens, or financial data in `console.log` |
| Dep update safe | If dependency bumped → check changelog + follow `DEPENDENCY_SECURITY_POLICY.md` |

---

## Gate 4 — Barcode & Scanner Compliance

Applies if PR touches: `components/barcodes/` · `scanning/` · manifest builder · invoice preview

| Rule | Rationale |
|------|-----------|
| **Only `UniversalBarcode`** | Standardized rendering, consistent sizing, single maintenance point |
| **No direct `JsBarcode`** | Bypasses width/height/margin normalization |
| **No new global `keydown` listeners** | Causes listener stacking and duplicate scan dialogs |
| **`ScanContext` respected** | Global scan router must control scan dispatch |
| **Invoice preview → fetch invoice, not shipment** | Data model integrity |

**Manual test request:** Ask author to confirm rapid scan (10+), manifest scan, and dashboard preview scan.

---

## Gate 5 — Business Logic Integrity

Applies to: finance · invoice · manifest · shipment status changes

- **Status transitions** — verify they follow the defined state machine (no impossible jumps)
- **Manifest edit prefill** — data must come from the correct source, not stale cache
- **Payment mode mapping** — must use typed enum, not raw string comparison
- **Unit tests** — require tests for new state transitions, duplicate scans, and manifest item additions

---

## Severity Classification

Use these labels consistently in review comments:

| Level | Icon | Definition | Example |
|-------|------|------------|---------|
| Critical | 🔴 | Financial loss, auth bypass, invoice corruption | Service role key in client bundle |
| High | 🟠 | Data inconsistency, broken scanner workflow | Direct `JsBarcode` usage, scan handler bypass |
| Medium | 🟡 | Architectural drift, maintainability issue | `any` type, component > 400 lines |
| Low | 🟢 | Cosmetic or refactor suggestion | Naming convention, import order |

---

## Quick Decision Matrix

| Scenario | Action |
|----------|--------|
| CI fails | ❌ Block — do not merge |
| New `any` type | ❌ Block — request proper type |
| Security gate violated | ❌ Block — must fix before merge |
| Barcode gate violated | ❌ Block — scanner regression risk |
| Missing unit test for new logic | ❌ Block — request coverage |
| Component > 400 lines | 🟡 Comment — suggest extraction |
| Cosmetic naming issue | 🟢 Approve with suggestion |
