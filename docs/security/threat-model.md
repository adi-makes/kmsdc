# Threat model (initial — STRIDE)

**Status:** Initial draft (Phase 0). Revisited in Phase 4 (auth), Phase 8 (webhooks) and in full in Phase 12.

## Assets
Patient clinical records · patient identity and contact data · financial records · staff credentials
and sessions · integration secrets (Meta, SMTP, storage) · audit logs · clinic reputation (website,
social accounts).

## Trust boundaries
1. Internet → Next.js (public site, enquiry form)
2. Browser (staff) → API (authenticated)
3. Meta and other providers → API webhooks
4. API/worker → PostgreSQL, Redis, object storage
5. Worker → external providers (outbound)
6. Developer machines and GitHub (public repo) → CI

## Threats and planned mitigations

| # | STRIDE | Threat | Mitigation | Phase |
|---|--------|--------|------------|-------|
| T1 | Spoofing | Credential stuffing / brute force on staff login | Argon2id, per-IP + per-account rate limits, lockout with backoff, MFA for privileged roles | 4, 12 |
| T2 | Spoofing | Forged WhatsApp webhooks | `X-Hub-Signature-256` HMAC verification with app secret; verify-token handshake; reject unsigned | 8 |
| T3 | Tampering | Editing finalised notes or payments | Immutability rules (ADR-013), DB grants revoke UPDATE/DELETE on append-only tables | 4, 6, 7 |
| T4 | Tampering | CSRF on state-changing endpoints | SameSite=Lax cookie, double-submit CSRF token, Origin check | 4 |
| T5 | Repudiation | Staff deny changes | AuditLog with actor, IP, user-agent, before/after diff (PII-minimised) | 4 |
| T6 | Info disclosure | IDOR on patient or clinical endpoints | Permission guard + record-scoped queries + UUIDs + tests per role | 4, 5 |
| T7 | Info disclosure | PII in logs, Redis or error responses | pino redaction, ID-only job payloads, generic error messages | 1, 4, 9 |
| T8 | Info disclosure | Public file URLs to X-rays | Private buckets, signed URLs ≤ 5 min after a permission check, AccessLog | 6 |
| T9 | Info disclosure | Secrets committed to the public repo | .gitignore, gitleaks in CI and pre-commit, env-only secrets | 0, 1 |
| T10 | Info disclosure | Clinical details in reminders or marketing | Template variable allow-lists per category | 8 |
| T11 | DoS | Enquiry form spam / API flooding | Honeypot, time trap, rate limits (Redis store), body size limits | 3, 4 |
| T12 | DoS | Webhook replay floods | Dedupe on provider message ID (unique), fast 200 + async processing | 8 |
| T13 | EoP | Admin grants self or others excessive rights | Cannot grant permissions not held; SA creation only by SA; audited | 4 |
| T14 | EoP | XSS via patient-entered data or marketing content | React escaping, no `dangerouslySetInnerHTML` on user data, strict CSP, sanitised rich text | 2, 3, 10 |
| T15 | EoP | Malicious file upload | Size limits, MIME + magic-byte checks, no execution, served via signed URL with `Content-Disposition` | 6 |
| T16 | Supply chain | Compromised npm dependency | Lockfile, `pnpm audit`/Dependabot, minimal deps, pinned GitHub Actions by SHA | 1, 12 |
| T17 | Info disclosure | Real data in free-tier preview | Policy + synthetic seeds only + preview banner | 13 |
