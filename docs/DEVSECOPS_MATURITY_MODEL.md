# TAC Portal — DevSecOps Maturity Model

This framework defines the journey from ad-hoc development to enterprise-grade engineering excellence for the TAC Portal. Teams should use this rubric to assess current capabilities and prioritize engineering efforts.

---

## Maturity Levels

| Level | Description | Characteristic |
| --- | --- | --- |
| **Level 1** | **Ad-Hoc / Reactive** | Manual processes, localized knowledge, frequent regressions |
| **Level 2** | **Defined** | Formalized rules, some automation, emerging consistency |
| **Level 3** | **Enforced (Current Target)** | Automated guardrails, CI enforcement, regular auditing |
| **Level 4** | **Optimized / Enterprise** | Predictive analysis, self-healing, advanced telemetry |

---

## 1. Type Safety & Code Quality

| Level | Criteria |
| --- | --- |
| **Level 1** | `any` widely used. No ESLint. `tsc` not run in CI. |
| **Level 2** | ESLint configured. `tsc --noEmit` runs but allows TS errors. |
| **Level 3** | **(Target)** Strict mode enabled. `< 50` `any` types. ESLint acts as CI gate. Zero `any` allowed in `lib/` and `store/`. |
| **Level 4** | Complete generic coverage. DOM/event types strictly bounded. Automated runtime type validation (Zod) perfectly synced with DB schema. |

## 2. Dependency Hygiene

| Level | Criteria |
| --- | --- |
| **Level 1** | Dependencies updated manually when things break (or never). |
| **Level 2** | Dependabot opens PRs, but they languish or merge without testing. |
| **Level 3** | **(Target)** Weekly automated updates for non-critical deps (auto-merge with passing tests). Strict manual review for Supabase/security packages. `npm audit --audit-level=high` blocks CI. |
| **Level 4** | Automated dependency upgrade smoke tests. Private npm registry with vulnerability scanning. Zero-Trust supply chain. |

## 3. Security Posture

| Level | Criteria |
| --- | --- |
| **Level 1** | Secrets stored loosely. No CSP. Untyped DB queries. |
| **Level 2** | `.env` files used. Basic auth implemented. Supabase RLS exists but relies on defaults. |
| **Level 3** | **(Target)** CI blocks `dangerouslySetInnerHTML` without DOMPurify. CI blocks service role leaks and client-side `process.env`. RLS explicitly tested. CodeQL running weekly. |
| **Level 4** | Continuous dynamic application security testing (DAST). Automated CSP generation. JIT (Just-In-Time) DB access. Role-based anomaly detection. |

## 4. Barcode & Scanner Reliability

| Level | Criteria |
| --- | --- |
| **Level 1** | Scattershot `JsBarcode` usage. Hacky global event listeners for scanning. |
| **Level 2** | Components standardizing, but listeners still stack. Duplicate scans require manual app refresh. |
| **Level 3** | **(Target)** Strict `UniversalBarcode` adoption. Centralized `ScanContext` router. CI blocks direct `JsBarcode` imports. Playwright stress tests automated. |
| **Level 4** | Hardware-agnostic scanner abstract layer. Automated WASM/WebGL barcode recognition fallbacks. 100% test coverage on scan workflows. |

## 5. Testing & Verification

| Level | Criteria |
| --- | --- |
| **Level 1** | Developer clicks around before PR. No automated tests. |
| **Level 2** | Basic unit tests exist but CI optional. Coverage < 40%. |
| **Level 3** | **(Target)** E2E (Playwright) guards critical paths. Unit tests cover business logic (finance/manifest). Coverage > 85%. CI gates enforce passing tests. |
| **Level 4** | Chaos engineering. Synthetic user testing in production. Automated visual regression testing (Percy/Chromatic). |

---

## How to Advance

**To reach Level 3 across the board:**
1. Abide strictly by the `REVIEWER_GUIDE.md` (5-gate PR framework).
2. Adhere to the `DEVSECOPS_CHECKLIST.md` quarterly audit schedule.
3. Treat warnings from `npm run audit:types` as technical debt to be paid down immediately.
