process.env.SESSION_SECRET = 'test-secret-0123456789'

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SignJWT } from 'jose'
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
  requireOwner,
  requireEditor,
} from '../api/_lib/auth.js'

test('hashPassword/verifyPassword roundtrip', async () => {
  const hash = await hashPassword('correct-horse')
  assert.equal(await verifyPassword('correct-horse', hash), true)
  assert.equal(await verifyPassword('wrong-password', hash), false)
})

test('signSession/verifySession roundtrip', async () => {
  const token = await signSession({ id: 42, role: 'owner' })
  const payload = await verifySession(token)
  assert.equal(payload.id, '42')
  assert.equal(payload.role, 'owner')
})

test('verifySession returns null for tampered token', async () => {
  const token = await signSession({ id: 1, role: 'staff' })
  const tampered = token.slice(0, -2) + (token.slice(-2) === 'aa' ? 'bb' : 'aa')
  assert.equal(await verifySession(tampered), null)
})

test('verifySession returns null for expired token', async () => {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
  const expired = await new SignJWT({ role: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('1')
    .setIssuedAt(Math.floor(Date.now() / 1000) - 1000)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 500)
    .sign(secret)
  assert.equal(await verifySession(expired), null)
})

test('verifySession returns null for missing token', async () => {
  assert.equal(await verifySession(null), null)
  assert.equal(await verifySession(undefined), null)
})

test('requireOwner true only for owner role', () => {
  assert.equal(requireOwner({ id: '1', role: 'owner' }), true)
  assert.equal(requireOwner({ id: '1', role: 'staff' }), false)
  assert.equal(requireOwner(null), false)
})

test('requireEditor true for owner and staff, false otherwise', () => {
  assert.equal(requireEditor({ id: '1', role: 'owner' }), true)
  assert.equal(requireEditor({ id: '1', role: 'staff' }), true)
  assert.equal(requireEditor({ id: '1', role: 'viewer' }), false)
  assert.equal(requireEditor(null), false)
})
