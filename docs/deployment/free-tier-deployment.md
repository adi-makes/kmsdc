# Free-tier development and preview strategy

## 1. Principles

1. **Local first.** Every feature must run fully on a developer machine with Docker. No account,
   card or internet service is required (apart from package downloads).
2. **Mocks by default.** WhatsApp, SMS, email, payments, social platforms, maps and AI use mock
   adapters that never contact a real service (ADR-010). Email in development goes to a local
   **Mailpit** container, so nothing leaves the machine.
3. **No billable resource without written approval.** Before adding any provider, complete the
   checklist in §3 and present it to the owner.
4. **Preview ≠ production.** Free-tier previews hold **synthetic data only**. Real patient data
   never goes into a hobby or free database.
5. **Free trials are not free tiers.** Anything time-limited or credit-based is treated as paid.

## 2. Cost by phase

| Phase         | External services                         | Expected cost                                                                                                                         |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0–12 (local)  | None (Docker images, npm packages)        | ₹0                                                                                                                                    |
| CI            | GitHub Actions on a **public** repository | ₹0 (standard GitHub-hosted runners are free for public repos; re-verify in Phase 13)                                                  |
| 13 (preview)  | Candidate free tiers (below)              | ₹0 target. Each one is verified before use                                                                                            |
| WhatsApp live | Meta WhatsApp Cloud API                   | **Not free.** Meta charges per message or conversation by category and country. A cost brief and approval are required before go-live |
| Production    | AWS or equivalent                         | Paid. Plan only (Phase 14)                                                                                                            |

## 3. Provider due-diligence checklist (completed for each provider, in Phase 13)

| Question                                                       | Record answer + source URL + date checked |
| -------------------------------------------------------------- | ----------------------------------------- |
| Exact service and plan name                                    |                                           |
| Current free allowance (compute, storage, bandwidth, requests) |                                           |
| Is a payment card required to sign up?                         |                                           |
| Does it auto-upgrade or start billing when limits are hit?     |                                           |
| What happens at the limit (throttle, suspend, delete)?         |                                           |
| Idle behaviour (sleep, pause, cold-start time)                 |                                           |
| Data retention or expiry on the free plan                      |                                           |
| Region (latency and data-location considerations for India)    |                                           |
| Can spend caps or billing alerts be set?                       |                                           |
| Exit or export path                                            |                                           |

## 4. Candidate preview stack (from the spec; **unverified until Phase 13**)

| Component      | Candidate(s)                              | Known concerns to verify                                                                                                                                 |
| -------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public website | Cloudflare Pages / Vercel Hobby           | Next.js feature compatibility (Cloudflare needs an adapter). Vercel Hobby is non-commercial use only. Check the terms for a clinic site                  |
| API + worker   | Render Free web service                   | Sleeps when idle and cold starts. No free background-worker type (the worker may need to run inside the API process for the preview only, behind a flag) |
| PostgreSQL     | Neon Free / Supabase Free (Postgres only) | Compute auto-suspend, storage caps, project pausing after inactivity (Supabase). Render's free Postgres **expires** and must not be used                 |
| Redis          | Upstash Free / Redis Cloud Free           | Command and connection limits. BullMQ polling can consume command quotas quickly, so tune or disable cron in preview                                     |
| Object storage | Cloudflare R2 Free                        | May require a card on file. Verify the free class A/B operation limits                                                                                   |
| Email          | Mock / Mailpit only                       | Real email providers are needed only for production                                                                                                      |

## 5. Owner inputs that will be requested (and when)

| Needed                                                                                                                            | When                                                 | Why                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Accounts for the selected preview providers (e.g. Neon or Supabase, Render, Cloudflare) and their connection strings / API tokens | Phase 13                                             | Preview deployment. Stored only in provider secret stores and GitHub Actions secrets, never in the repo |
| Meta Business / WhatsApp Cloud API credentials                                                                                    | Only if the owner approves going live with messaging | Real WhatsApp messages (paid per message)                                                               |

Claude will **ask** for these at the relevant phase, explain the cost and limits first, and never
create accounts or resources on the owner's behalf without approval.
