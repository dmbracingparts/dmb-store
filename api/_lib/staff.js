const ROLES = ['administrator', 'inputer', 'viewer']
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const LOCK_MS = 15 * 60 * 1000
const LOCK_THRESHOLD = 5

export function shapeStaff(row) {
  return {
    id: row.id,
    name: row.name,
    job: row.job,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  }
}

export function validateStaffInput(data, { requirePassword = false } = {}) {
  const name = typeof data.name === 'string' ? data.name.trim() : ''
  if (!name) {
    return { ok: false, error: "Field 'name' wajib diisi." }
  }

  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Email tidak valid.' }
  }

  const role = data.role === undefined || data.role === null || data.role === '' ? 'inputer' : data.role
  if (!ROLES.includes(role)) {
    return { ok: false, error: "Field 'role' harus salah satu dari: administrator, inputer, viewer." }
  }

  const job = data.job === undefined || data.job === null || data.job === '' ? null : String(data.job)

  const value = { name, email, role, job }

  if (requirePassword) {
    const password = data.password
    if (typeof password !== 'string' || password.length < 8) {
      return { ok: false, error: 'Password minimal 8 karakter' }
    }
    value.password = password
  }

  return { ok: true, value }
}

export async function listStaff(sql) {
  const rows = await sql`select * from staff order by created_at`
  return rows.map(shapeStaff)
}

export async function getByEmail(sql, email) {
  const rows = await sql`select * from staff where email = ${String(email).toLowerCase()}`
  return rows[0] || null
}

export async function getById(sql, id) {
  const rows = await sql`select * from staff where id = ${id}`
  return rows[0] || null
}

export async function createStaff(sql, { name, job, email, role, passwordHash }) {
  const rows = await sql`insert into staff (name, job, email, role, password_hash)
    values (${name}, ${job ?? null}, ${email}, ${role}, ${passwordHash})
    returning *`
  return shapeStaff(rows[0])
}

export async function updateStaff(sql, id, { name, job, email, role }) {
  const rows = await sql`update staff set
    name = ${name}, job = ${job ?? null}, email = ${email}, role = ${role}, updated_at = now()
    where id = ${id} returning *`
  if (rows.length === 0) return null
  return shapeStaff(rows[0])
}

export async function setPassword(sql, id, passwordHash) {
  await sql`update staff set password_hash = ${passwordHash}, updated_at = now() where id = ${id}`
}

export async function countAdministrators(sql) {
  const rows = await sql`select count(*)::int as count from staff where role = 'administrator'`
  return rows[0].count
}

export async function deleteStaff(sql, id, actingId) {
  if (id === actingId) {
    return { ok: false, error: 'Tidak bisa menghapus akun sendiri' }
  }
  const target = await getById(sql, id)
  if (!target) {
    return { ok: false, error: 'Staff tidak ditemukan' }
  }
  if (target.role === 'administrator') {
    const admins = await countAdministrators(sql)
    if (admins <= 1) {
      return { ok: false, error: 'Tidak bisa menghapus administrator terakhir' }
    }
  }
  await sql`delete from staff where id = ${id}`
  return { ok: true }
}

export async function recordFail(sql, id) {
  const rows = await sql`select failed_attempts from staff where id = ${id}`
  if (rows.length === 0) return
  const attempts = rows[0].failed_attempts + 1
  const lockedUntil = attempts >= LOCK_THRESHOLD ? new Date(Date.now() + LOCK_MS).toISOString() : null
  await sql`update staff set failed_attempts = ${attempts},
    locked_until = coalesce(${lockedUntil}, locked_until), updated_at = now()
    where id = ${id}`
}

export async function clearFail(sql, id) {
  await sql`update staff set failed_attempts = 0, locked_until = null, updated_at = now() where id = ${id}`
}

export function isLocked(row) {
  if (!row || !row.locked_until) return false
  return new Date(row.locked_until).getTime() > Date.now()
}
