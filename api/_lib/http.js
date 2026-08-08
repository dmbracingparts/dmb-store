import { requireSession, requireEditor } from './auth.js'

export function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

// Admin write endpoints only exist on the admin deployment (APP_TARGET=admin)
// and require a valid editor (administrator|inputer) session. On the storefront
// deployment this returns 404 so the endpoint appears not to exist.
export async function requireEditorSession(req) {
  if (process.env.APP_TARGET !== 'admin') return { ok: false, status: 404, error: 'Not found' }
  const auth = await requireSession(req)
  if (!auth.ok) return auth
  if (!requireEditor(auth.session)) return { ok: false, status: 403, error: 'Tidak punya akses' }
  return { ok: true, session: auth.session }
}
