import { createContext, useContext, useEffect, useState } from 'react'
import { useStore } from '../store/StoreProvider'

const AuthContext = createContext(null)
const IS_ADMIN = import.meta.env.VITE_APP_TARGET === 'admin'

const GOOGLE_USER = {
  id: 'u-google',
  name: 'Google User',
  email: 'google.user@gmail.com',
  phone: '',
  password: '',
  provider: 'google',
  addresses: [],
  defaultAddressId: null,
}

export function AuthProvider({ children }) {
  const { users: storeUsers, addUser } = useStore()
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(IS_ADMIN)
  const [storefrontUserId, setStorefrontUserId] = useState(() => (!IS_ADMIN ? localStorage.getItem('dmb:auth') : null))

  // Admin: restore session from the server on mount.
  useEffect(() => {
    if (!IS_ADMIN) return
    fetch('/api/admin/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCurrentUser(d?.user || null))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Storefront: persist the customer id locally.
  useEffect(() => {
    if (IS_ADMIN) return
    if (storefrontUserId) localStorage.setItem('dmb:auth', storefrontUserId)
    else localStorage.removeItem('dmb:auth')
  }, [storefrontUserId])

  const storefrontUser = !IS_ADMIN ? (storeUsers.find((u) => u.id === storefrontUserId) || null) : null
  const user = IS_ADMIN ? currentUser : storefrontUser

  const login = async (email, password) => {
    if (IS_ADMIN) {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) return { ok: false, error: d.error || 'Login gagal' }
      setCurrentUser(d.user)
      return { ok: true, user: d.user }
    }
    const u = storeUsers.find((x) => x.email.toLowerCase() === String(email).toLowerCase())
    if (!u) return { ok: false, error: 'Email tidak ditemukan.' }
    if (!u.password || String(password) !== String(u.password)) return { ok: false, error: 'Password salah.' }
    setStorefrontUserId(u.id)
    return { ok: true, user: u }
  }

  const logout = async () => {
    if (IS_ADMIN) {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
      setCurrentUser(null)
      return
    }
    setStorefrontUserId(null)
  }

  // Storefront-only: sign in with the fixture Google account.
  const loginWithGoogle = () => {
    const existing = storeUsers.find((u) => u.id === GOOGLE_USER.id)
    if (!existing) addUser(GOOGLE_USER)
    setStorefrontUserId(GOOGLE_USER.id)
    return { ok: true }
  }

  // Storefront-only: register a new customer account.
  const register = ({ name, email, phone, password }) => {
    if (storeUsers.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
      return { ok: false, error: 'Email sudah terdaftar.' }
    }
    const newUser = {
      id: 'u' + (storeUsers.length + 1) + '-' + email.split('@')[0],
      name,
      email,
      phone: phone || '',
      password: password || '',
      provider: 'password',
      addresses: [],
      defaultAddressId: null,
    }
    addUser(newUser)
    setStorefrontUserId(newUser.id)
    return { ok: true }
  }

  const isOwner = user?.role === 'owner'
  const isEditor = IS_ADMIN ? (user?.role === 'owner' || user?.role === 'staff') : false
  const isAdmin = IS_ADMIN ? !!user : (user?.role === 'admin' || user?.role === 'owner')

  return (
    <AuthContext.Provider
      value={{ currentUser: user, isLoggedIn: !!user, isAdmin, isOwner, isEditor, loading, login, logout, loginWithGoogle, register }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
