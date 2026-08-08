import { getSql } from '../../../_lib/db.js'
import { getById, setPassword } from '../../../_lib/staff.js'
import { requireSession, requireAdministrator, checkOrigin, hashPassword, signSession, setSessionCookie } from '../../../_lib/auth.js'
import { json } from '../../../_lib/http.js'

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString() || '{}')
}

export default async function handler(req, res) {
  if (process.env.APP_TARGET !== 'admin') return json(res, 404, { error: 'Not found' })
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const auth = await requireSession(req)
  if (!auth.ok) return json(res, auth.status, { error: auth.error })
  if (!requireAdministrator(auth.session)) return json(res, 403, { error: 'Khusus administrator' })
  if (!checkOrigin(req)) return json(res, 403, { error: 'Origin tidak valid' })

  const id = req.query?.id || new URL(req.url, 'http://x').pathname.split('/').slice(-2, -1)[0]

  try {
    const { newPassword } = await readBody(req)
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return json(res, 400, { error: 'Password minimal 8 karakter' })
    }
    const hash = await hashPassword(newPassword)
    const ok = await setPassword(getSql(), id, hash)
    if (!ok) return json(res, 404, { error: 'User tidak ditemukan' })
    // Resetting your own password also bumped your token_version; re-issue this
    // session's cookie so the admin stays logged in (other sessions revoked).
    if (id === auth.session.id) {
      const fresh = await getById(getSql(), id)
      if (fresh) setSessionCookie(res, await signSession(fresh))
    }
    return json(res, 200, { ok: true })
  } catch (e) {
    console.error('reset-password', e)
    return json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
