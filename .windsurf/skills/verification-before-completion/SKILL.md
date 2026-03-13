---
name: verification-before-completion
description: Final verification that the fix/feature actually meets spec and is production-safe.
---

# Final checklist
- All acceptance criteria satisfied; demo steps documented.
- npm run typecheck
- npm run lint && npm run format:check
- npm run test:unit
- npx playwright test (if UI/flows touched)
- No banned patterns:
  - Direct JsBarcode imports
  - Tailwind gray/slate classes in components/pages
  - console.log in app code (warn/error allowed)
- Ensure feature flags or gradual rollout plan where appropriate.

# Exit criteria
- Ready for PR/merge with confidence.
