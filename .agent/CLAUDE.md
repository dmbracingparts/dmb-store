# DMB Moto Shop — Agent Guide

Project guide for AI agents (and humans) working on this codebase. Read this
first before making changes.

**What this is:** a catalog website + admin CMS for **DMB Moto Shop**
(dmbracingparts), a motorcycle spare-parts shop. The public site is a
browse-only catalog that funnels enquiries to WhatsApp; the admin is a product
& user CMS backed by a database.

---

## 1. Architecture: one repo, two apps

A single repo builds **two separate apps**, selected at build time by the
`VITE_APP_TARGET` env var. `vite.config.js` aliases `@app` (the single entry
`src/main.jsx` imports) to exactly one of:

- `VITE_APP_TARGET` unset → `src/StorefrontApp.jsx` — **public catalog**
- `VITE_APP_TARGET=admin` → `src/AdminApp.jsx` — **admin dashboard**

Because `@app` resolves to one file, Rollup only walks that app's module graph —
the other app is **structurally excluded**, not merely tree-shaken. **Invariant:
never import admin code from `StorefrontApp` or vice versa.** (Verified: no admin
strings in the storefront bundle.)

Each app deploys as its **own Vercel project** from the same repo, sharing one
Neon Postgres database:

| Vercel project | Build command | Serves |
|---|---|---|
| `dmb-store` | `npm run build` | storefront (public domain) |
| `dmb-admin` | `npm run build:admin` | admin (should be behind Deployment Protection) |

Admin **page** routes sit at the **root** of the admin deployment — `/`
(dashboard), `/login`, `/products`, `/products/new`, `/products/:id`, `/staff`.
It has its own subdomain, so an `/admin` URL prefix would only say "admin"
twice. Unmatched paths redirect to `/`, which also catches bookmarks of the old
`/admin/*` URLs. This is unrelated to the **API** paths, which stay
`/api/admin/*` — those are serverless file locations, not user-facing URLs.
There is deliberately **no secret login slug**: the old one shipped in the
client bundle and the logged-out redirect pointed straight at it, so it
protected nothing. Deployment Protection is the real gate.

## 2. Backend: Vercel functions + Neon

- API lives in `api/` (Vercel serverless functions). `api/_lib/` holds shared
  logic (`auth`, `staff`, `products`, `categories`, `db`, `http`).
- DB is **Neon Postgres** via `@neondatabase/serverless` HTTP driver
  (`api/_lib/db.js`, cached client). **One statement per `sql\`...\`` call**;
  use `sql.transaction([...])` for atomic multi-statement writes.
- **Always** use tagged-template interpolation (`sql\`... ${val}\``) — values
  are bound as parameters (no SQL injection). Never string-concatenate SQL.
- `APP_TARGET=admin` is a **runtime** env var on the admin Vercel project. Every
  admin endpoint returns **404** when `APP_TARGET !== 'admin'`, so admin
  endpoints don't exist on the storefront deployment. (Distinct from the
  build-time `VITE_APP_TARGET`.)
- **Local dev:** `dev/api-bridge.js` (a Vite `apply:'serve'` plugin) serves
  `/api/*` against Neon so the full stack runs under `vite dev` with no Vercel.
  Its `ROUTES` table must be kept in sync with the files in `api/`.
- Region is pinned to **`sin1`** (`vercel.json`) to co-locate compute with Neon
  in `ap-southeast-1` — cross-region DB round trips were the main latency source.

## 3. Auth & roles (admin only)

- Passwords: **bcrypt** cost 12 (`bcryptjs`). Sessions: **JWT** (`jose`,
  HS256, signed with `SESSION_SECRET`) in an **HttpOnly + Secure(prod) +
  SameSite=Strict** cookie. Passwords never reach the client.
- **`requireSession` is DB-backed** (`api/_lib/auth.js`): every authenticated
  request loads the staff row and checks that (a) the account still exists and
  (b) the JWT's `tv` claim equals the row's `token_version`. The **role is read
  live from the DB**, so a demotion applies on the next request. It takes an
  injectable `sql` arg so the `http.js` gates stay unit-testable without a DB.
- **Session revocation:** `setPassword` bumps `token_version`, invalidating all
  of that user's existing sessions. change-password / self-reset re-issue the
  current cookie so the acting user isn't logged out of their own tab.
- **Roles** (`administrator` | `inputer` | `viewer`):
  - `administrator` — full access **incl. user management** (`requireAdministrator`)
  - `inputer` — can edit products (`requireEditor` = administrator|inputer)
  - `viewer` — read-only (passes `requireAdminSession`, fails `requireEditorSession`)
