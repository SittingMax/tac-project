---
name: using-git-worktrees
description: Creates an isolated worktree on a new branch, prepares the TAC portal for development, and verifies a clean baseline.
---

# Preconditions
- Main branch is clean and synced.

# Steps
1. Create worktree on new branch (feature/fix/chore):
   - Name: feat/<short-slug> or fix/<short-slug>
   - Use Git worktrees (managed via IDE or CLI)
2. Setup project: npm ci
3. Verify baseline:
   - npm run typecheck
   - npm run lint
   - npm run format:check
   - npm run test:unit
4. Document the worktree path and branch in the plan.

# Exit criteria
- All baseline checks pass. Development can begin in isolation.
