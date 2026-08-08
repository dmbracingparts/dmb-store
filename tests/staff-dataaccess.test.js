import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shapeStaff, validateStaffInput, isLocked } from '../api/_lib/staff.js'

test('shapeStaff omits password_hash and lockout fields', () => {
  const row = {
    id: 's1', name: 'Budi', job: 'Kasir', email: 'budi@toko.com', role: 'staff',
    password_hash: 'hashed-secret', failed_attempts: 2, locked_until: null,
    created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
  }
  const shaped = shapeStaff(row)
  assert.equal('password_hash' in shaped, false)
  assert.equal('failed_attempts' in shaped, false)
  assert.equal('locked_until' in shaped, false)
  assert.deepEqual(shaped, {
    id: 's1', name: 'Budi', job: 'Kasir', email: 'budi@toko.com', role: 'staff',
    createdAt: '2026-01-01T00:00:00.000Z',
  })
})

test('validateStaffInput rejects empty name', () => {
  const r = validateStaffInput({ name: '', email: 'a@b.com', role: 'staff' }, { requirePassword: false })
  assert.equal(r.ok, false)
})

test('validateStaffInput rejects bad email format', () => {
  const r = validateStaffInput({ name: 'Budi', email: 'not-an-email', role: 'staff' }, { requirePassword: false })
  assert.equal(r.ok, false)
})

test('validateStaffInput rejects short password when required', () => {
  const r = validateStaffInput(
    { name: 'Budi', email: 'a@b.com', role: 'staff', password: 'short' },
    { requirePassword: true },
  )
  assert.equal(r.ok, false)
  assert.equal(r.error, 'Password minimal 8 karakter')
})

test('validateStaffInput rejects missing password when required', () => {
  const r = validateStaffInput({ name: 'Budi', email: 'a@b.com', role: 'staff' }, { requirePassword: true })
  assert.equal(r.ok, false)
})

test('validateStaffInput rejects invalid role', () => {
  const r = validateStaffInput({ name: 'Budi', email: 'a@b.com', role: 'admin' }, { requirePassword: false })
  assert.equal(r.ok, false)
})

test('validateStaffInput accepts a valid input and lower-cases email', () => {
  const r = validateStaffInput(
    { name: 'Budi', email: 'BUDI@Toko.COM', role: 'owner', job: 'Manajer', password: 'longenough' },
    { requirePassword: true },
  )
  assert.equal(r.ok, true)
  assert.equal(r.value.email, 'budi@toko.com')
  assert.equal(r.value.name, 'Budi')
  assert.equal(r.value.role, 'owner')
  assert.equal(r.value.job, 'Manajer')
  assert.equal(r.value.password, 'longenough')
})

test('validateStaffInput defaults role to staff when omitted', () => {
  const r = validateStaffInput({ name: 'Budi', email: 'a@b.com' }, { requirePassword: false })
  assert.equal(r.ok, true)
  assert.equal(r.value.role, 'staff')
})

test('validateStaffInput allows null/omitted job', () => {
  const r = validateStaffInput({ name: 'Budi', email: 'a@b.com' }, { requirePassword: false })
  assert.equal(r.ok, true)
  assert.equal(r.value.job, null)
})

test('isLocked is true when locked_until is in the future', () => {
  const future = new Date(Date.now() + 60_000).toISOString()
  assert.equal(isLocked({ locked_until: future }), true)
})

test('isLocked is false when locked_until is null', () => {
  assert.equal(isLocked({ locked_until: null }), false)
})

test('isLocked is false when locked_until is in the past', () => {
  const past = new Date(Date.now() - 60_000).toISOString()
  assert.equal(isLocked({ locked_until: past }), false)
})
