-- Runs once when the local database volume is first created.
-- Extensions are also declared in Prisma migrations (Phase 4) so hosted databases get them too.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

-- Separate database for integration tests so tests never touch development data.
CREATE DATABASE kmsdc_test;
\connect kmsdc_test
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;
