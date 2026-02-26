# Enterprise Dependency Security Policy

**Version:** 1.0.0  
**Last Updated:** 2026-01-22  
**Owner:** DevSecOps Team  
**Classification:** Internal

---

## 1. Purpose

This policy establishes enterprise-grade controls for managing third-party dependencies in the TAC Cargo platform. As a production logistics/finance system, supply chain security is critical to protect against:

- **Supply chain attacks** (malicious package injection)
- **Known vulnerabilities** (CVEs, prototype pollution, RCE)
- **Breaking changes** (runtime regressions)
- **License compliance issues**

---

## 2. Scope

This policy applies to:
- All npm packages in `package.json` and `package-lock.json`
- Direct and transitive dependencies
- Development and production dependencies
- All team members with repository write access

---

## 3. Dependency Classification

### 3.1 Security-Critical Dependencies

These packages require **manual review** for any version change:

| Package | Category | Risk Level |
|---------|----------|------------|
| `@supabase/supabase-js` | Authentication/Database | CRITICAL |
| `@supabase/auth-helpers-react` | Authentication | CRITICAL |
| `zod` | Input Validation | HIGH |
| `pdf-lib` | Financial Documents | HIGH |
| `@sentry/react` | Error Tracking | MEDIUM |

### 3.2 Standard Dependencies

UI libraries, utilities, and dev tools that can be auto-merged for security patches:

- React ecosystem (`react`, `react-dom`, `react-router-dom`)
- UI components (`@radix-ui/*`, `tailwindcss`)
- Utilities (`lodash`, `date-fns`, `clsx`)
- Build tools (`vite`, `typescript`, `eslint`)

---

## 4. Update Procedures

### 4.1 Dependabot Security Updates

**Automatic merge criteria (ALL must be true):**
- [ ] Security patch (fixes known vulnerability)
- [ ] Semver patch version (x.y.Z)
- [ ] Only `package.json` and/or `package-lock.json` modified
- [ ] All CI checks pass (typecheck, lint, unit tests, E2E tests)
- [ ] Not a security-critical dependency (see 3.1)
- [ ] Dependabot compatibility score ≥ 90%

**Manual review required if:**
- Semver minor (x.Y.z) or major (X.y.z) version bump
- Security-critical dependency
- CI checks fail
- Breaking change notes in changelog
- New dependencies introduced

### 4.2 Review Workflow

```
┌─────────────────┐
│ Dependabot PR   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Identify Type   │◄── Security? Semver? Direct/Transitive?
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Run CI Checks   │◄── typecheck, lint, test:unit, test
└────────┬────────┘
         │
    ┌────┴────┐
    │ Pass?   │
    └────┬────┘
         │
    ┌────┴────┐
  Yes        No
    │         │
    ▼         ▼
┌───────┐  ┌──────────┐
│ Merge │  │ Investigate│
└───────┘  └──────────┘
```

### 4.3 Verification Commands

```bash
# Required verification sequence
npm install                 # Install updated dependencies
npm run typecheck           # TypeScript compilation check
npm run lint                # ESLint code quality check
npm run test:unit           # Unit test suite (Vitest)
npm run test                # E2E test suite (Playwright)

# Optional deep verification
npm audit                   # Check for remaining vulnerabilities
npm run format:check        # Code formatting verification
```

---

## 5. Vulnerability Response SLAs

| Severity | Response Time | Resolution Time | Auto-Merge |
|----------|---------------|-----------------|------------|
| CRITICAL | 4 hours | 24 hours | No (manual review) |
| HIGH | 24 hours | 72 hours | Conditional |
| MEDIUM | 1 week | 2 weeks | Yes (if tests pass) |
| LOW | 2 weeks | 1 month | Yes (if tests pass) |

### 5.1 Severity Definitions

- **CRITICAL**: Remote code execution, authentication bypass, data exfiltration
- **HIGH**: Prototype pollution, SQL injection, XSS with sensitive data exposure
- **MEDIUM**: DoS, information disclosure, limited XSS
- **LOW**: Theoretical vulnerabilities, unlikely exploit conditions

---

## 6. Prohibited Practices

1. **Never** disable Dependabot security alerts
2. **Never** ignore CRITICAL/HIGH vulnerabilities without documented exception
3. **Never** commit `package-lock.json` changes without running `npm install`
4. **Never** use `npm install --force` or `--legacy-peer-deps` without approval
5. **Never** add dependencies from untrusted sources (non-npm registries)

---

## 7. Exception Process

For dependencies that cannot be updated:

1. Create GitHub issue with label `security-exception`
2. Document:
   - Package name and current version
   - CVE/advisory reference
   - Reason update is blocked
   - Mitigation measures applied
   - Review date (max 90 days)
3. Obtain approval from security lead
4. Add to Supply Chain Risk Register

---

## 8. Audit Requirements

### 8.1 Weekly
- Review open Dependabot PRs
- Check `npm audit` output in CI

### 8.2 Monthly
- Review Supply Chain Risk Register
- Update dependency classification list
- Review exception requests

### 8.3 Quarterly
- Full dependency audit
- License compliance review
- Evaluate alternative packages for high-risk dependencies

---

## 9. References

- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)

---

## Appendix A: Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-01-22 | 1.0.0 | Initial policy | DevSecOps |
