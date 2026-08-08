import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, PencilSimple, Trash, Key, X } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/admin/PageHeader'
import { AdminButton, AdminInput, AdminSelect, Field } from '../../components/admin/ui/FormControls'
import { listStaff, createStaff, updateStaff, deleteStaff, resetPassword } from '../../lib/staffApi'

const ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Viewer' },
]

const ROLE_BADGE = {
  owner: { color: 'var(--adm-instock-text)', background: 'var(--adm-instock-bg)', borderColor: 'var(--adm-instock-border)' },
  staff: { color: 'var(--adm-info)', background: 'color-mix(in srgb, var(--adm-info) 10%, white)', borderColor: 'color-mix(in srgb, var(--adm-info) 30%, white)' },
  viewer: { color: 'var(--adm-lowstock-text)', background: 'var(--adm-lowstock-bg)', borderColor: 'var(--adm-lowstock-border)' },
}

function RoleBadge({ role }) {
  const style = ROLE_BADGE[role] || ROLE_BADGE.viewer
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-[100px] border px-2.5 py-0.5 text-[14px] capitalize" style={style}>
      {role}
    </span>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="adm-card w-full max-w-md p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-[18px] font-medium text-black">{title}</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full hover:bg-[var(--adm-bg)]" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// Add/Edit form modal. Password field only shows when creating (`isNew`).
function StaffFormModal({ isNew, initial, onClose, onSaved }) {
  const [name, setName] = useState(initial?.name || '')
  const [job, setJob] = useState(initial?.job || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [role, setRole] = useState(initial?.role || 'staff')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isNew) {
        await createStaff({ name, job, email, role, password })
      } else {
        await updateStaff(initial.id, { name, job, email, role })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isNew ? 'Tambah Staff' : 'Edit Staff'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nama" required>
          <AdminInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" required />
        </Field>
        <Field label="Jabatan">
          <AdminInput value={job} onChange={(e) => setJob(e.target.value)} placeholder="Contoh: Kasir" />
        </Field>
        <Field label="Email" required>
          <AdminInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required />
        </Field>
        <Field label="Role" required>
          <AdminSelect value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </AdminSelect>
        </Field>
        {isNew && (
          <Field label="Password" required hint="Minimal 8 karakter">
            <AdminInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={8} />
          </Field>
        )}
        {error && <p className="text-[13px] text-[var(--adm-danger)]">{error}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <AdminButton type="button" variant="secondary" onClick={onClose}>Batal</AdminButton>
          <AdminButton type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</AdminButton>
        </div>
      </form>
    </ModalShell>
  )
}

function ResetPasswordModal({ staff, onClose, onSaved }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await resetPassword(staff.id, password)
      setSuccess(true)
      setTimeout(onSaved, 900)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={`Reset Password — ${staff.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Password baru" required hint="Minimal 8 karakter">
          <AdminInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password baru" required minLength={8} />
        </Field>
        {error && <p className="text-[13px] text-[var(--adm-danger)]">{error}</p>}
        {success && <p className="text-[13px] text-[var(--adm-instock-text)]">Password berhasil direset.</p>}
        <div className="mt-2 flex justify-end gap-2">
          <AdminButton type="button" variant="secondary" onClick={onClose}>Batal</AdminButton>
          <AdminButton type="submit" disabled={saving || success}>{saving ? 'Menyimpan…' : 'Reset Password'}</AdminButton>
        </div>
      </form>
    </ModalShell>
  )
}

function StaffPageInner() {
  const { currentUser } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formModal, setFormModal] = useState(null) // { isNew, initial } | null
  const [resetModal, setResetModal] = useState(null) // staff row | null
  const [confirmDel, setConfirmDel] = useState(null) // staff row | null
  const [deleteError, setDeleteError] = useState('')

  const refresh = () => {
    setLoading(true)
    setLoadError('')
    return listStaff()
      .then(setStaff)
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  const closeForm = () => setFormModal(null)
  const onSaved = () => {
    closeForm()
    refresh()
  }

  const doDelete = async () => {
    setDeleteError('')
    try {
      await deleteStaff(confirmDel.id)
      setConfirmDel(null)
      refresh()
    } catch (err) {
      setDeleteError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] p-6 lg:p-8">
      <PageHeader title="Kelola Staff" subtitle="Atur akun & akses tim yang mengelola toko kamu.">
        <AdminButton onClick={() => setFormModal({ isNew: true, initial: null })}>
          <Plus size={18} weight="bold" /> Tambah Staff
        </AdminButton>
      </PageHeader>

      <div className="adm-card flex flex-col gap-6 p-6">
        <p className="text-[20px] font-medium text-black">Semua Staff</p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="rounded-[12px] bg-[var(--adm-bg)] text-[16px] text-[var(--adm-muted)]">
                <th className="rounded-l-[12px] py-4 pl-6 font-normal">Nama</th>
                <th className="py-4 font-normal">Jabatan</th>
                <th className="py-4 font-normal">Email</th>
                <th className="py-4 font-normal">Role</th>
                <th className="rounded-r-[12px] py-4 pr-6 font-normal">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[var(--adm-muted)]">Memuat…</td>
                </tr>
              )}
              {!loading && loadError && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[var(--adm-danger)]">{loadError}</td>
                </tr>
              )}
              {!loading && !loadError && staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[var(--adm-muted)]">Belum ada staff.</td>
                </tr>
              )}
              {!loading && !loadError && staff.map((s) => (
                <tr key={s.id} className="rounded-[12px]">
                  <td className="py-3.5 pl-6 text-[16px] text-black">
                    {s.name}
                    {s.id === currentUser?.id && <span className="ml-2 text-[12px] text-[var(--adm-muted)]">(kamu)</span>}
                  </td>
                  <td className="py-3.5 pr-4 text-[16px] text-black">{s.job || '—'}</td>
                  <td className="py-3.5 pr-4 text-[16px] text-black">{s.email}</td>
                  <td className="py-3.5 pr-4">
                    <RoleBadge role={s.role} />
                  </td>
                  <td className="py-3.5 pr-6">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFormModal({ isNew: false, initial: s })}
                        className="flex size-10 items-center justify-center rounded-full border border-[var(--adm-border)] bg-white text-black hover:bg-[var(--adm-bg)]"
                        aria-label="Edit"
                      >
                        <PencilSimple size={20} />
                      </button>
                      <button
                        onClick={() => setResetModal(s)}
                        className="flex size-10 items-center justify-center rounded-full border border-[var(--adm-border)] bg-white text-black hover:bg-[var(--adm-bg)]"
                        aria-label="Reset Password"
                      >
                        <Key size={20} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('')
                          setConfirmDel(s)
                        }}
                        className="flex size-10 items-center justify-center rounded-full border border-[var(--adm-border)] bg-white text-black hover:bg-[var(--adm-bg)]"
                        aria-label="Hapus"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formModal && (
        <StaffFormModal
          isNew={formModal.isNew}
          initial={formModal.initial}
          onClose={closeForm}
          onSaved={onSaved}
        />
      )}

      {resetModal && (
        <ResetPasswordModal
          staff={resetModal}
          onClose={() => setResetModal(null)}
          onSaved={() => setResetModal(null)}
        />
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDel(null)}>
          <div className="adm-card w-full max-w-sm p-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 pb-0">
              <span className="flex size-11 items-center justify-center rounded-full bg-[var(--adm-outstock-bg)] text-[var(--adm-danger)]">
                <Trash size={20} />
              </span>
              <button onClick={() => setConfirmDel(null)} className="flex size-8 items-center justify-center rounded-full hover:bg-[var(--adm-bg)]" aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 pb-6 pt-4">
              <h2 className="text-[18px] font-medium text-black">Hapus Staff</h2>
              <p className="mt-2 text-[14px] text-[var(--adm-muted)]">
                Tindakan ini tidak bisa dibatalkan. Yakin mau hapus "{confirmDel.name}"?
              </p>
              {deleteError && <p className="mt-2 text-[13px] text-[var(--adm-danger)]">{deleteError}</p>}
            </div>
            <div className="h-px bg-[var(--adm-border)]" />
            <div className="flex justify-end gap-2 p-4">
              <AdminButton variant="secondary" onClick={() => setConfirmDel(null)}>Batal</AdminButton>
              <AdminButton variant="danger" onClick={doDelete}>Hapus</AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Owner-only gate — everyone else bounces to the dashboard.
export default function StaffPage() {
  const { isOwner, loading } = useAuth()
  if (loading) return null
  if (!isOwner) return <Navigate to="/admin" replace />
  return <StaffPageInner />
}
