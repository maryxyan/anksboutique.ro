# Production rollback

Every successful verification run stores the frontend build for 30 days and release metadata/checksums for 90 days. Artifact names contain the Git commit SHA.

## API rollback on Railway

1. Open the API service in Railway and select **Deployments**.
2. Find the last known-good deployment and confirm its commit SHA matches the desired release metadata in GitHub Actions.
3. Select **Redeploy** for that deployment.
4. Verify `/api/readyz`, Railway logs, and a read-only storefront API operation.

Do not roll the API back across an incompatible schema migration. Database migrations are forward-only; use a corrective migration or restore a validated Neon recovery branch as described in `docs/DATABASE_MIGRATIONS.md`.

## Frontend rollback over FTP

1. Open the successful GitHub Actions run for the desired commit.
2. Download `frontend-dist-<commit-sha>` and verify it against `release-metadata-<commit-sha>/frontend-sha256.txt`.
3. Create the normal deployment bundle by combining the artifact's `assets` and `index.html` with the tracked `public_html` hosting files from the same commit.
4. Upload that bundle to `public_html/` with the configured FTP account, preserving `uploads/**`.
5. Confirm the live homepage references the artifact's hashed entry script and that the script is downloadable.

Record the failed SHA, rollback SHA, Railway deployment, frontend artifact, operator, reason, and verification result.
