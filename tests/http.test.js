import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requireEditorSession, requireAdminSession } from '../api/_lib/http.js'
import { signSession } from '../api/_lib/auth.js'

process.env.SESSION_SECRET = 'test-secret-0123456789'

test('requireEditorSession fails when APP_TARGET is not admin', async () => {
  delete process.env.APP_TARGET
  const r = await requireEditorSession({ headers: {} })
  assert.equal(r.ok, false)
  assert.equal(r.status, 404)
})

test('requireEditorSession fails with no session cookie', async () => {
  process.env.APP_TARGET = 'admin'
  const r = await requireEditorSession({ headers: {} })
  assert.equal(r.ok, false)
  assert.equal(r.status, 401)
})

test('requireEditorSession fails for a viewer session', async () => {
  process.env.APP_TARGET = 'admin'
  const token = await signSession({ id: 'x', role: 'viewer' })
  const r = await requireEditorSession({ headers: { cookie: `dmb_session=${token}` } })
  assert.equal(r.ok, false)
  assert.equal(r.status, 403)
})

test('requireEditorSession passes for an inputer session', async () => {
  process.env.APP_TARGET = 'admin'
  const token = await signSession({ id: 'x', role: 'inputer' })
  const r = await requireEditorSession({ headers: { cookie: `dmb_session=${token}` } })
  assert.equal(r.ok, true)
})

test('requireEditorSession passes for an administrator session', async () => {
  process.env.APP_TARGET = 'admin'
  const token = await signSession({ id: 'x', role: 'administrator' })
  const r = await requireEditorSession({ headers: { cookie: `dmb_session=${token}` } })
  assert.equal(r.ok, true)
})

test('requireAdminSession 404s off the admin deployment', async () => {
  delete process.env.APP_TARGET
  const r = await requireAdminSession({ headers: {} })
  assert.equal(r.ok, false)
  assert.equal(r.status, 404)
})

test('requireAdminSession allows a viewer (read-only) but requireEditorSession does not', async () => {
  process.env.APP_TARGET = 'admin'
  const token = await signSession({ id: 'x', role: 'viewer' })
  const headers = { cookie: `dmb_session=${token}` }
  assert.equal((await requireAdminSession({ headers })).ok, true)
  assert.equal((await requireEditorSession({ headers })).ok, false)
})

test('requireAdminSession fails with no session cookie', async () => {
  process.env.APP_TARGET = 'admin'
  const r = await requireAdminSession({ headers: {} })
  assert.equal(r.ok, false)
  assert.equal(r.status, 401)
})
