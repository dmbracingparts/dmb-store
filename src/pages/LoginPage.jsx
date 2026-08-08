import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import { GoogleIcon, EyeIcon } from '../components/auth/AuthIcons'
import AuthHeroPanel from '../components/auth/AuthHeroPanel'
import logo from '../assets/logo-dmb.png'

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')

  function handleGoogle() {
    loginWithGoogle()
    navigate('/')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.')
      return
    }
    const res = await login(email, password)
    if (res.ok) {
      navigate('/')
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-0 px-4 py-8 lg:p-6">
      <div className="flex w-full max-w-[400px] flex-col lg:w-auto lg:max-w-none lg:flex-row lg:items-stretch lg:gap-2 lg:rounded-3xl lg:border lg:border-neutral-200 lg:p-2">
        {/* Hero panel — desktop only, layout matches Figma node 16191:40659.
            Abstract geometric treatment, not photography — see AuthHeroPanel. */}
        <div className="hidden lg:flex lg:w-[468px] lg:shrink-0">
          <AuthHeroPanel step="01/03" />
        </div>

        {/* Form panel */}
        <div className="flex w-full flex-col justify-center gap-6 lg:w-[468px] lg:p-8">
          <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
            <img src={logo} alt="DMB Moto Shop" className="mb-2 h-12 w-auto lg:hidden" />
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 lg:text-[28px]">
              Selamat datang kembali!
            </h1>
            <p className="max-w-[264px] text-base text-neutral-600 lg:max-w-[264px]">
              Masuk dengan email &amp; password, atau buat akun baru
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            <button
              type="button"
              onClick={handleGoogle}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-pill border border-neutral-200 bg-neutral-0 px-6 text-base font-medium text-neutral-900 shadow-input transition-colors hover:bg-neutral-25"
            >
              <GoogleIcon />
              Masuk dengan Google
            </button>
            <p className="text-sm text-neutral-600">Atau lanjutkan dengan</p>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-neutral-900">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-[10px] border border-neutral-200 bg-neutral-25 px-3 py-2 text-base text-neutral-900 shadow-input placeholder:text-neutral-600 focus:border-primary-600 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-neutral-900">
                    Password
                  </label>
                  <div className="flex h-12 w-full items-center gap-3 rounded-[10px] border border-neutral-200 bg-neutral-25 px-3 py-2 shadow-input focus-within:border-primary-600">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-base text-neutral-900 placeholder:text-neutral-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      className="shrink-0"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-[18px] accent-primary-600"
                  />
                  Ingat saya
                </label>
                <button type="button" className="text-sm font-medium text-neutral-900">
                  Lupa password?
                </button>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" variant="primary" className="w-full !bg-primary-900 hover:!bg-primary-900/90">
                Masuk
              </Button>
            </form>

            <p className="text-sm text-neutral-600">
              Belum punya akun?{' '}
              <Link to="/register" className="font-medium text-neutral-900">
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
