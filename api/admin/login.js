import { getSql } from '../_lib/db.js'
import { getByEmail, isLocked, recordFail, clearFail, shapeStaff } from '../_lib/staff.js'
import { verifyPassword, signSession, setSessionCookie } from '../_lib/auth.js'
import { json } from '../_lib/http.js'

const GENERIC_ERROR = 'Email atau password salah'

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
    const { email, password } = await readBody(req)
    if (!email || !password) return json(res, 400, { error: 'Email dan password wajib diisi' })

    const sql = getSql()
    const row = await getByEmail(sql, email)
    if (!row) return json(res, 401, { error: GENERIC_ERROR })

    if (isLocked(row)) return json(res, 423, { error: GENERIC_ERROR })

    const valid = await verifyPassword(password, row.password_hash)
    if (!valid) {
      await recordFail(sql, row.id)
      return json(res, 401, { error: GENERIC_ERROR })
    }

    await clearFail(sql, row.id)
    const token = await signSession({ id: row.id, role: row.role })
    setSessionCookie(res, token)
    return json(res, 200, { user: shapeStaff(row) })
  } catch (e) {
    return json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
