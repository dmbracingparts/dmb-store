import { getSql } from '../_lib/db.js'
import { getById, setPassword } from '../_lib/staff.js'
import { requireSession, checkOrigin, verifyPassword, hashPassword } from '../_lib/auth.js'
import { json } from '../_lib/http.js'

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString() || '{}')
}

export default async function handler(req, res) {
  if (process.env.APP_TARGET !== 'admin') return json(res, 404, { error: 'Not found' })
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const auth = await requireSession(req)
    if (!auth.ok) return json(res, auth.status, { error: auth.error })

    if (!checkOrigin(req)) return json(res, 403, { error: 'Forbidden' })

    const { currentPassword, newPassword } = await readBody(req)

    const row = await getById(getSql(), auth.session.id)
    if (!row) return json(res, 401, { error: 'Belum login' })

    const valid = await verifyPassword(currentPassword, row.password_hash)
    if (!valid) return json(res, 400, { error: 'Password lama salah' })

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return json(res, 400, { error: 'Password minimal 8 karakter' })
    }

    const hash = await hashPassword(newPassword)
    await setPassword(getSql(), row.id, hash)
    return json(res, 200, { ok: true })
  } catch (e) {
    return json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
