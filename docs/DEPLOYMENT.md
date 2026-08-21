# Deployment

The production API is deployed through Railway. The former Romarg Node/API deployment is retired and must not be restarted. The static frontend is still deployed to the web host over FTP.

The `Build, Verify & Deploy Production` GitHub Actions workflow validates pull requests and pushes to `main`. After a successful `main` build, it deploys the API with the Railway CLI, verifies API health, and then uploads the verified frontend build to the web host over FTP. Finally, it confirms that `https://anksboutique.ro` serves the entry asset from that exact verified build. Railway deployment requires a production-environment project token in `RAILWAY_TOKEN` and the API service ID in `RAILWAY_SERVICE_ID`. `RAILWAY_PROJECT_ID` may remain configured for other tooling, but the current workflow does not read it. Frontend deployment requires `FTP_SERVER`, `FTP_USERNAME`, and `FTP_PASSWORD`.

## Railway services

The existing Railway service hosts the API. The frontend remains on the FTP web host under `public_html/`. Its deployment bundle combines the new Vite `assets` and `index.html` with the tracked hosting files in `public_html`; remote user uploads are excluded from synchronization.

### API

- Build: `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server build`
- Start: `pnpm --filter @workspace/api-server start`
- Health check: `GET https://workspaceapi-server-production-17e0.up.railway.app/api/healthz`
- Required runtime: Node.js 22.x and pnpm 11.10.0

### Frontend

- Build: `pnpm install --frozen-lockfile && pnpm --filter @workspace/ank-boutique build`
- Publish the generated `artifacts/ank-boutique/dist` directory.

## Required environment variables

Set secrets only in Railway; never commit values or certificate files.

- `DATABASE_URL`
- `NETOPIA_MERCHANT_ID`
- `NETOPIA_PUBLIC_KEY_PEM`
- `NETOPIA_PRIVATE_KEY_PEM`
- `NETOPIA_SANDBOX=false`
- `APP_BASE_URL`
- `FRONTEND_URL`
- `PORT` (normally injected by Railway)
- `SAMEDAY_USERNAME`
- `SAMEDAY_PASSWORD`
- `SAMEDAY_PICKUP_POINT_ID`
- `SAMEDAY_CONTACT_PERSON_ID`

The Sameday API defaults to `https://api.sameday.ro`, home service `7`, locker service `15`, and a 1 kg parcel. Override these with `SAMEDAY_API_URL`, `SAMEDAY_HOME_SERVICE_ID`, `SAMEDAY_LOCKER_SERVICE_ID`, and `SAMEDAY_DEFAULT_PACKAGE_WEIGHT` when the Sameday account requires different values.

Set `NETOPIA_API_KEY` only when a JSON API feature actually uses it. The legacy XML checkout does not use it.

Review all other variables in `.env.example`, remove obsolete duplicates, and confirm that production URLs use HTTPS. After changing `DATABASE_URL` or NETOPIA credentials, redeploy the API and perform a sandbox or controlled live payment callback test.

The current application does not use server-side session middleware and does not read `SESSION_SECRET`. Rotating that variable alone has no application effect; add and rotate it when signed sessions are implemented.

## Deployment procedure

1. Merge reviewed changes into `main`.
2. Confirm the API typecheck and build pass locally.
3. Apply database migrations before code that depends on them.
4. Deploy the API. CI checks `/api/healthz` automatically; also inspect the Railway logs.
5. Deploy the frontend.
6. Place a controlled payment and verify the NETOPIA callback changes the order from `pending` to the expected terminal state exactly once.
7. Verify the return page and customer/admin notifications.

## Credential rotation

The repository history previously contained NETOPIA credential material. Rotate the NETOPIA API key and key pair in the merchant portal, replace Railway values, and revoke the old credentials. Rotate the database password if it was reused, shared, logged, or exposed, then update `DATABASE_URL` atomically.

## Retired Romarg API deployment

In the Romarg control panel or shell:

1. Stop and disable the old Node.js application/process.
2. Confirm no process manager or cron job restarts it.
3. Set Romarg's `API_PROXY_URL` to the public Railway API URL while the static frontend remains on Romarg.
4. Remove the old `temp_repo` deployment directory after verifying the active site no longer serves from it.
5. Remove only obsolete API deployment and restart credentials. Keep the frontend `FTP_SERVER`, `FTP_USERNAME`, and `FTP_PASSWORD` secrets while FTP hosts the storefront.
6. Keep a recoverable backup until the Railway deployment has been verified.

The workflow no longer uploads or restarts the API over FTP. FTP is limited to the static frontend deployment bundle.
