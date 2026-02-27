# PR Title
<!-- [Domain] Short, explicit description -->

---

## 1. Change Type

- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Performance Improvement
- [ ] Security Patch
- [ ] Dependency Update
- [ ] Barcode / Scanner Change
- [ ] Finance / Invoice Logic Change

---

## 2. Summary

<!-- Describe: What changed · Why · Business impact · Risk level -->

---

## 3. Architecture Impact

- [ ] No architectural change
- [ ] Domain model modified
- [ ] Store logic modified
- [ ] Supabase query modified
- [ ] Auth logic modified
- [ ] Barcode system touched
- [ ] Scanner workflow touched
- [ ] Finance logic touched

<!-- If any checked, explain: -->

---

## 4. Production Safety Checklist (MANDATORY)

### Data Integrity
- [ ] No mock/demo/fake data introduced
- [ ] No `Math.random()`, placeholder KPIs, or fabricated fallbacks
- [ ] No destructive production data operations

### Backend Dependencies
- [ ] All backend dependencies (RPCs, views, APIs) fail explicitly
- [ ] User-facing errors are clear and actionable
- [ ] Errors are logged or traceable

### UI & UX Standards
- [ ] Empty states implemented (zero rows, no filters)
- [ ] Loading states implemented (slow network)
- [ ] Error states implemented (backend failure)
- [ ] No hardcoded copy implying trends or growth without data

### Design System Compliance
- [ ] No hex / rgb / hardcoded colors — semantic tokens only (`globals.css`)
- [ ] Charts use `CHART_COLORS` only
- [ ] Dark/light theme verified

---

## 5. Build & Tooling Verification

```bash
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run test
npm run build
```

- [ ] All passed locally
- [ ] No ESLint rules disabled
- [ ] No new `any` introduced
- [ ] Lockfile changes intentional (if any)

---

## 6. Security Checklist

- [ ] No raw HTML injection
- [ ] No `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] No `process.env` direct access in client runtime
- [ ] No sensitive `console.log` / `console.error` data
- [ ] Supabase queries properly typed (no untyped `.select('*')`)
- [ ] No service role keys exposed
- [ ] If dependency updated → [security policy](../docs/DEPENDENCY_SECURITY_POLICY.md) followed

| If dependency updated | Details |
|-----------------------|---------|
| Version bump type     | patch / minor / major |
| Security critical?    | yes / no |

---

## 7. Barcode / Scanner Validation

> **Required if PR touches:** `components/barcodes/`, `scanning/`, manifest builder, invoice preview

- [ ] Uses `UniversalBarcode` — no direct `JsBarcode` usage
- [ ] Screen mode uses correct `width` / `height` / `margin`
- [ ] No new global `keydown` listeners added
- [ ] `ScanContext` respected (no bypass of global scan router)
- [ ] Invoice preview fetches **invoice** (not shipment)

### Manual Tests Performed
- [ ] Rapid scan (10+ consecutive)
- [ ] Manifest scan → add item
- [ ] Dashboard invoice preview → scan
- [ ] No duplicate dialogs observed

---

## 8. Business Logic Integrity

> **Required if PR touches:** finance, invoice, manifest, shipment status

- [ ] Manifest edit prefill logic correct
- [ ] Payment mapping safe (no mode mismatch)
- [ ] Status transitions valid (no impossible state jumps)
- [ ] Unit tests added for state transitions / duplicate scans / manifest item additions

---

## 9. Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Edge cases covered
- [ ] Duplicate scan case tested (if applicable)
- [ ] Invoice preview validated (if applicable)

| Coverage | Value |
|----------|-------|
| Before   | ___% |
| After    | ___% |

---

## 10. Performance Impact

- [ ] No performance impact
- [ ] Table rendering optimized / memoized
- [ ] Large dataset tested (100+ rows)
- [ ] No unnecessary re-renders introduced

---

## 11. Risk Assessment

**Risk Level:**
- [ ] 🟢 Low
- [ ] 🟡 Medium
- [ ] 🟠 High
- [ ] 🔴 Critical

**Rollback Plan:**
<!-- Describe how to revert if this breaks production -->

---

## 12. Screenshots / Evidence

<!-- Attach: UI screenshots · Console logs · Performance measurements -->
