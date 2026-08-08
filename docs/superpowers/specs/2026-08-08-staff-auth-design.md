# Staff Auth & User Management — Design Spec

**Date:** 2026-08-08
**Status:** Draft for review
**Goal:** Replace the client-side admin password (`VITE_ADMIN_*`) with real server-side authentication and per-staff accounts, plus a user-management UI. The password never reaches the browser.

## Roles

| Role | View dashboard/products | Edit products (create/update/delete/publish) | Manage staff accounts |
|------|:--:|:--:|:--:|
| **owner** | ✓ | ✓ | ✓ |
| **staff** | ✓ | ✓ | ✗ |
| **viewer** | ✓ | ✗ (read-only) | ✗ |

- **owner** — full; the only role that can add/edit/delete staff accounts.
- **staff** — manage products; cannot touch staff accounts.
- **viewer** — read-only; can see everything but change nothing.

(Extendable later; today the only permissioned resources are products + staff.)

## Data model (Neon)

New table `staff`:

```sql
create table staff (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  job            text,                      -- jabatan (deskriptif, mis. "Admin Gudang")
  email          text unique not null,      -- stored lower-cased
  role           text not null default 'staff' check (role in ('owner','staff','viewer')),
  password_hash  text not null,             -- bcrypt hash, never plaintext
  failed_attempts int not null default 0,   -- brute-force lockout
  locked_until   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
```

## Password security

- Hashed with **bcrypt** (`bcryptjs`, cost factor 12). Plaintext is never stored, logged, or returned in any response.
- Minimum length 8 enforced server-side on create/reset/change.
- `bcrypt.compare` (constant-time) for verification.

## Session security

- On successful login, sign a **JWT** (`jose`, HS256, `SESSION_SECRET`) with payload `{ sub: id, role, iat, exp }`, expiry 7 days.
- Delivered as a cookie: **`HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`**.
  - `HttpOnly` → JavaScript can't read it (safe from XSS token theft).
  - `Secure` → HTTPS only.
  - `SameSite=Strict` → not sent on cross-site requests (CSRF-resistant).
- `GET /api/admin/me` verifies the cookie and returns the current user (never the hash), or 401.
- Logout clears the cookie.
- **Defense-in-depth CSRF:** write endpoints also verify the request `Origin` matches the deployment host.

## Brute-force protection

- Per-account `failed_attempts`; after 5 consecutive failures, lock the account for 15 minutes (`locked_until`). Reset counter on success.
- Login errors are generic ("Email atau password salah") — no user enumeration, no "which field" hint.

## Endpoints (admin deployment only — gated by `APP_TARGET=admin`)

**Auth**
- `POST /api/admin/login` `{ email, password }` → set cookie, return `{ user }`
- `POST /api/admin/logout` → clear cookie
- `GET  /api/admin/me` → current user or 401

**User management (owner only)**
- `GET    /api/admin/users` → list (no hashes)
- `POST   /api/admin/users` `{ name, job, email, role, password }` → create
- `PUT    /api/admin/users/[id]` `{ name, job, email, role }` → edit (not password)
- `DELETE /api/admin/users/[id]` → delete — **guards:** cannot delete yourself; cannot delete the last remaining owner
- `POST   /api/admin/users/[id]/reset-password` `{ newPassword }` → owner sets a new password for a user

**Self-service**
- `POST /api/admin/change-password` `{ currentPassword, newPassword }` → logged-in user changes own password

**Product writes** — switch from the `x-admin-secret` header to a **valid session** (any authenticated staff).

## Authorization helpers

- `requireSession(req)` → `{ user }` or 401 (verifies cookie).
- `requireEditor(user)` → false unless role is `owner` or `staff` (blocks `viewer`).
- `requireOwner(user)` → false unless `user.role === 'owner'`.
- **Product reads** (dashboard/list): any authenticated session (incl. viewer).
- **Product writes** (create/update/delete): `requireSession` + `requireEditor` (viewer → 403).
- **User management**: `requireSession` + `requireOwner` (staff/viewer → 403).
- Keep the `APP_TARGET==='admin'` gate (404 on the storefront deployment) as an extra layer.

## Frontend (admin app)

- **AuthContext** rewritten: `login()` → `POST /api/admin/login` (with `credentials: 'include'`); on mount → `GET /api/admin/me` to restore the session; `logout()` → `POST /api/admin/logout`. Exposes `currentUser`, `isOwner = role === 'owner'`, `isEditor = role !== 'viewer'`. No password logic in the client.
- **Viewer (read-only) UI**: when `!isEditor`, hide product write controls (Tambah Produk, edit/delete/publish, the form's save buttons — or open the form read-only). The server still enforces (defense-in-depth); the UI just avoids dead buttons.
- **adminApi**: every call uses `credentials: 'include'` (sends the cookie); drop the `x-admin-secret` header.
- **New page — "Kelola Staff"** (`/admin/staff`, owner only): table of staff + **Add** (modal: nama, jabatan, email, role, password) + **Edit** + **Delete** + **Reset password**. Route + sidebar item hidden/guarded for non-owners.
- **Sidebar**: add a "Staff" item, shown only when `isOwner`.
- **Login page**: same UI, wired to the new endpoint.

## First owner (seeding)

- `db/seed-staff.mjs`: if `staff` is empty, create one **owner** from `OWNER_EMAIL` + `OWNER_PASSWORD` (env), hashed. Idempotent. Run once after the migration. This is the account used to log in first and create the rest.

## Environment variables

**Admin project — add:**
- `SESSION_SECRET` — long random string (signs the session JWT). Server-only.
- `OWNER_EMAIL`, `OWNER_PASSWORD` — used once by the seed script to create the first owner. Server-only.

**Admin project — remove (no longer used):**
- `VITE_ADMIN_EMAIL`, `VITE_ADMIN_PASSWORD`, `VITE_ADMIN_SECRET`, `ADMIN_API_SECRET`

**Keep:** `DATABASE_URL`, `APP_TARGET=admin`. **Storefront project:** unchanged (`DATABASE_URL` only).

## Dependencies

- `bcryptjs` (hashing), `jose` (JWT). Both serverless-friendly.

## Security summary ("seaman mungkin")

- Passwords bcrypt-hashed (cost 12); never in the browser, DB plaintext, logs, or API responses.
- Session in an HttpOnly + Secure + SameSite=Strict cookie (XSS + CSRF resistant) + Origin check on mutations.
- Role-based access (least privilege): staff can't touch user management.
- Login lockout after repeated failures; generic errors (no user enumeration).
- Guards against deleting yourself or the last owner.
- HTTPS enforced by Vercel.

## Testing

- **Unit:** password hash/verify, JWT sign/verify (valid, expired, tampered), input validation (email/role/password rules), authz helpers (session/owner), lockout counter.
- **Integration/manual:** login → cookie set → `me` restores; owner vs staff access boundaries; user CRUD; reset & change password; product write rejected without session, accepted with.
