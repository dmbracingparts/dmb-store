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
