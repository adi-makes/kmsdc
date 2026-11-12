# Local development

**Status:** Planned. Commands become available in Phase 1.

## Prerequisites (verified on the dev machine 2026-11-12)

| Tool | Version found | Required |
|------|---------------|----------|
| Node.js | 26.13.0 | ≥ 24 LTS |
| pnpm | 10.34.9 | ≥ 10 |
| Docker | 29.1.3 | ≥ 24 |
| Docker Compose | 2.40.3 | v2 |
| Git | 2.53.0 | any recent |

## Planned services and ports (ADR-016)

| Service | Host port | Purpose |
|---------|-----------|---------|
| web (Next.js) | 3000 | Public site + staff dashboard |
| api (NestJS) | 4000 | REST API, `/api/v1/health`, `/api/docs` |
| worker health | 4001 | `/health` |
| PostgreSQL 17 | 5442 | Database (named volume `kmsdc_pgdata`) |
| Redis 7 (or Valkey) | 6389 | BullMQ, rate limits (named volume) |
| MinIO API / console | 9010 / 9011 | Object storage (named volume) |
| Mailpit SMTP / UI | 1035 / 8035 | Captures all outgoing email locally |

All host ports are overridable via `.env`. Ports were chosen to avoid an existing Supabase stack on
this machine (54321–54324).

## Notes

- The repository is on an NTFS volume. Symlinks work, so pnpm works. Database data uses named Docker
  volumes, not bind mounts.
- `core.fileMode=false` is set locally to avoid noise from NTFS permission bits.
