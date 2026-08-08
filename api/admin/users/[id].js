import { getSql } from '../../_lib/db.js'
import { updateStaff, deleteStaff, validateStaffInput } from '../../_lib/staff.js'
import { requireSession, requireOwner, checkOrigin } from '../../_lib/auth.js'
import { json } from '../../_lib/http.js'

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  return JSON.parse(Buffer.concat(chunks).toString() || '{}')
}

export default async function handler(req, res) {
  if (process.env.APP_TARGET !== 'admin') return json(res, 404, { error: 'Not found' })
  const auth = await requireSession(req)
  if (!auth.ok) return json(res, auth.status, { error: auth.error })
  if (!requireOwner(auth.session)) return json(res, 403, { error: 'Khusus owner' })

  const id = req.query?.id || new URL(req.url, 'http://x').pathname.split('/').pop()

  try {
    if (req.method === 'PUT') {
      if (!checkOrigin(req)) return json(res, 403, { error: 'Origin tidak valid' })
      const v = validateStaffInput(await readBody(req), { requirePassword: false })
      if (!v.ok) return json(res, 400, { error: v.error })
      try {
        const user = await updateStaff(getSql(), id, {
          name: v.value.name,
          job: v.value.job,
          email: v.value.email,
          role: v.value.role,
        })
        if (!user) return json(res, 404, { error: 'Staff tidak ditemukan' })
        return json(res, 200, { user })
      } catch (e) {
        if (e && e.code === '23505') return json(res, 400, { error: 'Email sudah dipakai' })
        throw e
      }
    }
    if (req.method === 'DELETE') {
      if (!checkOrigin(req)) return json(res, 403, { error: 'Origin tidak valid' })
      const r = await deleteStaff(getSql(), id, auth.session.id)
      if (!r.ok) return json(res, 400, { error: r.error })
      return json(res, 200, { ok: true })
    }
    return json(res, 405, { error: 'Method not allowed' })
  } catch (e) {
    return json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
