import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, X, Package } from '@phosphor-icons/react'
import { useStore } from '../../store/StoreProvider'

const SHORTCUTS = [
  { id: 's1', label: 'Dashboard', desc: 'Lihat ringkasan produk dan katalog toko.', href: '/' },
  { id: 's2', label: 'Kelola Produk', desc: 'Tambah, edit, dan hapus produk dari katalog toko.', href: '/products' },
  { id: 's3', label: 'Tambah Produk Baru', desc: 'Buat listing produk baru di katalog.', href: '/products/new' },
]

const TABS = ['Semua', 'Pintasan', 'Produk']

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-medium text-[var(--adm-forest-500)]">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('Semua')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { products = [] } = useStore()

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const q = query.trim().toLowerCase()

  const filteredShortcuts = useMemo(() =>
    SHORTCUTS.filter((s) => !q || s.label.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)),
    [q])

  const filteredProducts = useMemo(() =>
    (tab === 'Semua' || tab === 'Produk')
      ? products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 6)
      : [],
    [q, products, tab])

  const showShortcuts = (tab === 'Semua' || tab === 'Pintasan') && filteredShortcuts.length > 0
  const hasResults = showShortcuts || filteredProducts.length > 0

  function go(href) { navigate(href); onClose() }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[80px]"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[660px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4">
          <MagnifyingGlass size={20} className="shrink-0 text-[var(--adm-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari apa saja"
            className="flex-1 bg-transparent text-[16px] text-black placeholder:text-[var(--adm-muted)] focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--adm-muted)] hover:text-black">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-t border-[var(--adm-border)] px-5 py-2.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                tab === t ? 'bg-black text-white' : 'bg-[var(--adm-bg)] text-[var(--adm-muted)] hover:text-black'
              }`}
            >
              {t}
              {tab === t && t !== 'Semua' && <X size={11} className="opacity-70" />}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[480px] overflow-y-auto pb-2">
          {!hasResults && (
            <div className="py-14 text-center text-[14px] text-[var(--adm-muted)]">
              Tidak ada hasil untuk "{query}"
            </div>
          )}

          {showShortcuts && (
            <section className="pt-4">
              <p className="px-5 pb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--adm-muted)]">Pintasan</p>
              {filteredShortcuts.map((s) => (
                <button key={s.id} onClick={() => go(s.href)} className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--adm-bg)]">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center text-[14px] text-[var(--adm-muted)]">⌘</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-black">{highlight(s.label, query)}</p>
                    <p className="text-[12px] text-[var(--adm-muted)] line-clamp-2">{highlight(s.desc, query)}</p>
                  </div>
                </button>
              ))}
            </section>
          )}

          {filteredProducts.length > 0 && (
            <section className="pt-4">
              <div className="mx-5 mb-2 border-t border-[var(--adm-border)]" />
              <p className="px-5 pb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--adm-muted)]">Produk</p>
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => go(`/products/${p.id}`)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--adm-bg)]">
                  <span className="flex size-6 shrink-0 items-center justify-center text-[var(--adm-muted)]"><Package size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-black">{highlight(p.name, query)}</p>
                    <p className="text-[12px] text-[var(--adm-muted)]">{p.brand} · {p.sku}</p>
                  </div>
                  <span className="shrink-0 text-[13px] text-[var(--adm-muted)]">Rp {p.price.toLocaleString('id-ID')}</span>
                </button>
              ))}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--adm-border)]">
          <button onClick={() => go('/products')} className="w-full py-4 text-[14px] font-medium text-black hover:bg-[var(--adm-bg)]">
            Lihat semua
          </button>
        </div>
      </div>
    </div>
  )
}
