async function send(url, method, data) {
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request gagal (${res.status})`)
  return body
}

export async function listStaff() {
  return (await send('/api/admin/users', 'GET')).users
}
export async function createStaff(data) {
  return (await send('/api/admin/users', 'POST', data)).user
}
export async function updateStaff(id, data) {
  return (await send(`/api/admin/users/${id}`, 'PUT', data)).user
}
export async function deleteStaff(id) {
  return (await send(`/api/admin/users/${id}`, 'DELETE')).ok
}
export async function resetPassword(id, newPassword) {
  return (await send(`/api/admin/users/${id}/reset-password`, 'POST', { newPassword })).ok
}
