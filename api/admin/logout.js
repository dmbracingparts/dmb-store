import { clearSessionCookie } from '../_lib/auth.js'
import { json } from '../_lib/http.js'

export default async function handler(req, res) {
  if (process.env.APP_TARGET !== 'admin') return json(res, 404, { error: 'Not found' })
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    clearSessionCookie(res)
    return json(res, 200, { ok: true })
  } catch (e) {
    return json(res, 500, { error: 'Terjadi kesalahan pada server' })
  }
}
