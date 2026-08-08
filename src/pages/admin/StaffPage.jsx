import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, PencilSimple, Trash, Key, X } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { AdminButton, AdminInput, AdminSelect, Field } from '../../components/admin/ui/FormControls'
import { RowSkeleton } from '../../components/admin/ui/Bento'
import { useToast } from '../../components/admin/ui/Toast'
import { listStaff, createStaff, updateStaff, deleteStaff, resetPassword } from '../../lib/staffApi'

const ROLES = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'inputer', label: 'Inputer' },
  { value: 'viewer', label: 'Viewer' },
]

const ROLE_BADGE = {
  administrator: { color: 'var(--adm-instock-text)', background: 'var(--adm-instock-bg)', borderColor: 'var(--adm-instock-border)' },
  inputer: { color: 'var(--adm-info)', background: 'color-mix(in srgb, var(--adm-info) 10%, white)', borderColor: 'color-mix(in srgb, var(--adm-info) 30%, white)' },
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
    <div className="adm-overlay-in fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="adm-card adm-panel-in w-full max-w-md p-0" onClick={(e) => e.stopPropagation()}>
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
  const [role, setRole] = useState(initial?.role || 'inputer')
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
      onSaved(isNew)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isNew ? 'Tambah User' : 'Edit User'} onClose={onClose}>
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
  const toast = useToast()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formModal, setFormModal] = useState(null) // { isNew, initial } | null
  const [resetModal, setResetModal] = useState(null) // staff row | null
  const [confirmDel, setConfirmDel] = useState(null) // staff row | null
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

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
  const onSaved = (isNew) => {
    toast.success(isNew ? 'User ditambahkan' : 'User diperbarui')
    closeForm()
    refresh()
  }

  const onResetSaved = () => {
    toast.success('Password berhasil direset', { description: resetModal?.name })
    setResetModal(null)
  }

  const doDelete = async () => {
    setDeleteError('')
    setDeleting(true)
    try {
      const name = confirmDel.name
      await deleteStaff(confirmDel.id)
      setConfirmDel(null)
      toast.success('User dihapus', { description: name })
      refresh()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="adm-page-in mx-auto flex max-w-[1240px] flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-[var(--adm-ink)]">Kelola User</h1>
          <p className="mt-1 text-[14px] text-[var(--adm-muted)]">Atur akun & akses tim yang mengelola toko kamu.</p>
        </div>
        <AdminButton onClick={() => setFormModal({ isNew: true, initial: null })}>
          <Plus size={18} weight="bold" /> Tambah User
        </AdminButton>
      </div>

      <div className="adm-tile flex flex-col gap-5 p-5">
        <p className="text-[15px] font-semibold text-[var(--adm-ink)]">Semua User</p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="bg-[var(--adm-bg)] text-[13px] font-medium text-[var(--adm-muted)]">
                <th className="rounded-l-[10px] py-3 pl-5 font-medium">Nama</th>
                <th className="py-3 font-medium">Jabatan</th>
                <th className="py-3 font-medium">Email</th>
                <th className="py-3 font-medium">Role</th>
                <th className="rounded-r-[10px] py-3 pr-5 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 3 }, (_, i) => (
                <RowSkeleton key={i} withAvatar={false} cols={['w-28', 'w-16', 'w-32', 'w-20']} />
              ))}
              {!loading && loadError && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[var(--adm-danger)]">{loadError}</td>
                </tr>
              )}
              {!loading && !loadError && staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[var(--adm-muted)]">Belum ada user.</td>
                </tr>
              )}
              {!loading && !loadError && staff.map((s) => (
                <tr key={s.id} className="border-b border-[var(--adm-border)] last:border-0">
                  <td className="py-3 pl-5 text-[14px] font-medium text-[var(--adm-ink)]">
                    {s.name}
                    {s.id === currentUser?.id && <span className="ml-2 text-[12px] font-normal text-[var(--adm-muted)]">(kamu)</span>}
                  </td>
                  <td className="py-3 pr-4 text-[14px] text-[var(--adm-text)]">{s.job || '—'}</td>
                  <td className="py-3 pr-4 text-[14px] text-[var(--adm-text)]">{s.email}</td>
                  <td className="py-3 pr-4">
                    <RoleBadge role={s.role} />
                  </td>
                  <td className="py-3 pr-5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFormModal({ isNew: false, initial: s })}
                        className="flex size-9 items-center justify-center rounded-lg border border-[var(--adm-border)] bg-white text-black hover:bg-[var(--adm-bg)]"
                        aria-label="Edit"
                      >
                        <PencilSimple size={18} />
                      </button>
                      <button
                        onClick={() => setResetModal(s)}
                        className="flex size-9 items-center justify-center rounded-lg border border-[var(--adm-border)] bg-white text-black hover:bg-[var(--adm-bg)]"
                        aria-label="Reset Password"
                      >
                        <Key size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError('')
                          setConfirmDel(s)
                        }}
                        className="flex size-9 items-center justify-center rounded-lg border border-[var(--adm-border)] bg-white text-black hover:bg-[var(--adm-bg)]"
                        aria-label="Hapus"
                      >
                        <Trash size={18} />
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
          onSaved={onResetSaved}
        />
      )}

      {confirmDel && (
        <div className="adm-overlay-in fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setConfirmDel(null)}>
          <div className="adm-card adm-panel-in w-full max-w-sm p-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 pb-0">
              <span className="flex size-11 items-center justify-center rounded-full bg-[var(--adm-outstock-bg)] text-[var(--adm-danger)]">
                <Trash size={20} />
              </span>
              <button onClick={() => setConfirmDel(null)} disabled={deleting} className="flex size-8 items-center justify-center rounded-full hover:bg-[var(--adm-bg)] disabled:opacity-50" aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 pb-6 pt-4">
              <h2 className="text-[18px] font-medium text-black">Hapus User</h2>
              <p className="mt-2 text-[14px] text-[var(--adm-muted)]">
                Tindakan ini tidak bisa dibatalkan. Yakin mau hapus "{confirmDel.name}"?
              </p>
              {deleteError && <p className="mt-2 text-[13px] text-[var(--adm-danger)]">{deleteError}</p>}
            </div>
            <div className="h-px bg-[var(--adm-border)]" />
            <div className="flex justify-end gap-2 p-4">
              <AdminButton variant="secondary" onClick={() => setConfirmDel(null)} disabled={deleting}>Batal</AdminButton>
              <AdminButton variant="danger" onClick={doDelete} disabled={deleting}>
                {deleting ? 'Menghapus…' : 'Hapus'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Administrator-only gate — everyone else bounces to the dashboard.
export default function StaffPage() {
  const { isAdministrator, loading } = useAuth()
  if (loading) return null
  if (!isAdministrator) return <Navigate to="/admin" replace />
  return <StaffPageInner />
}
