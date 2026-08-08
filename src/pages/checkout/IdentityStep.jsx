import { useState } from 'react'
import RadioCard from '../../components/ui/RadioCard'
import FormField from '../../components/ui/FormField'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

export default function IdentityStep({ onChooseGuest, onLoggedIn }) {
  const { login, loginWithGoogle } = useAuth()
  const [choice, setChoice] = useState(null) // 'guest' | 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleGuest() {
    setChoice('guest')
    onChooseGuest()
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    const res = await login(email, password)
    if (!res.ok) {
      setError(res.error || 'Gagal masuk. Coba lagi.')
      return
    }
    onLoggedIn()
  }

  function handleGoogle() {
    setError('')
    const res = loginWithGoogle()
    if (res.ok) onLoggedIn()
  }

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Bagaimana Anda ingin melanjutkan?</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Masuk untuk memakai alamat tersimpan, atau lanjut sebagai tamu.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <RadioCard
          selected={choice === 'guest'}
          onSelect={handleGuest}
          title="Lanjut sebagai tamu"
          subtitle="Isi data pengiriman secara manual tanpa akun."
        />
        <RadioCard
          selected={choice === 'login'}
          onSelect={() => setChoice('login')}
          title="Masuk ke akun"
          subtitle="Gunakan alamat dan data yang tersimpan di akun Anda."
        />
      </div>

      {choice === 'login' && (
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4"
        >
          <FormField label="Email" htmlFor="checkout-email" error={error}>
            <Input
              id="checkout-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              error={!!error}
            />
          </FormField>
          <FormField label="Kata sandi" htmlFor="checkout-password">
            <Input
              id="checkout-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
            />
          </FormField>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Masuk
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleGoogle}
              className="w-full sm:w-auto"
            >
              Masuk dengan Google
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
