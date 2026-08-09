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
// own Vercel project on its own subdomain. No storefront pages are imported
// here, and this app is never served on the public domain.
export default function AdminApp() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <StoreProvider>
          <AuthProvider>
            <ChatProvider>
              <Routes>
                <Route path="/login" element={<AdminLoginPage />} />

                {/* This deployment only ever serves the admin, on its own
                    subdomain, so the pages sit at the root — an /admin prefix
                    here would just say "admin" twice. */}
                <Route
                  path="/"
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

                {/* Everything else funnels to the dashboard — which also
                    catches bookmarks of the old /admin/* paths. */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ChatProvider>
          </AuthProvider>
        </StoreProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
