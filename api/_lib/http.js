import { requireSession, requireEditor } from './auth.js'

export function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

// All admin endpoints only exist on the admin deployment (APP_TARGET=admin);
// on the storefront deployment they return 404 so they appear not to exist.

// Read gate: any authenticated staff session, regardless of role. Lets a
// `viewer` load the catalog read-only (the UI already hides every write
// control from non-editors via isEditor).
export async function requireAdminSession(req, sql) {
  if (process.env.APP_TARGET !== 'admin') return { ok: false, status: 404, error: 'Not found' }
  const auth = await requireSession(req, sql)
  if (!auth.ok) return auth
  return { ok: true, session: auth.session }
}

// Write gate: requires a valid editor (administrator|inputer) session.
export async function requireEditorSession(req, sql) {
  const auth = await requireAdminSession(req, sql)
  if (!auth.ok) return auth
  if (!requireEditor(auth.session)) return { ok: false, status: 403, error: 'Tidak punya akses' }
  return { ok: true, session: auth.session }
}
