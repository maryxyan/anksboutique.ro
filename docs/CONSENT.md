# Cookie consent

The storefront queues Google Consent Mode v2 defaults in `artifacts/ank-boutique/index.html` before the application loads. All four signals start denied. The consent service restores validated preferences and sends updates on accept, reject, custom save, and cross-tab changes. Analytics controls `analytics_storage`; marketing controls `ad_storage`, `ad_user_data`, and `ad_personalization`.

No Google tracking IDs or tracking scripts are configured. This change supplies consent signals only. When adding a tracking provider, gate its loading and collection on its category, including withdrawal. Non-Google providers do not automatically obey Google consent signals. Use the reactive `useCookieConsent` hook for these integrations.

Preferences use localStorage key `anks_cookie_consent`, version 2, with a product-defined lifetime of 180 days. Legacy, expired, malformed, or future-dated preferences prompt a new choice. If storage is blocked, the choice lasts for the current page only. Increment `CONSENT_VERSION` when purposes or providers materially change. The footer's Cookie Settings button restores saved choices for editing without clearing consent prematurely.

Validation: run `pnpm --filter @workspace/ank-boutique test`, `typecheck`, and `build`. Before enabling real Google tags, verify default/update ordering and all four signals with Tag Assistant on the deployed site: https://developers.google.com/tag-platform/security/guides/consent

The privacy page now reflects the Railway API and Sameday integration documented in this repository. The operator still needs to verify actual hosting regions, processor agreements, retention practices, and international-transfer safeguards against their service accounts; these cannot be established from source code. Account deletion and broader GDPR workflows were not changed by this consent implementation.
