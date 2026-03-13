---
name: executing-plans
description: Executes plan tasks in small batches with human checkpoints; rolls back quickly if a batch fails.
---

# Workflow
- Execute 1–2 tasks, then checkpoint.
- If any check fails, revert the batch; fix; re-run.

# Required checks per batch
- npm run typecheck
- npm run lint && npm run format:check
- npm run test:unit
- If UI changed: npx playwright test (targeted spec if possible)

# Exit criteria
- All tasks done with clean history and passing checks.
