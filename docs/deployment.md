# DMB Moto Shop — Setup & Deployment

Catalog-only storefront + product CMS admin. **One repo → two Vercel projects**, one shared Neon Postgres database.

## Architecture at a glance

```
              same repo, VITE_APP_TARGET picks the build (alias @app)
        ┌──────────────────────────┴──────────────────────────┐
   npm run build                                       npm run build:admin
   (StorefrontApp — public catalog)                    (AdminApp — dashboard)
        │                                                       │
   Vercel Project: STOREFRONT                          Vercel Project: ADMIN
   domainmu.com — no protection                        admin.domainmu.com
   DATABASE_URL = read-only role                       behind Deployment Protection
        └───────────────────────┬───────────────────────────────┘
                                ▼
                     Neon Postgres (shared)
```

- The admin bundle is **structurally excluded** from the storefront build (the `@app` alias resolves to exactly one app). Verified: zero admin code/strings in the storefront bundle.
- Admin auth is **server-side**: per-staff accounts in the `staff` table (bcrypt-hashed passwords), login issues an HttpOnly + Secure + SameSite=Strict session cookie (JWT signed with `SESSION_SECRET`). Write endpoints (`/api/admin/*`) require a valid session with an editor role (administrator/inputer); user-management endpoints require administrator. Passwords never reach the browser. Gated additionally by `APP_TARGET=admin` (404 on the storefront deployment).

## Environment variables

### Storefront project
| Var | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Neon connection string — **read-only role** | Server-only. Storefront never writes. |

Build Command: `npm run build` (default).

### Admin project
| Var | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Neon connection string — **read-write role** | Server-only. |
| `APP_TARGET` | `admin` | Runtime flag; enables the write endpoints. Required. |
| `SESSION_SECRET` | a long random string | Signs the session JWT. Server-only. Rotating it logs everyone out. |
| `OWNER_EMAIL` | first administrator's login email | Used **once** by `db/seed-staff.mjs` to create the first administrator. |
| `OWNER_PASSWORD` | first administrator's login password | Used **once** by the seed. Change/reset it from the dashboard later. |

Build Command: `npm run build:admin`.

**After first deploy, seed the first owner once:** `node --env-file=<env-with-DATABASE_URL+OWNER_*> db/seed-staff.mjs` (or run it locally against the production `DATABASE_URL`). This runs the migrations + creates one administrator account; then log in and add the rest via **Kelola Staff**. Roles: **administrator** (full access incl. staff management), **inputer** (can edit products), **viewer** (read-only).

> No admin credentials are `VITE_`-prefixed anymore — passwords are bcrypt-hashed in the DB and never compiled into the client bundle. (The old `VITE_ADMIN_EMAIL/PASSWORD/SECRET` and `ADMIN_API_SECRET` are removed.)

### Neon roles (recommended hardening)
Create two Postgres roles in Neon: a read-write role (admin) and a read-only role (`GRANT SELECT` only, storefront). Point each project's `DATABASE_URL` at the matching role. This is the plan's defense-in-depth; a single owner-role string works but is less safe.

## Local development

1. Create `.env.local` (gitignored) at the repo root:
   ```
   DATABASE_URL="postgresql://…neon…/neondb?sslmode=require"
   SESSION_SECRET=dev-session-secret-long-random
   OWNER_EMAIL=owner@dmb.com
   OWNER_PASSWORD=owner12345
   ```
2. Seed the database (one time, or to reset):
   ```
   node --env-file=.env.local db/seed.mjs        # products + categories
   node --env-file=.env.local db/seed-staff.mjs  # staff table + first owner
   ```
3. Run:
   - Storefront: `npm run dev` → http://localhost:5173
   - Admin: `npm run dev:admin` → admin login at `/`

A dev-only Vite bridge (`dev/api-bridge.js`) serves `/api/*` locally against Neon, so the whole stack runs without Vercel. It is `apply: 'serve'` — never part of a production build.

## Database

- Schema: `db/migrations/001_init.sql` — `categories`, `products`, `product_images`, `product_compatibility`.
- Seed: `db/seed.mjs` — idempotent upsert from `src/data/*.js`. Runs the migration first (statement-by-statement, as Neon's HTTP driver requires).
- Product model has **no** `stock`, `rating`, `reviewCount`, or `testimonials` (catalog has no transactions/reviews).

## Deploy steps (on the Vercel account that owns the projects)

1. `npm i -g vercel` and `vercel login`.
2. Create **two** Vercel projects from this repo (Storefront + Admin), each with the Build Command and env vars above.
3. Admin project → add custom domain `admin.<domain>` and enable **Deployment Protection** (Settings → Deployment Protection: password / Vercel Authentication / IP allowlist).
4. Storefront project → main domain, no protection.
5. Run the seed once against the production Neon branch.

## Pre-launch checklist

- [ ] Set `STORE_WHATSAPP` in `src/config/features.js` — **still the placeholder `6281234567890`**; the product-page "Hubungi" button links to `wa.me/<this>`, so leads go nowhere until it's the shop's real number.
- [ ] Seed the first administrator via `db/seed-staff.mjs` (`OWNER_EMAIL`/`OWNER_PASSWORD`), then change that password from **Kelola User**. (Admin auth is DB-based — there are no `VITE_ADMIN_*` env vars.)
- [ ] Use a read-only Neon role for the storefront `DATABASE_URL`.
- [ ] (If exposed) rotate the Neon role password.
