# Deployment

Production is deployed through Railway. The former Romarg FTP/Node deployment is retired and must not be restarted.

## Railway services

Configure separate API and frontend services from this repository, or equivalent Railway build targets.

### API

- Build: `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server build`
- Start: `pnpm --filter @workspace/api-server start`
- Health check: `GET /api/health`
- Required runtime: Node.js 22 and pnpm 11

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

Set `NETOPIA_API_KEY` only when a JSON API feature actually uses it. The legacy XML checkout does not use it.

Review all other variables in `.env.example`, remove obsolete duplicates, and confirm that production URLs use HTTPS. After changing `DATABASE_URL` or NETOPIA credentials, redeploy the API and perform a sandbox or controlled live payment callback test.

The current application does not use server-side session middleware and does not read `SESSION_SECRET`. Rotating that variable alone has no application effect; add and rotate it when signed sessions are implemented.

## Deployment procedure

1. Merge reviewed changes into `main`.
2. Confirm the API typecheck and build pass locally.
3. Apply database migrations before code that depends on them.
4. Deploy the API and check its health endpoint and logs.
5. Deploy the frontend.
6. Place a controlled payment and verify the NETOPIA callback changes the order from `pending` to the expected terminal state exactly once.
7. Verify the return page and customer/admin notifications.

## Credential rotation

The repository history previously contained NETOPIA credential material. Rotate the NETOPIA API key and key pair in the merchant portal, replace Railway values, and revoke the old credentials. Rotate the database password if it was reused, shared, logged, or exposed, then update `DATABASE_URL` atomically.

## Retiring Romarg

In the Romarg control panel or shell:

1. Stop and disable the old Node.js application/process.
2. Confirm no process manager or cron job restarts it.
3. Set Romarg's `API_PROXY_URL` to the public Railway API URL if the static frontend remains on Romarg.
4. Remove the old `temp_repo` deployment directory after verifying the active site no longer serves from it.
5. Remove obsolete FTP deployment credentials and GitHub repository secrets.
6. Keep a recoverable backup until the Railway deployment has been verified.

The repository no longer contains the former FTP workflow, remote restart endpoint, or Romarg restart/health scripts.
