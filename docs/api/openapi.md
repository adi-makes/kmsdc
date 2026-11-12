# OpenAPI

**Status:** Not started (Phase 4).

- Swagger UI will be served at `http://localhost:4000/api/docs` in development only (disabled or
  auth-protected in hosted environments).
- The JSON spec at `/api/docs-json` will be exported to `docs/api/openapi.json` by a script, and
  `packages/api-client` will be generated from or checked against it in CI.
- Schemas come from the Zod definitions in `packages/validation` (ADR-004).
