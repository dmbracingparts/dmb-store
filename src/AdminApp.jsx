import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider } from './store/StoreProvider'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { ToastProvider } from './components/admin/ui/Toast'
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
      <ToastProvider>
        <StoreProvider>
          <AuthProvider>
            <ChatProvider>
              <Routes>
                <Route path="/" element={<AdminLoginPage />} />
                <Route path="/admin/login" element={<Navigate to="/" replace />} />

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
      </ToastProvider>
    </BrowserRouter>
  )
}
