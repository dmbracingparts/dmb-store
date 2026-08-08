# Staff Auth & User Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development to implement task-by-task. Steps use `- [ ]`.

**Goal:** Server-side authentication with per-staff accounts (bcrypt + signed session cookie) and an owner-only user-management UI, replacing the client-side `VITE_ADMIN_*` password.

**Architecture:** Neon `staff` table (hashed passwords) → auth endpoints issue an HttpOnly/Secure/SameSite=Strict JWT cookie → admin write + user-management endpoints verify the session (role-gated). Frontend calls the endpoints with `credentials: 'include'`.

**Tech Stack:** Vercel Functions (Node), `@neondatabase/serverless`, `bcryptjs`, `jose`, Vite/React admin app, `node --test`.

**Spec:** `docs/superpowers/specs/2026-08-08-staff-auth-design.md` (security details live there).

## Global Constraints

- Code style: 2-space, NO semicolons, single quotes.
- Passwords: bcrypt cost 12; min length 8; never store/log/return plaintext.
- Session cookie: `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`, JWT (HS256, `SESSION_SECRET`).
- Roles: `owner` (products + user mgmt), `staff` (products only), `viewer` (read-only). Product writes need owner/staff; user mgmt needs owner. Least privilege enforced server-side; UI hides write controls for `viewer`.
- Admin endpoints stay gated by `APP_TARGET==='admin'` (404 otherwise) **and** a valid session.
- Login errors generic ("Email atau password salah"); lockout after 5 fails for 15 min.
- Never echo `.env.local`.

---

## Task 1: `staff` table migration + deps

**Files:** Create `db/migrations/002_staff.sql`; Modify `package.json` (add `bcryptjs`, `jose`).

- [ ] Add deps: `npm i bcryptjs jose`
- [ ] Create `db/migrations/002_staff.sql` with the `staff` table from the spec (§Data model), using `create table if not exists` + `create index if not exists staff_email_idx on staff (email)`.
- [ ] Commit: `feat: staff table migration + auth deps`

---

## Task 2: Auth core (`api/_lib/auth.js`) + tests

**Files:** Create `api/_lib/auth.js`; Test `tests/auth.test.js`.

**Produces:** `hashPassword(pw)`, `verifyPassword(pw, hash)`, `signSession({id,role})`, `verifySession(token)`, `readSessionCookie(req)`, `setSessionCookie(res, token)`, `clearSessionCookie(res)`, `requireSession(req)`, `requireOwner(session)`, `requireEditor(session)` (owner|staff), `checkOrigin(req)`.

- [ ] **Failing tests** (`tests/auth.test.js`): hash→verify roundtrip (correct pw true, wrong false); `signSession`→`verifySession` returns payload; tampered/expired token → null; `requireOwner` throws/false for staff.
- [ ] Run: `node --test tests/auth.test.js` → FAIL.
- [ ] Implement `api/_lib/auth.js`:

