import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requireEditorSession, requireAdminSession } from '../api/_lib/http.js'
import { signSession } from '../api/_lib/auth.js'

process.env.SESSION_SECRET = 'test-secret-0123456789'

// Fake tagged-template `sql` client returning a fixed staff row (or none), so
// the gates can be tested without a real database. requireSession loads the
// row via getById(sql, id) → sql`select ... ${id}`.
const sqlReturning = (row) => () => Promise.resolve(row ? [row] : [])
const row = (over = {}) => ({ id: 'x', role: 'viewer', token_version: 0, ...over })
const reqFor = async (user) => ({ headers: { cookie: `dmb_session=${await signSession(user)}` } })

test('requireEditorSession 404s off the admin deployment', async () => {
  delete process.env.APP_TARGET
  const r = await requireEditorSession({ headers: {} }, sqlReturning(null))
  assert.equal(r.ok, false)
  assert.equal(r.status, 404)
})

test('requireEditorSession 401 with no session cookie', async () => {
  process.env.APP_TARGET = 'admin'
  const r = await requireEditorSession({ headers: {} }, sqlReturning(null))
  assert.equal(r.ok, false)
  assert.equal(r.status, 401)
})

test('requireEditorSession 403 for a viewer', async () => {
  process.env.APP_TARGET = 'admin'
  const req = await reqFor({ id: 'x', role: 'viewer', token_version: 0 })
  const r = await requireEditorSession(req, sqlReturning(row({ role: 'viewer' })))
  assert.equal(r.ok, false)
  assert.equal(r.status, 403)
})

test('requireEditorSession passes for inputer and administrator', async () => {
  process.env.APP_TARGET = 'admin'
  for (const role of ['inputer', 'administrator']) {
    const req = await reqFor({ id: 'x', role, token_version: 0 })
    const r = await requireEditorSession(req, sqlReturning(row({ role })))
    assert.equal(r.ok, true, role)
  }
})

test('requireAdminSession allows a viewer (read-only) but requireEditorSession does not', async () => {
  process.env.APP_TARGET = 'admin'
  const req = await reqFor({ id: 'x', role: 'viewer', token_version: 0 })
  const db = sqlReturning(row({ role: 'viewer' }))
  assert.equal((await requireAdminSession(req, db)).ok, true)
  assert.equal((await requireEditorSession(req, db)).ok, false)
})

test('session is rejected when the account no longer exists', async () => {
  process.env.APP_TARGET = 'admin'
  const req = await reqFor({ id: 'x', role: 'administrator', token_version: 0 })
  const r = await requireAdminSession(req, sqlReturning(null))
  assert.equal(r.ok, false)
  assert.equal(r.status, 401)
})

test('session is rejected when token_version is stale (revoked)', async () => {
  process.env.APP_TARGET = 'admin'
  const req = await reqFor({ id: 'x', role: 'administrator', token_version: 1 })
  // DB has moved on to version 2 (e.g. after a password reset)
  const r = await requireAdminSession(req, sqlReturning(row({ role: 'administrator', token_version: 2 })))
  assert.equal(r.ok, false)
  assert.equal(r.status, 401)
})

test('role is read live from the DB — a demotion applies immediately', async () => {
  process.env.APP_TARGET = 'admin'
  // Token still claims administrator, but the row now says viewer.
  const req = await reqFor({ id: 'x', role: 'administrator', token_version: 0 })
  const r = await requireEditorSession(req, sqlReturning(row({ role: 'viewer', token_version: 0 })))
  assert.equal(r.ok, false)
  assert.equal(r.status, 403)
})
