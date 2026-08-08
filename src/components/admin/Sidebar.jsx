import { NavLink } from 'react-router-dom'
import { SquaresFour, Package, UsersThree, Storefront, ArrowRight } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import dmbLogo from '../../assets/logo-dmb.png'

const STOREFRONT_URL = 'https://dmb-store.vercel.app'

function GroupLabel({ children }) {
  return (
    <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-white/35">
      {children}
    </p>
  )
}

// Sequence-style nav item, dark variant: a soft translucent pill when active,
// with the icon in a filled mint chip; muted white/idle otherwise.
function Item({ to, label, Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-xl px-2.5 py-2 text-[14px] font-medium transition-colors',
          isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              isActive ? 'bg-[var(--adm-mint)] text-black' : 'text-white/45 group-hover:text-white',
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
    <aside className="relative hidden w-[248px] shrink-0 flex-col overflow-hidden rounded-[16px] bg-black lg:flex">
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
        {isAdministrator && <Item to="/admin/staff" label="User" Icon={UsersThree} />}
      </nav>

      {/* Storefront promo banner */}
      <div className="p-3">
        <a
          href={STOREFRONT_URL}
          target="_blank"
          rel="noreferrer"
          className="group relative block overflow-hidden rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
          style={{ background: 'var(--adm-mint)' }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-black/10 blur-xl"
          />
          <span className="relative flex size-9 items-center justify-center rounded-xl bg-black text-[var(--adm-mint)]">
            <Storefront size={18} weight="bold" />
          </span>
          <p className="relative mt-3 text-[14px] font-semibold text-black">Lihat Storefront</p>
          <p className="relative mt-0.5 text-[12px] leading-snug text-black/60">
            Cek tampilan katalog kamu langsung.
          </p>
          <span className="relative mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-black transition-transform group-hover:translate-x-0.5">
            Kunjungi <ArrowRight size={13} weight="bold" />
          </span>
        </a>
      </div>
    </aside>
  )
}
