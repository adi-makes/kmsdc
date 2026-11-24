# Production Deployment & Cloud Architecture Reference (Phase 14)

**Project:** Kottakal Multispeciality Dental Clinic (KMSDC)  
**Location:** Pathanamthitta, Kerala, India  
**Target Region:** AWS Asia Pacific (Mumbai) `ap-south-1`  
**Status:** Architecture Blueprint & Operational Plan (Ready for Production Provisioning)

---

## 1. High-Availability Reference Architecture

```text
                                [ DNS: Route 53 ]
                                        │
                                        ▼
                           [ AWS CloudFront CDN + WAF ]
                                        │
                    ┌───────────────────┴───────────────────┐
                    │ HTTPS (Web assets & public pages)     │ HTTPS /api/v1/*
                    ▼                                       ▼
         [ S3: Static Web Host ]                 [ Application Load Balancer ]
                                                            │
                                             ┌──────────────┴──────────────┐
                                             ▼                             ▼
                                   [ ECS Fargate: API ]          [ ECS Fargate: Worker ]
                                     (Multi-AZ, min: 2)           (Queue & Outbox Relay)
                                             │                             │
                                             └──────────────┬──────────────┘
                                                            ▼
                                           ┌────────────────────────────────┐
                                           │  RDS PostgreSQL Multi-AZ (PG17)│
                                           │  Primary ──(Sync)──> Standby   │
                                           │  Automated Backups & PITR      │
                                           └────────────────────────────────┘
                                                            │
                                           ┌────────────────────────────────┐
                                           │  ElastiCache Redis (BullMQ)    │
                                           │  S3 (Private Clinical Storage) │
                                           │  AWS Secrets Manager & KMS     │
                                           └────────────────────────────────┘
```

---

## 2. Infrastructure Components & Configuration

| Layer              | Service                       | Configuration & Tier                                                                                                  | Availability & Redundancy                                                       |
| :----------------- | :---------------------------- | :-------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **DNS & CDN**      | AWS Route 53 + CloudFront     | Custom domain with ACM SSL certificate, TLS 1.3, AWS WAF rate limiting.                                               | Global edge locations.                                                          |
| **Edge Security**  | AWS WAF                       | Web ACLs blocking common OWASP attacks, SQLi, and brute-force IP throttling.                                          | Global edge.                                                                    |
| **Compute**        | AWS ECS Fargate               | Containerized NestJS API and Worker containers in private VPC subnets.                                                | Multi-AZ (ap-south-1a, ap-south-1b). Auto-scaling on CPU/Memory.                |
| **Load Balancing** | AWS Application Load Balancer | HTTPS termination with health checks pointing to `/api/v1/health`.                                                    | Redundant across availability zones.                                            |
| **Database**       | Amazon RDS for PostgreSQL     | PostgreSQL 17, `db.t4g.medium` (or `db.r6g.large`), Multi-AZ synchronous replication.                                 | 99.95% SLA. Continuous WAL archiving with 35-day Point-In-Time-Recovery (PITR). |
| **Cache & Queues** | Amazon ElastiCache for Redis  | Redis cluster mode with automatic failover for BullMQ job queue.                                                      | High availability multi-AZ.                                                     |
| **File Storage**   | Amazon S3                     | Dedicated private clinical bucket with SSE-KMS encryption, versioning, and bucket policies restricting public access. | 99.999999999% durability.                                                       |
| **Secrets & Keys** | AWS Secrets Manager & KMS     | Encryption keys for PHI at rest, database credentials, and WhatsApp Cloud API tokens.                                 | Native AWS integration with automatic rotation.                                 |

---

## 3. Disaster Recovery & Zero-Data-Loss Strategy

1. **Recovery Point Objective (RPO):** ≤ 5 minutes (via automated Multi-AZ DB replication and continuous WAL archiving to S3).
2. **Recovery Time Objective (RTO):** ≤ 15 minutes (automated failover to standby replica; automated ECS task restart on container degradation).
3. **Cross-Region Cold Storage:** Encrypted database snapshots replicated daily to `ap-south-2` (Hyderabad) for catastrophe resilience.
4. **Disaster Runbooks:** Fully documented in [`docs/deployment/backup-restore.md`](backup-restore.md).

---

## 4. Cost Estimation & Phased Cloud Spending Approach

To adhere to the free-tier-first and cost-conscious principles of the KMSDC charter:

1. **Phase 1–13 (Current / Staging Preview):** ₹0/month using local Docker Compose and serverless free-tier previews (Neon, Render, Cloudflare Pages).
2. **Production Baseline (Initial Launch):**
   - RDS Multi-AZ (`db.t4g.small`): ~$35/mo (~₹2,900/mo)
   - ECS Fargate (2 tasks, 0.5 vCPU, 1 GB RAM): ~$20/mo (~₹1,650/mo)
   - ALB & Networking: ~$18/mo (~₹1,500/mo)
   - S3 Storage + ElastiCache: ~$15/mo (~₹1,250/mo)
   - **Total Estimated Monthly Infrastructure Spend:** ~$88/mo (~₹7,300/mo).
3. **Provider Migration Gate:** Real patient data is strictly prohibited until the clinic signs off on production cloud provisioning.

---

## 5. Vendor Exit & Cloud Portability Plan

All application services run as standard OCI container images (`apps/api`, `apps/web`, `apps/worker`). The database schema is completely standard PostgreSQL 17 managed via Prisma migrations. No proprietary vendor lock-in exists; the platform can be transferred in under 1 hour to any cloud host, DigitalOcean, Hetzner, or on-premise clinic server.
