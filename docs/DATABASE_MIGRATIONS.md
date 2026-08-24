# Database migrations

The PostgreSQL schema is managed through versioned Drizzle migrations in `lib/db/drizzle`. Direct `drizzle-kit push`, ad-hoc production DDL, and application startup table creation are not part of the deployment process.

## Creating a migration

1. Change the schema files in `lib/db/src/schema`.
2. Run `pnpm run db:migration:generate`.
3. Review the generated SQL and metadata. Prefer additive, backward-compatible changes.
4. Run `pnpm run db:migration:check`, `pnpm run lint`, and the relevant tests and typechecks.
5. Commit the schema, SQL migration, snapshot, and journal together.

CI fails when schema changes have no generated migration, migration files are absent from the Drizzle journal, journal indexes are out of order, or migrations contain destructive operations such as `DROP`, `TRUNCATE`, destructive type changes, or renames.

## Production execution

On a push to `main`, the production workflow:

1. Verifies lint, tests, migration history, typechecks, and builds.
2. Uses `railway run` to load `DATABASE_URL` from the Railway API service.
3. Runs `pnpm run db:migration:apply` before deploying the new API.
4. Stops before API and frontend deployment if migration application fails.

The initial migrations use `IF NOT EXISTS` to adopt the existing production schema into Drizzle's migration journal. New migrations must not be edited after they have been applied to a shared environment.

## Safe schema evolution

Use an expand/contract sequence for changes that would otherwise break the running or previous API:

1. Add nullable columns, new tables, or new indexes.
2. Deploy code that can read both old and new representations.
3. Backfill data separately with observable, restartable work.
4. Switch all reads and writes to the new representation.
5. Remove obsolete structures only in a later, explicitly reviewed maintenance release.

Avoid long-running data backfills inside schema migrations. Before any production migration, confirm that the current Neon backup or recovery branch is usable.

## Rollback policy

Migrations are forward-only. Drizzle does not automatically reverse an applied production migration.

- If the migration succeeded and the application deployment failed, redeploy the previous API only when the migration is backward compatible.
- For a schema defect, create and deploy a corrective forward migration.
- For destructive data corruption, stop writes and restore the validated Neon backup into a recovery branch/database first. Do not overwrite production without explicit approval.
- Record the failed release SHA, applied migration, recovery action, and verification results.
