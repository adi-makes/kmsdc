# Local development

## Prerequisites (verified on the dev machine 2026-11-12)

| Tool           | Version found | Required   |
| -------------- | ------------- | ---------- |
| Node.js        | 26.13.0       | ≥ 24 (LTS) |
| pnpm           | 10.34.9       | ≥ 10       |
| Docker         | 29.1.3        | ≥ 24       |
| Docker Compose | 2.40.3        | v2         |
| Git            | 2.53.0        | any recent |

## First run

```bash
pnpm install          # install all workspace dependencies
pnpm env:init         # create .env with random local secrets (git-ignored; never overwrites)
pnpm infra:up         # start PostgreSQL, Redis, MinIO, Mailpit and create the private bucket
pnpm build            # build shared packages (dev also does this automatically)
pnpm dev              # web :3000, api :4000, worker :4001 (watch mode)
pnpm health           # check every service, in another terminal
```

## Services and ports (ADR-016)

| Service                 | URL / port                                    | Notes                                                    |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Web (Next.js)           | http://localhost:3000                         | `/healthz` web health; `/api/v1/*` is proxied to the API |
| API (NestJS)            | http://localhost:4000/api/v1                  | `/health` readiness, `/health/live` liveness             |
| API docs (Swagger)      | http://localhost:4000/api/docs                | When `ENABLE_SWAGGER=true` (dev default)                 |
| Worker health           | http://localhost:4001/health                  | Redis, DB and queue-processor status                     |
| PostgreSQL 17           | localhost:5442                                | DBs `kmsdc` (dev) and `kmsdc_test` (tests)               |
| Redis 8                 | localhost:6389                                | AOF persistence, `noeviction` (BullMQ requirement)       |
| MinIO S3 API / console  | http://localhost:9010 / http://localhost:9011 | Private bucket `kmsdc-private`                           |
| Mailpit SMTP / inbox UI | localhost:1035 / http://localhost:8035        | Captures all outgoing mail; nothing leaves the machine   |

All ports are bound to `127.0.0.1` only and can be overridden in `.env`. They avoid an existing
Supabase stack on this machine (54321–54324).

## Commands

| Command              | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `pnpm dev`           | Run web, api and worker in watch mode                          |
| `pnpm build`         | Build every package and app (Turborepo, cached)                |
| `pnpm lint`          | ESLint (strict type-checked rules) across the workspace        |
| `pnpm typecheck`     | `tsc --noEmit` across the workspace                            |
| `pnpm test`          | Vitest in every package                                        |
| `pnpm format`        | Prettier write. `pnpm format:check` verifies only              |
| `pnpm check`         | Everything CI runs: format check, lint, typecheck, test, build |
| `pnpm infra:up/down` | Start or stop the Docker services (data is kept)               |
| `pnpm infra:logs`    | Follow the Docker service logs                                 |
| `pnpm infra:reset`   | **Deletes all local data volumes** (asks for confirmation)     |
| `pnpm health`        | Health table for all services                                  |

## Environment variables

All variables are documented in [`.env.example`](../../.env.example) and validated at start-up by
Zod schemas in `packages/config/src/env.ts`. A process with a missing or invalid variable stops
and lists every problem, by variable name only (values are never printed).

## Notes

- The repository is on an NTFS volume. Symlinks work, so pnpm works. Database data uses named Docker
  volumes, not bind mounts. `core.fileMode=false` is set locally.
- The Postgres init script (`infrastructure/docker/postgres/init`) runs only when the volume is first
  created. It enables `btree_gist`, `pg_trgm` and `citext` and creates `kmsdc_test`.
- `pnpm` blocks dependency install scripts unless they are allow-listed in `pnpm-workspace.yaml`.
  Telemetry scripts (`@scarf/scarf`) are deliberately ignored.
