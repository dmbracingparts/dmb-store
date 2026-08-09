import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ShieldCheck, Storefront } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { AdminButton, AdminInput, AdminCheckbox, Field } from '../../components/admin/ui/FormControls'
import dmbLogo from '../../assets/logo-dmb.png'
import '../../styles/admin-theme.css'

// Dedicated admin login — Commerly-styled (green/Geist), separate from the
// black/gold customer storefront login. Only owner/admin accounts may pass;
// a customer account is rejected here so the two surfaces stay distinct.
export default function AdminLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.')
      return
    }
    const res = await login(email, password)
    if (!res.ok) {
      setError(res.error)
      return
    }
    navigate(location.state?.from || '/')
  }

  return (
    <div className="admin-theme flex min-h-screen items-center justify-center bg-[var(--adm-bg)] p-4">
      <div className="flex w-full max-w-[960px] overflow-hidden rounded-[16px] border border-[var(--adm-border)] bg-white shadow-[var(--adm-shadow)]">
        {/* Hero panel */}
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[var(--adm-forest-500)] p-10 text-white lg:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-[var(--adm-mint)] opacity-20" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 size-80 rounded-full bg-white opacity-5" />
          <div className="relative flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck size={22} weight="fill" className="text-[var(--adm-mint)]" />
            </span>
            <span className="text-[15px] font-medium">DMB Admin</span>
          </div>
          <div className="relative">
            <h2 className="text-[28px] font-medium leading-tight">Kelola katalog sparepart kamu</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/70">
              Atur produk & kategori, kelola tim — semua langsung tersinkron ke storefront.
            </p>
          </div>
          <p className="relative text-[13px] text-white/50">DMB Moto Shop · Panel Pengelola</p>
        </div>

        {/* Form */}
        <div className="w-full p-8 sm:p-10 lg:w-1/2">
          <img src={dmbLogo} alt="DMB Moto Shop" className="mb-6 h-10 w-auto" />
          <h1 className="text-[24px] font-medium text-black">Masuk ke Dashboard</h1>
          <p className="mt-1 text-[14px] text-[var(--adm-muted)]">Khusus pengelola & admin toko.</p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <Field label="Email">
              <AdminInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dmb.com"
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <AdminInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
              />
            </Field>

            <div className="flex items-center justify-between">
              <AdminCheckbox checked={remember} onChange={setRemember} label="Ingat saya" id="adm-remember" />
              <span className="text-[13px] text-[var(--adm-muted)]">Lupa password?</span>
            </div>

            {error && (
              <div className="rounded-[12px] bg-[var(--adm-danger-bg)] px-4 py-2.5 text-[13px] text-[var(--adm-danger)]">
                {error}
              </div>
            )}

            <AdminButton type="submit" variant="forest" className="w-full">
              Masuk ke Dashboard
            </AdminButton>
          </form>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-[var(--adm-muted)] hover:text-black"
          >
            <Storefront size={16} /> Kembali ke toko
          </Link>
        </div>
      </div>
    </div>
  )
}
