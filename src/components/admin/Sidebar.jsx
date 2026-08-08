import { NavLink } from 'react-router-dom'
import { SquaresFour, Package, UsersThree, CaretDown } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'

// Exact rebuild of the Figma "Sidebar" component (node 37:346), trimmed to
// the two real destinations this admin has: Dashboard and Produk.
function GroupLabel({ children }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="font-normal text-[16px] text-[var(--adm-muted)]">{children}</span>
      <CaretDown size={16} className="text-[var(--adm-muted)]" />
    </div>
  )
}

function Item({ to, label, Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex items-center gap-2 rounded-[100px] px-4 py-2.5 text-[18px] transition-colors',
          isActive
            ? 'bg-[var(--adm-forest-500)] text-white'
            : 'text-black hover:bg-[var(--adm-bg)]',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={24} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
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
  const { isOwner } = useAuth()
  return (
    <aside className="relative hidden w-[279px] shrink-0 flex-col overflow-hidden rounded-[12px] bg-white lg:flex">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6 pb-[200px]">
        {/* Menu */}
        <div className="flex flex-col gap-2">
          <GroupLabel>Menu</GroupLabel>
          {MENU.map((m) => (
            <Item key={m.to} {...m} />
          ))}
          {isOwner && <Item to="/admin/staff" label="Staff" Icon={UsersThree} />}
        </div>
      </div>
    </aside>
  )
}
