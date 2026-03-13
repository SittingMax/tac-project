---
name: finishing-a-development-branch
description: Wraps up the worktree, verifies all checks, and guides merge/PR/cleanup decisions.
---

# Pre-merge verification
- npm run typecheck
- npm run lint && npm run format:check
- npm run test:unit
- npx playwright test (if applicable)

# Options
- Merge directly (if allowed) or open PR for review.
- Keep branch for follow-ups or delete after merge.

# Cleanup
- Remove the worktree safely once merged.

# Exit criteria
- Changes are integrated; worktree cleaned up.
