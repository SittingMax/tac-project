---
name: subagent-driven-development
description: Executes each task with fresh subagents and two-stage review (spec compliance, then code quality) for fast, safe iteration.
---

# Execution loop per task
1. Implement strictly per plan; no scope creep (YAGNI/DRY).
2. Stage 1 Review: Spec/plan compliance only. Fix deviations.
3. Stage 2 Review: Code quality (types, hooks rules, query keys, errors, UI tokens).
4. Run checks: typecheck, lint, unit tests; update docs/plan if needed.

# TAC quality gates
- TS strict; no unused locals/params
- Path aliases '@/'; stable query keys in lib/queryKeys
- React 19 hooks rules; components use shadcn/ui; no gray/slate classes
- Errors mapped via lib/errors; toasts for UX feedback
- No JsBarcode direct imports; use UniversalBarcode

# Exit criteria
- Task merges cleanly into worktree; all gates pass.
