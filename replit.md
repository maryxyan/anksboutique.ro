# Ank's Boutique

A full-stack women's fashion e-commerce website for Ank's Boutique, a Romanian luxury fashion boutique selling dresses, blouses, outerwear, accessories, and bags.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `scripts/node_modules/.bin/tsx lib/db/src/seed-run.ts` — reseed demo products/categories
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `ank-boutique` at `/`)
- API: Express 5 (artifact: `api-server` at `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec`)
- Build: esbuild (CJS bundle)
- Fonts: Playfair Display (serif headings) + Inter (sans body)

## Where things live

- `artifacts/ank-boutique/src/` — React frontend
  - `pages/` — Shop, Product, Cart, Checkout, Wishlist, Contact, Admin
  - `components/layout/` — Navbar, Footer, Layout (WhatsApp button)
  - `components/ui/` — ProductCard + shadcn/ui components
  - `hooks/use-session.ts` — sessionId from localStorage (`anks_session_id`)
- `artifacts/api-server/src/routes/` — All API routes (products, cart, orders, wishlist, reviews, newsletter, admin, upload)
- `lib/db/src/schema/` — Drizzle ORM schema (categories, products, cart_items, orders, order_items, wishlist_items, reviews, newsletter_subscriptions)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod schemas for server validation
- `lib/db/src/seed-run.ts` — Seed script with 5 categories + 12 products

## Architecture decisions

- Contract-first API: OpenAPI spec generates both React hooks and Zod validation schemas — no drift possible between client and server types
- Session-based cart/wishlist: No auth required; session UUID stored in localStorage, all user state attached to it
- Netopia sandbox: Orders auto-redirect to sandboxsecure.mobilpay.ro via auto-submitting form (useEffect + ref)
- Admin auth: Simple localStorage flag (`adminAuthenticated=true`) with password `admin123` — no backend session needed for MVP
- Image uploads: multer → `./uploads/` directory on API server, served at `/api/uploads/:filename`
- Currency: Romanian RON throughout; prices stored as numeric strings in DB

## Product

- **Shop page**: Browse by category, search, sort (newest/price asc/desc), product badges
- **Product page**: Image gallery with hover swap, size selector, add to bag, wishlist toggle, customer reviews with star ratings
- **Cart page**: Quantity controls, remove items, running total, proceed to checkout
- **Checkout page**: Full Romanian address form (counties dropdown), Netopia card payment redirect
- **Wishlist page**: Saved items, remove from wishlist
- **Contact page**: WhatsApp, Instagram, email, and contact form
- **Admin dashboard**: Stats (revenue, orders, products), recent orders table
- **Admin products**: List, add, edit, delete products with drag-and-drop image upload
- **Admin orders**: View orders, update status (pending/confirmed/shipped/delivered/cancelled)
- **Admin inventory**: Stock levels with low-stock warnings

## User preferences

- Admin password: `admin123` (stored in localStorage as `adminAuthenticated=true`)
- WhatsApp number configured in Layout.tsx: `wa.me/40700000000`
- Instagram handle: `@anksboutique`

## Gotchas

- Seed script uses workspace-local tsx: `scripts/node_modules/.bin/tsx lib/db/src/seed-run.ts`
- Categories have unique slugs — the seed script uses `onConflictDoUpdate` to be idempotent
- API server must rebuild before new routes are available (pnpm run dev triggers build + start)
- The `onConflictDoNothing()` on products means re-seeding won't duplicate — safe to run multiple times
- `BASE_URL` from Vite must be used for all API calls in frontend code (already wired through generated hooks)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Admin password is `admin123` — access at `/admin`