```js
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const COOKIE = 'dmb_session'
const MAX_AGE = 60 * 60 * 24 * 7
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || '')

export async function hashPassword(pw) {
  return bcrypt.hash(String(pw), 12)
}
export async function verifyPassword(pw, hash) {
  return bcrypt.compare(String(pw), hash || '')
}
export async function signSession(user) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}
export async function verifySession(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return { id: payload.sub, role: payload.role }
  } catch {
    return null
  }
}
export function readSessionCookie(req) {
  const raw = req.headers.cookie || ''
  const m = raw.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : null
}
export function setSessionCookie(res, token) {
  res.setHeader('set-cookie', `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`)
}
export function clearSessionCookie(res) {
  res.setHeader('set-cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`)
}
export async function requireSession(req) {
  const session = await verifySession(readSessionCookie(req))
  if (!session) return { ok: false, status: 401, error: 'Belum login' }
  return { ok: true, session }
}
export function requireOwner(session) {
  return session && session.role === 'owner'
}
export function requireEditor(session) {
  return session && (session.role === 'owner' || session.role === 'staff')
}
// CSRF defense-in-depth: same-origin check for mutations.
export function checkOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true // non-browser / same-origin fetch without Origin
  const host = req.headers.host
  try { return new URL(origin).host === host } catch { return false }
}
```

- [ ] Run tests → PASS. Commit: `feat: auth core (bcrypt + jose session) with tests`

---

## Task 3: Staff data-access (`api/_lib/staff.js`) + tests

**Files:** Create `api/_lib/staff.js`; Test `tests/staff-dataaccess.test.js`.

**Produces:** `shapeStaff(row)` (no hash), `validateStaffInput(data, {requirePassword})`, `listStaff(sql)`, `getByEmail(sql,email)`, `getById(sql,id)`, `createStaff(sql,data)`, `updateStaff(sql,id,data)`, `deleteStaff(sql,id,actingId)`, `setPassword(sql,id,hash)`, `countOwners(sql)`, `recordFail/clearFail/isLocked` helpers.

- [ ] **Failing tests**: `shapeStaff` omits `password_hash`; `validateStaffInput` rejects bad email / short password / bad role; accepts valid.
- [ ] Implement `api/_lib/staff.js`. Key rules:
  - `shapeStaff` returns `{ id, name, job, email, role, createdAt }` — NEVER `password_hash`.
  - `validateStaffInput`: email lower-cased + format check; role in `['owner','staff']`; password ≥ 8 when required.
  - `deleteStaff`: throw/deny if `id === actingId` (self) or if the target is the last `owner` (use `countOwners`).
  - Email uniqueness handled by DB constraint; surface a clean error on conflict.
- [ ] Run tests → PASS. Commit: `feat: staff data-access with guards + tests`

---

## Task 4: Auth endpoints

**Files:** Create `api/admin/login.js`, `api/admin/logout.js`, `api/admin/me.js`, `api/admin/change-password.js`.

- [ ] `login`: `requireAppTarget` (APP_TARGET==='admin' else 404) → read body → `getByEmail` → if `isLocked` return 423/401 generic → `verifyPassword`; on fail `recordFail` + generic 401; on success `clearFail`, `signSession`, `setSessionCookie`, return `{ user: shapeStaff }`.
- [ ] `logout`: `clearSessionCookie`, return `{ ok: true }`.
- [ ] `me`: `requireSession` → `getById` → return `{ user }` or 401.
- [ ] `change-password`: `requireSession` → verify `currentPassword` → validate + hash `newPassword` → `setPassword`.
- [ ] (No live DB here; verify build + `node --check`.) Commit: `feat: auth endpoints (login/logout/me/change-password)`

---

## Task 5: User-management endpoints (owner-only)

**Files:** Create `api/admin/users/index.js` (GET list, POST create), `api/admin/users/[id].js` (PUT edit, DELETE), `api/admin/users/[id]/reset-password.js` (POST).

- [ ] Each handler: `requireSession` + `requireOwner` (403 if not owner) + `checkOrigin` on mutations.
- [ ] POST create: `validateStaffInput({requirePassword:true})` → `hashPassword` → `createStaff`; return `shapeStaff` (no hash).
- [ ] PUT edit: `validateStaffInput({requirePassword:false})` → `updateStaff` (name/job/email/role).
- [ ] DELETE: `deleteStaff(sql, id, session.id)` (guards self + last owner) → 400 with message if blocked.
- [ ] reset-password: validate `newPassword` → `hashPassword` → `setPassword`.
- [ ] Commit: `feat: owner-only user-management endpoints`

---

## Task 6: Product writes require a session (retire the secret)

**Files:** Modify `api/admin/products/index.js`, `api/admin/products/[id].js`; Modify `api/_lib/http.js` (drop/replace `requireAdmin`).

- [ ] Replace `requireAdmin(req)` (APP_TARGET + `x-admin-secret`) with: `APP_TARGET` 404 gate (keep) + `requireSession(req)` + `requireEditor(session)` (viewer → 403) + `checkOrigin`. Reads stay open to any session.
- [ ] Remove `x-admin-secret` reliance.
- [ ] Update `tests/http.test.js` accordingly (or move auth-gate tests to `auth.test.js`).
- [ ] Run `npm test` → green. Commit: `refactor: product writes require a valid session`

---

## Task 7: Seed first owner

**Files:** Create `db/seed-staff.mjs`.

- [ ] Reads `OWNER_EMAIL` + `OWNER_PASSWORD`; runs migration `002_staff.sql` (split-by-`;` like the product seed); if `staff` empty, insert one owner with `hashPassword`. Idempotent (skip if any staff exists). Logs `owner seeded` / `owner exists`.
- [ ] `node --check db/seed-staff.mjs`. Commit: `feat: seed first owner script`

---

## Task 8: Admin AuthContext → server session

**Files:** Modify `src/context/AuthContext.jsx`; Modify `src/lib/adminApi.js`.

- [ ] AuthContext: remove the `VITE_ADMIN_*` account logic. Implement:
  - `login(email, password)` → `POST /api/admin/login` (`credentials:'include'`) → set `currentUser`.
  - on mount `useEffect` → `GET /api/admin/me` → set `currentUser` or null; expose `loading`.
  - `logout()` → `POST /api/admin/logout` → clear `currentUser`.
  - `isLoggedIn = !!currentUser`, `isAdmin = !!currentUser`, `isOwner = currentUser?.role === 'owner'`.
- [ ] `adminApi`: every request adds `credentials: 'include'`; remove `x-admin-secret` header + `VITE_ADMIN_SECRET`.
- [ ] Storefront `AuthContext` usage is admin-only now; ensure storefront build still compiles (AuthProvider still used for CATALOG_ONLY-off customer login path — leave that path, it uses the store users, unaffected). Verify both builds.
- [ ] Commit: `feat: admin auth uses server session`

---

## Task 9: "Kelola Staff" page + route + sidebar (owner-only)

**Files:** Create `src/pages/admin/StaffPage.jsx`; Modify `src/AdminApp.jsx` (route), `src/components/admin/Sidebar.jsx` (nav item), `src/pages/admin/ProductsPage.jsx` + `src/pages/admin/ProductFormPage.jsx` (viewer read-only), and add `src/lib/staffApi.js`.

- [ ] `staffApi.js`: `listStaff`, `createStaff`, `updateStaff`, `deleteStaff`, `resetPassword` — all `credentials:'include'`, throw on non-2xx.
- [ ] `StaffPage`: table (nama, jabatan, email, role) + **Tambah** (modal: nama, jabatan, email, **role select: owner / staff / viewer**, password) + **Edit** (same modal without password) + **Hapus** (confirm) + **Reset Password** (modal: new password). Match admin theme (`adm-card`, tokens, 12px radius). Show server error messages (e.g. "email sudah dipakai", "tidak bisa hapus owner terakhir").
- [ ] `AdminApp.jsx`: add `<Route path="staff" element={<StaffPage />} />` under `/admin`. Guard: if `!isOwner`, redirect to `/admin`.
- [ ] `Sidebar.jsx`: add **Staff** item, shown only when `isOwner`.
- [ ] **Viewer read-only**: in `ProductsPage`, hide "Tambah Produk"/Import + the edit/delete/publish row actions when `!isEditor`; in `ProductFormPage`, if `!isEditor` render fields read-only and hide the save bar (or redirect to `/admin/products`). Server already enforces (403) — this just removes dead controls.
- [ ] Verify `npm run build:admin`. Commit: `feat: Kelola Staff (user management) page`

---

## Task 10: Dev bridge + local env

**Files:** Modify `dev/api-bridge.js`; note `.env.local` additions.

- [ ] Add the new routes to the bridge `ROUTES`: `/api/admin/login`, `/logout`, `/me`, `/change-password`, `/api/admin/users` (+ `/[id]`, `/[id]/reset-password`). Ensure cookies pass through (the bridge already forwards `req`/`res`, so `req.headers.cookie` and `res.setHeader('set-cookie')` work; `Secure` cookies are dropped by browsers on http://localhost — for local dev, set the cookie without `Secure` when `process.env.NODE_ENV !== 'production'`).
- [ ] In `auth.js` `setSessionCookie`, omit `Secure` when not production (localhost is http). Keep `HttpOnly; SameSite=Strict`.
- [ ] `.env.local` (local dev): add `SESSION_SECRET=devsecret-long-random`, `OWNER_EMAIL`, `OWNER_PASSWORD`. Run `node --env-file=.env.local db/seed-staff.mjs` to create the local owner.
- [ ] Commit: `feat: dev bridge routes for auth + non-Secure cookie on localhost`

---

## Task 11: Full-flow verification + docs

**Files:** Modify `docs/deployment.md` (env changes).

- [ ] `npm test` all green; `npm run build` + `npm run build:admin` succeed.
- [ ] Manual (local, `dev:admin` + seeded owner): login as owner → dashboard; open Kelola Staff → add a `staff` user → log out → log in as that staff → confirm no Staff menu, can edit products, cannot hit user endpoints (403); reset the staff password as owner → re-login works; delete guard (can't delete self / last owner).
- [ ] Product write while logged out → 401; while logged in → ok.
- [ ] Update `docs/deployment.md`: admin env now `DATABASE_URL`, `APP_TARGET=admin`, `SESSION_SECRET`, `OWNER_EMAIL`, `OWNER_PASSWORD`; removed `VITE_ADMIN_*` + `ADMIN_API_SECRET`. Note running `db/seed-staff.mjs` once.
- [ ] Commit: `docs: staff auth env + seed`

---

## Self-Review notes

- Spec coverage: table (T1), password+session core (T2), staff CRUD+guards (T3/T5), auth endpoints (T4), product-write session gate (T6), owner seed (T7), frontend auth (T8), user-management UI (T9), dev bridge (T10), verify+docs (T11).
- Security: bcrypt(12), HttpOnly+Secure+SameSite=Strict cookie, Origin check, role gates, lockout, no-enumeration, self/last-owner guards — all mapped to tasks.
- Deploy note (post-merge): set new admin env vars, remove old ones, run `seed-staff.mjs` once, then redeploy.
