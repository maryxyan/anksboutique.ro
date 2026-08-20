# Production deployment checklist

## Before deployment

- [ ] Confirm `main` is clean, reviewed, and synchronized with `origin/main`.
- [ ] Run API/frontend typechecks and production builds.
- [ ] Create and validate a Neon database dump; keep it outside the deployed artifact.
- [ ] Archive the exact release commit and record its SHA and tag.
- [ ] Confirm required Railway variables and health-check paths are configured.
- [ ] In Railway, open the current successful deployment and confirm **Redeploy** is available; record its deployment ID as the rollback target.

## Deploy and verify

- [ ] Deploy the API, then verify `/api/health` and inspect Railway logs.
- [ ] Deploy the frontend; verify the homepage, product, cart, checkout, sitemap, and `robots.txt`.
- [ ] Complete one controlled payment and confirm its callback updates the order exactly once.
- [ ] Run mobile/desktop Lighthouse and check external uptime monitors.

## Rollback

- [ ] Redeploy the recorded previous successful Railway deployment for each affected service.
- [ ] If the release changed data incompatibly, restore the validated Neon dump to a recovery branch/database first; do not overwrite production without approval.
- [ ] Recheck API health, storefront smoke tests, logs, and payment callbacks after rollback.
