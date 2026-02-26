## Summary
Briefly describe what this PR changes and why.

---

## Production Safety Checklist (MANDATORY)

### Data Integrity
- [ ] No mock/demo/fake data introduced
- [ ] No Math.random(), placeholder KPIs, or fabricated fallbacks
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
- [ ] No hex / rgb / hardcoded colors
- [ ] Semantic tokens only (globals.css)
- [ ] Charts use CHART_COLORS only
- [ ] Dark/light theme verified

### Tests & Verification
- [ ] npm run typecheck
- [ ] npm run lint
- [ ] Relevant unit tests updated
- [ ] Playwright paths verified (if applicable)

---

## Screenshots / Evidence (if UI)
Attach before/after or empty/error state screenshots.

---

## Risk & Rollback
- Risk:
- Rollback plan:
