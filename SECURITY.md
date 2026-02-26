# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously at TAC Portal. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email security concerns to: **security@tac-cargo.com**
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: 1 month

### Scope

The following are in-scope for security reports:

- Authentication and authorization bypass
- Data exposure or leakage
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- SQL injection or NoSQL injection
- Remote code execution
- API key or secret exposure
- Supabase RLS policy bypasses

### Out of Scope

- Denial of service attacks
- Social engineering
- Physical security
- Issues in third-party dependencies (report to upstream)

### Recognition

We appreciate responsible disclosure and may:
- Acknowledge reporters in our security hall of fame
- Provide references for professional purposes

## Security Best Practices

### For Contributors

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use Zod schemas
3. **Sanitize outputs** - Prevent XSS attacks
4. **Follow least privilege** - Implement proper RBAC
5. **Keep dependencies updated** - Review Dependabot alerts

### Environment Variables

Required secrets should be stored in `.env.local` (never committed):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SENTRY_DSN=your_sentry_dsn
```

## Security Features

- **Supabase Auth**: Secure authentication with session management
- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control (RBAC)**: Application-level permissions
- **Sentry Monitoring**: Error and security event tracking
- **DOMPurify**: HTML sanitization for user content

---

*Last updated: January 2026*
