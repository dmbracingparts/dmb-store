import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import '../../styles/admin-theme.css'

// SP4–SP6: admin shell. Matches the Figma Commerly layout — a full-width navbar
// on top, then a floating rounded sidebar card beside the scrolling content.
// `.admin-theme` scopes the Commerly palette + Geist so the black/gold
// storefront theme is never affected.
export default function AdminLayout() {
  return (
    <div className="admin-theme flex h-screen gap-3 bg-[var(--adm-bg)] p-3">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto rounded-[16px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
