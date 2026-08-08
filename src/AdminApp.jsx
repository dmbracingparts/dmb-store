import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ADMIN_LOGIN_SLUG } from './config/features'
import { StoreProvider } from './store/StoreProvider'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import RequireAdmin from './components/admin/RequireAdmin'
import AdminLayout from './components/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import ProductsPage from './pages/admin/ProductsPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import ProductFormPage from './pages/admin/ProductFormPage'
import StaffPage from './pages/admin/StaffPage'

// Admin dashboard app — built with VITE_APP_TARGET=admin and deployed as its
// own Vercel project behind Deployment Protection. No storefront pages are
// imported here, and this app is never served on the public domain.
export default function AdminApp() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AuthProvider>
          <ChatProvider>
            <Routes>
              {/* Sign-in behind the secret slug; the guessable /admin/login
                  just forwards to it. */}
              <Route path={`/admin/${ADMIN_LOGIN_SLUG}`} element={<AdminLoginPage />} />
              <Route path="/admin/login" element={<Navigate to={`/admin/${ADMIN_LOGIN_SLUG}`} replace />} />

              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/new" element={<ProductFormPage />} />
                <Route path="products/:id" element={<ProductFormPage />} />
                <Route path="staff" element={<StaffPage />} />
              </Route>

              {/* Everything else on the admin deployment funnels into /admin. */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  )
}
