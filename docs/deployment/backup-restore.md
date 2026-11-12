# Backup and restore

**Status:** Not started. Local procedure in Phase 4 (once the DB has a schema), full runbook in Phase 12.

Planned contents:

- Local: `pg_dump` / `pg_restore` scripts in `scripts/`, writing to the git-ignored `backups/` directory.
- Object storage: bucket mirroring (`mc mirror`) for MinIO.
- Restore drill: restore into a fresh container and run the smoke tests.
- Production: managed PITR, retention policy, encryption and quarterly restore testing (Phase 14).

Backups contain sensitive data. They are never committed and never uploaded to unapproved storage.
