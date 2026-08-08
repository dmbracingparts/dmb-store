import { getSql } from '../../_lib/db.js'
import { listStaff, createStaff, validateStaffInput } from '../../_lib/staff.js'
import { requireSession, requireOwner, checkOrigin, hashPassword } from '../../_lib/auth.js'
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

  try {
    if (req.method === 'GET') {
      const users = await listStaff(getSql())
      return json(res, 200, { users })
    }
    if (req.method === 'POST') {
      if (!checkOrigin(req)) return json(res, 403, { error: 'Origin tidak valid' })
      const v = validateStaffInput(await readBody(req), { requirePassword: true })
      if (!v.ok) return json(res, 400, { error: v.error })
      try {
        const passwordHash = await hashPassword(v.value.password)
        const user = await createStaff(getSql(), {
          name: v.value.name,
          job: v.value.job,
          email: v.value.email,
          role: v.value.role,
          passwordHash,
        })
        return json(res, 201, { user })
      } catch (e) {
        if (e && e.code === '23505') return json(res, 400, { error: 'Email sudah dipakai' })
        throw e
      }
    }
    return json(res, 405, { error: 'Method not allowed' })
  } catch (e) {
    return json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
