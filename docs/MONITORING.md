# Production monitoring

The `Monitor Production` GitHub Actions workflow checks the database-backed API readiness endpoint and the public storefront every 10 minutes. A failure produces a failed workflow run.

Repository watchers should enable GitHub Actions failure notifications. For faster paging and monitoring independent of GitHub, configure an external uptime provider to check:

- `https://workspaceapi-server-production-17e0.up.railway.app/api/readyz` — expect HTTP 200 and `{"status":"ready"}`.
- `https://anksboutique.ro/` — expect HTTP 200 and `<div id="root"></div>`.

Use at least two consecutive failures before paging to reduce transient alerts. Route production alerts to an actively monitored email, chat, or incident-management destination. Keep the external monitor outside Railway and the FTP host so provider outages remain observable.
