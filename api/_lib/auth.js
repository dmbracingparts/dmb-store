import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { getSql } from './db.js'
import { getById } from './staff.js'

const COOKIE = 'dmb_session'
const MAX_AGE = 60 * 60 * 24 * 7
const secret = () => {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(s)
}

export async function hashPassword(pw) {
  return bcrypt.hash(String(pw), 12)
}
export async function verifyPassword(pw, hash) {
  return bcrypt.compare(String(pw), hash || '')
}
export async function signSession(user) {
  return new SignJWT({ role: user.role, tv: user.token_version ?? 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}
export async function verifySession(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    return { id: payload.sub, role: payload.role, tv: payload.tv }
  } catch {
    return null
  }
}
export function readSessionCookie(req) {
  const raw = req.headers.cookie || ''
  const m = raw.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`))
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return null
  }
}
// Secure is required in production (HTTPS) but breaks cookies on http://localhost
// during dev, so it's omitted when not production. HttpOnly + SameSite=Strict stay.
const SECURE = () => (process.env.NODE_ENV === 'production' ? ' Secure;' : '')
export function setSessionCookie(res, token) {
  res.setHeader('set-cookie', `${COOKIE}=${encodeURIComponent(token)}; HttpOnly;${SECURE()} SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`)
}
export function clearSessionCookie(res) {
  res.setHeader('set-cookie', `${COOKIE}=; HttpOnly;${SECURE()} SameSite=Strict; Path=/; Max-Age=0`)
}
// Validates the session against the database, not just the JWT signature:
//  - the account must still exist (deleted users are logged out immediately),
//  - the token's version must match the row's current token_version (bumped on
//    every password change/reset, so old sessions die), and
//  - the role is taken LIVE from the row, so a demotion applies on the next
//    request instead of lingering until the 7-day token expires.
// `sql` is injectable so the http gates can be unit-tested without a database.
export async function requireSession(req, sql = getSql()) {
  const payload = await verifySession(readSessionCookie(req))
  if (!payload) return { ok: false, status: 401, error: 'Belum login' }
  let row
  try {
    row = await getById(sql, payload.id)
  } catch {
    return { ok: false, status: 500, error: 'Terjadi kesalahan pada server' }
  }
  if (!row || row.token_version !== payload.tv) {
    return { ok: false, status: 401, error: 'Sesi berakhir, silakan masuk lagi' }
  }
  return { ok: true, session: { id: row.id, role: row.role } }
}
export function requireAdministrator(session) {
  return !!session && session.role === 'administrator'
}
export function requireEditor(session) {
  return !!session && (session.role === 'administrator' || session.role === 'inputer')
}
// CSRF defense-in-depth: same-origin check for mutations.
export function checkOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true // non-browser / same-origin fetch without Origin
  const host = req.headers.host
  try { return new URL(origin).host === host } catch { return false }
}
