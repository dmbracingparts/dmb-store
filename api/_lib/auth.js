import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

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
export async function requireSession(req) {
  const session = await verifySession(readSessionCookie(req))
  if (!session) return { ok: false, status: 401, error: 'Belum login' }
  return { ok: true, session }
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
