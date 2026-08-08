import { getSql } from '../_lib/db.js'
import { getById, shapeStaff } from '../_lib/staff.js'
import { requireSession } from '../_lib/auth.js'
import { json } from '../_lib/http.js'

export default async function handler(req, res) {
  if (process.env.APP_TARGET !== 'admin') return json(res, 404, { error: 'Not found' })
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  try {
    const auth = await requireSession(req)
    if (!auth.ok) return json(res, auth.status, { error: auth.error })

    const row = await getById(getSql(), auth.session.id)
    if (!row) return json(res, 401, { error: 'Belum login' })

    return json(res, 200, { user: shapeStaff(row) })
  } catch (e) {
    return json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
