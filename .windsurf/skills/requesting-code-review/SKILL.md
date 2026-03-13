---
name: requesting-code-review
description: Pre-review checklist ensuring changes align with the plan and TAC engineering standards.
---

# Prepare the PR
- Link the approved design and plan tasks; note any deviations and rationale.
- Summarize scope, risks, and rollout/rollback.
- Highlight key files and tricky decisions.

# Self-checks
- Typecheck, lint, format clean
- Unit tests updated/added; e2e adjusted for flows
- No banned classes, no direct JsBarcode imports
- Errors mapped; user toasts on success/failure

# Reviewer guidance
- How to verify locally (commands)
- Screenshots/recording if UI changed

# Exit criteria
- PR is reviewable with minimal back-and-forth.
