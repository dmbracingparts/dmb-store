import { NavLink } from 'react-router-dom'
import { SquaresFour, Package, UsersThree, ArrowSquareOut } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import dmbLogo from '../../assets/logo-dmb.png'

const STOREFRONT_URL = 'https://dmb-store.vercel.app'

function GroupLabel({ children }) {
  return (
    <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--adm-muted)]">
      {children}
    </p>
  )
}

// Sequence-style nav item: subtle light pill when active, with the icon in a
// filled black chip; muted icon + text when idle.
function Item({ to, label, Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-xl px-2.5 py-2 text-[14px] font-medium transition-colors',
          isActive
            ? 'bg-[var(--adm-bg)] text-[var(--adm-ink)]'
            : 'text-[var(--adm-forest-200)] hover:bg-[var(--adm-bg)] hover:text-[var(--adm-ink)]',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              isActive ? 'bg-black text-white' : 'text-[var(--adm-forest-200)] group-hover:text-[var(--adm-ink)]',
            ].join(' ')}
          >
            <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
          </span>
          <span className="flex-1 whitespace-nowrap">{label}</span>
        </>
      )}
    </NavLink>
  )
}

const MENU = [
  { to: '/admin', label: 'Dashboard', Icon: SquaresFour, end: true },
  { to: '/admin/products', label: 'Produk', Icon: Package },
]

export default function Sidebar() {
  const { isAdministrator } = useAuth()
  return (
    <aside className="relative hidden w-[248px] shrink-0 flex-col overflow-hidden rounded-[16px] bg-white lg:flex">
      {/* Brand */}
      <div className="flex items-center px-5 py-[18px]">
        <img src={dmbLogo} alt="DMB Moto Shop" className="h-8 w-auto" />
      </div>

      {/* Nav */}
      <nav className="adm-scroll flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        <GroupLabel>Menu</GroupLabel>
        {MENU.map((m) => (
          <Item key={m.to} {...m} />
        ))}
        {isAdministrator && <Item to="/admin/staff" label="Staff" Icon={UsersThree} />}
      </nav>

      {/* Footer */}
      <div className="p-3">
        <a
          href={STOREFRONT_URL}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-xl px-2.5 py-2 text-[14px] font-medium text-[var(--adm-forest-200)] transition-colors hover:bg-[var(--adm-bg)] hover:text-[var(--adm-ink)]"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--adm-forest-200)] group-hover:text-[var(--adm-ink)]">
            <ArrowSquareOut size={18} />
          </span>
          <span className="flex-1">Lihat Storefront</span>
        </a>
      </div>
    </aside>
  )
}
