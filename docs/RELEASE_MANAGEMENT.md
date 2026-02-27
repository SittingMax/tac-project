# TAC Portal — Release Management & Versioning Strategy

This document defines the structured process for graduating code from active development to production, ensuring stability, traceability, and enterprise-grade deployment controls.

---

## 1. Branching Model (GitFlow Simplified)

We utilize a simplified GitFlow model designed for fast-paced SaaS teams, protecting stability while allowing rapid iteration.

| Branch | Purpose | Protection | Deployment |
|---|---|---|---|
| `main` | **Production Code** — What is currently live for users. | Strictly protected. Code only enters via PRs from `develop` or hotfixes. | Auto-deploys to Vercel/Netlify Production. |
| `develop` | **Staging/Integration** — The bleeding edge of the next release. | Protected. Code enters via feature/chore PRs. Requires passing CI. | Auto-deploys to Staging URL. |
| `feature/*` | **Active Work** — New features, UI overhauls. | Unprotected. | Preview URL on PR creation. |
| `fix/*` | **Bug Resolution** — Addressing non-critical bugs found in staging/prod. | Unprotected. | Preview URL on PR. |
| `hotfix/*` | **Critical Prod Bugs** — Bypasses `develop` straight to `main`. | Unprotected. | Preview URL on PR. Must be merged down to `develop` post-release. |

---

## 2. Versioning Scheme (SemVer 2.0.0)

We follow **Semantic Versioning (`MAJOR.MINOR.PATCH`)**:

- **`MAJOR` (Incompatible Changes)**: e.g., `v2.0.0`
  - Architectural overhauls, Supabase schema regressions that require data migration, removal of deprecated features.
- **`MINOR` (Backwards-Compatible Features)**: e.g., `v1.4.0`
  - New scanner modes, invoice generation templates, bulk manifest editing.
- **`PATCH` (Backwards-Compatible Bug Fixes)**: e.g., `v1.3.12`
  - Fixing scanner listener stacking, CSS glitch corrections, changing a background color.

*Note: The `package.json` version should be bumped as part of the Release PR.*

---

## 3. The Release Pipeline

### Step A: The Cut
1. Development for the cycle is "frozen" on `develop`.
2. A Release PR is created from `develop` → `main`.
3. The PR is titled: `Release: vX.Y.Z`.
4. The PR description contains the auto-generated **Changelog**.

### Step B: Staging Validation
1. QA/Reviewers validate the Release Preview URL.
2. The core E2E suite (`npm run test:scanner-stress`) is validated against Staging.
3. Final "Smoke Test" involving physical barcode scanners.

### Step C: Production Merge
1. The Release PR is approved.
2. The PR is merged into `main` (Squash or Merge Commit — **Do Not Rebase** to preserve the cut history).
3. The repository is tagged with the version number in GitHub Releases (e.g., `v1.4.0`).
4. Production auto-deployment triggers.

---

## 4. Hotfix Protocol

When a 🔴 Critical bug is discovered in Production (e.g., invoices failing to generate):

1. **Branch**: Create `hotfix/invoice-pdf-crash` branching **directly from `main`**.
2. **Fix**: Implement the exact minimal code required to resolve the issue. Do not include unrelated refactors.
3. **PR to Main**: Open PR from `hotfix/invoice-pdf-crash` → `main`.
4. **Deploy**: Merge PR. The version bumps as a `PATCH` (e.g., `v1.4.1`). 
5. **Backport**: Open a secondary PR to merge `main` back into `develop` so the fix isn't lost in the next sprint.

---

## 5. Feature Flags (Rollout Strategy)

For large, risky features (e.g., a completely new Supabase auth flow):

- Code should merge to `develop` hidden behind a feature flag (e.g., `VITE_ENABLE_NEW_AUTH=false`).
- This allows the code to graduate to `main` without exposing it to customers.
- Once validated in production by admins, the environment variable is flipped to `true`.
