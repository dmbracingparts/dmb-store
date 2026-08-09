import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Gate for every admin page — logged-out → login; logged-in non-admin → denied.
export default function RequireAdmin({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth()

  // Session restore (`/api/admin/me`) hasn't resolved yet — wait rather than
  // redirect, or a logged-in admin gets bounced to login on every refresh.
  if (loading) return null

  // Logged-out visitors go to the sign-in page. This gate is the real one —
  // there is no platform-level gate in front of it (see docs/deployment.md,
  // "Why not Deployment Protection").
  if (!isLoggedIn) return <Navigate to="/login" replace />

  if (!isAdmin) {
    return (
      <div className="admin-theme flex min-h-screen items-center justify-center p-6">
        <div className="adm-card max-w-md p-8 text-center">
          <h1 className="text-xl font-medium text-[var(--adm-ink)]">Akses ditolak</h1>
          <p className="mt-2 text-sm text-[var(--adm-muted)]">
            Halaman admin hanya untuk pengelola toko. Akun kamu tidak punya akses.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--adm-forest-500)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Kembali ke toko
          </a>
        </div>
      </div>
    )
  }

  return children
}