- Gates (`api/_lib/http.js`): `requireAdminSession` (any staff, read),
  `requireEditorSession` (write), plus `requireAdministrator` for user mgmt.
  `checkOrigin` is CSRF defense-in-depth on top of SameSite=Strict.

## 4. Data model & conventions

- **Product has NO `stock`, `rating`, `reviewCount`, or `testimonials`** — this
  is a catalog with no transactions or reviews. Don't reintroduce them.
- `shapeProduct` maps DB snake_case → camelCase for the client; `getProduct`
  takes `{ publishedOnly }` — **the public path passes `true`** so drafts aren't
  leaked; admin create/update pass `false`.
- Migrations in `db/migrations/` (`001_init`, `002_staff`, `003_rename_roles`,
  `004_token_version`). Seeds: `db/seed.mjs` (products/categories),
  `db/seed-staff.mjs` (staff table + first administrator + runs 002→004).
- **Migration gotcha:** the seed splits DDL on `;`, so **never put a `;` inside
  a migration comment** — it breaks the split.

## 5. Storefront specifics

- **Catalog-only mode** via `src/config/features.js`:
  - `CATALOG_ONLY = true` hides cart/checkout/login/account/order routes (they
    `Navigate` home) and the corresponding nav. Flip to `false` to restore all.
  - `STORE_WHATSAPP` — the "Hubungi" CTA target. **Currently the placeholder
    `6281234567890`; set the shop's real number before launch.**
- Storefront reads products/categories from the API via `src/lib/api.js`
  (session-lived in-memory cache) and `src/store/hooks.js` (cache-first +
  background revalidate; an error never wipes good cache).

## 6. Admin design system ("Bento")

- Scoped under `.admin-theme` (`src/styles/admin-theme.css`); font Instrument
  Sans; tokens `--adm-*` (brand black + `#FEC901` yellow); tiles use `.adm-tile`
  (16px radius). Reusable primitives in `src/components/admin/ui/Bento.jsx`
  (`StatTile`, `SectionCard`, `BarChart`, `StatusPill`, `Skeleton`, …) and
  `FormControls.jsx` (`AdminButton`, `AdminSelect` custom listbox, inputs).
- Toasts: `useToast()` from `src/components/admin/ui/Toast.jsx`.
- **CSS gotcha 1 — containing block:** entrance animations that hold a
  `transform` (via `animation-fill-mode: both/forwards`) make the element a
  containing block for `position: fixed/absolute` descendants **forever**,
  which breaks centered modals and the floating save bar. Entrance animations
  in `admin-theme.css` deliberately **omit fill-mode**. Don't add it back.
- **CSS gotcha 2 — portals:** content portaled to `document.body` (modals,
  toasts) escapes the `.admin-theme` subtree, so `var(--adm-*)` won't resolve.
  **Re-declare `className="admin-theme"` on the portal root.**

## 7. Commands & workflow

```bash
npm run dev          # storefront @ localhost:5173
npm run dev:admin    # admin @ localhost:5173 (VITE_APP_TARGET=admin)
npm run build        # build storefront
npm run build:admin  # build admin
npm run test         # node --test (tests/*.test.js) — data-access & auth-gate units
npm run lint         # oxlint

# seed / migrate against a DB (needs DATABASE_URL, and OWNER_* for staff):
node --env-file=.env.local db/seed.mjs
node --env-file=.env.local db/seed-staff.mjs
```

- **Code style: 2-space indent, NO semicolons, single quotes.** Match the
  surrounding code.
- **Before committing:** `npm run lint`, `npm run test`, **and both builds**
  must pass. Verify DB-touching changes against Neon and UI changes in-browser.
- Env vars: see `docs/deployment.md`. Admin auth is **DB-based** — there are no
  `VITE_ADMIN_*` vars. Required: `DATABASE_URL`, `SESSION_SECRET`,
  `APP_TARGET=admin` (admin only), `OWNER_EMAIL`/`OWNER_PASSWORD` (seed only).

## 8. Known follow-ups (not yet done)

- `STORE_WHATSAPP` is still the placeholder number.
- Storefront `DATABASE_URL` could use a **read-only Neon role** (defense in
  depth — it only ever reads).
- Enable Deployment Protection on the admin project. Now that the login slug is
  gone, this is the only thing keeping the sign-in form off the open internet.
