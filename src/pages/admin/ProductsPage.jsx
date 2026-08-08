import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  DotsThree,
  Eye,
  EyeSlash,
  CaretDown,
  DownloadSimple,
  X,
  Copy,
} from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../store/StoreProvider'
import { formatCurrency } from '../../utils/formatCurrency'
import PageHeader from '../../components/admin/PageHeader'
import { AdminButton, AdminCheckbox, AdminInput } from '../../components/admin/ui/FormControls'
import Dropdown from '../../components/admin/ui/Dropdown'
import StatCard from '../../components/admin/widgets/StatCard'
import ProductImportModal from '../../components/admin/ProductImportModal'
import { BoxIcon } from '../../components/admin/icons'

// Product status maps to the DB `published` boolean — nothing else exists.
const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'published', label: 'Published' },
  { key: 'drafts', label: 'Draft' },
]

function nextProductId(products) {
  const nums = products.map((p) => /^p(\d+)$/.exec(p.id)).filter(Boolean).map((m) => Number(m[1]))
  return 'p' + ((nums.length ? Math.max(...nums) : 0) + 1)
}

export default function ProductsPage() {
  const { products, categories, updateProduct, deleteProduct, addProduct } = useStore()
  const { isEditor } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [selectedCats, setSelectedCats] = useState(new Set())
  const [selected, setSelected] = useState(new Set())
  const [confirmDel, setConfirmDel] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const catName = (id) => categories.find((c) => c.id === id)?.name || id

  const publishedCount = products.filter((p) => p.published).length

  // ---- filtering ----------------------------------------------------------
  const filtered = products.filter((p) => {
    const matchTab = tab === 'all' ? true : tab === 'published' ? p.published : !p.published
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.sku.toLowerCase().includes(q.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(q.toLowerCase())
    const matchCat = selectedCats.size === 0 || selectedCats.has(p.category)
    return matchTab && matchQ && matchCat
  })

  const allChecked = filtered.length > 0 && filtered.every((p) => selected.has(p.id))
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(filtered.map((p) => p.id)))
  const toggleOne = (id) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleCat = (id) =>
    setSelectedCats((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const duplicateProduct = (p) => {
    addProduct({
      ...p,
      id: nextProductId(products),
      name: p.name + ' (Salinan)',
      sku: p.sku + '-COPY',
      published: false,
      createdAt: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <div className="mx-auto max-w-[1200px] p-6 lg:p-8">
      <PageHeader title="Produk" subtitle="Lihat dan kelola semua produk di toko kamu.">
        {isEditor && (
          <>
            <AdminButton variant="secondary" onClick={() => setShowImport(true)}>
              <DownloadSimple size={18} /> Import
            </AdminButton>
            <AdminButton onClick={() => navigate('/admin/products/new')}>
              <Plus size={18} weight="bold" /> Tambah Produk
            </AdminButton>
          </>
        )}
      </PageHeader>

      {/* Product count — real data only */}
      <div className="mb-4 max-w-[300px]">
        <StatCard
          icon={BoxIcon}
          label="Total Sparepart"
          value={products.length}
          sub={`${publishedCount} dipublish`}
        />
      </div>

      {/* Table card */}
      <div className="adm-card flex flex-col gap-6 p-6">
        <p className="text-[20px] font-medium text-black">Semua Produk</p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status tabs */}
          <div className="flex items-center gap-1 rounded-[100px] border border-[var(--adm-white-600)] bg-white py-1 pl-1 pr-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex h-[47px] items-center justify-center rounded-[100px] px-5 text-[16px] transition-colors ${
                  tab === t.key ? 'bg-[var(--adm-bg)] text-[var(--adm-ink)]' : 'text-[var(--adm-muted)] hover:text-[var(--adm-ink)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search / Categories / Filter */}
          <div className="flex items-center gap-3">
            <Dropdown
              trigger={(toggle) => (
                <button onClick={toggle} className="flex size-6 items-center justify-center text-black" aria-label="Cari">
                  <MagnifyingGlass size={22} />
                </button>
              )}
              panel={() => (
                <div className="adm-card w-64 p-3">
                  <AdminInput autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, SKU, brand" />
                </div>
              )}
            />

            <Dropdown
              trigger={(toggle) => (
                <button
                  onClick={toggle}
                  className="flex h-[47px] items-center gap-2 rounded-[100px] border border-[var(--adm-border)] bg-white px-5 text-[18px] text-black"
                >
                  Categories <CaretDown size={16} className="text-[var(--adm-muted)]" />
                </button>
              )}
              align="right"
              panel={() => (
                <div className="adm-card w-56 p-2">
                  <label className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[var(--adm-bg)]">
                    <AdminCheckbox checked={selectedCats.size === 0} onChange={() => setSelectedCats(new Set())} />
                    <span className="text-[15px] text-black">All</span>
                  </label>
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[var(--adm-bg)]">
                      <AdminCheckbox checked={selectedCats.has(c.id)} onChange={() => toggleCat(c.id)} />
                      <span className="text-[15px] text-black">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="rounded-[12px] bg-[var(--adm-bg)] text-[16px] text-[var(--adm-muted)]">
                <th className="w-12 rounded-l-[12px] py-4 pl-6">
                  <AdminCheckbox checked={allChecked} onChange={toggleAll} />
                </th>
                <th className="py-4 font-normal">Product Name</th>
                <th className="py-4 font-normal">Category</th>
                <th className="py-4 font-normal">Price</th>
                <th className="py-4 font-normal">Status</th>
                <th className="rounded-r-[12px] py-4 pr-6 font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="rounded-[12px]">
                  <td className="py-3.5 pl-6">
                    <AdminCheckbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                  </td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[var(--adm-border-strong)]">
                        <img src={p.images?.[0]} alt={p.name} className="size-full object-cover" />
                      </span>
                      <p className="w-[160px] truncate text-[16px] text-black">{p.name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-[16px] text-black">{catName(p.category)}</td>
                  <td className="py-3.5 pr-4 text-[16px] text-black">{formatCurrency(p.price)}</td>
                  <td className="py-3.5 pr-4">
                    <span
                      className="inline-flex items-center whitespace-nowrap rounded-[100px] border px-2.5 py-0.5 text-[14px]"
                      style={
                        p.published
                          ? { color: 'var(--adm-instock-text)', background: 'var(--adm-instock-bg)', borderColor: 'var(--adm-instock-border)' }
                          : { color: 'var(--adm-lowstock-text)', background: 'var(--adm-lowstock-bg)', borderColor: 'var(--adm-lowstock-border)' }
                      }
                    >
                      {p.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3.5 pr-6">
                    {isEditor ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/products/${p.id}`)}
                          className="flex size-10 items-center justify-center rounded-full border border-[var(--adm-border)] bg-white text-black hover:bg-[var(--adm-bg)]"
                          aria-label="Edit"
                        >
                          <PencilSimple size={20} />
                        </button>
                        <button
                          onClick={() => setConfirmDel(p)}
                          className="flex size-10 items-center justify-center rounded-full border border-[var(--adm-border)] bg-white text-black hover:bg-[var(--adm-bg)]"
                          aria-label="Hapus"
                        >
                          <Trash size={20} />
                        </button>
                        <Dropdown
                          align="right"
                          trigger={(toggle) => (
                            <button
                              onClick={toggle}
                              className="flex size-10 items-center justify-center rounded-full border border-[var(--adm-border)] bg-white text-black hover:bg-[var(--adm-bg)]"
                              aria-label="Lainnya"
                            >
                              <DotsThree size={20} weight="bold" />
                            </button>
                          )}
                          panel={(close) => (
                            <div className="adm-card w-48 p-1">
                              <button
                                onClick={() => {
                                  duplicateProduct(p)
                                  close()
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] text-black hover:bg-[var(--adm-bg)]"
                              >
                                <Copy size={16} /> Duplikat produk
                              </button>
                              <button
                                onClick={() => {
                                  updateProduct(p.id, { published: !p.published })
                                  close()
                                }}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] text-black hover:bg-[var(--adm-bg)]"
                              >
                                {p.published ? <EyeSlash size={16} /> : <Eye size={16} />}
                                {p.published ? 'Jadikan draft' : 'Publish'}
                              </button>
                            </div>
                          )}
                        />
                      </div>
                    ) : (
                      <span className="text-[var(--adm-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--adm-muted)]">
                    Tidak ada produk yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import modal */}
      {showImport && (
        <ProductImportModal
          categories={categories}
          nextId={nextProductId(products)}
          onImport={addProduct}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Delete confirm — Figma-exact icon badge + copy */}
      {confirmDel && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDel(null)}>
          <div className="adm-card w-full max-w-sm p-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 pb-0">
              <span className="flex size-11 items-center justify-center rounded-full bg-[var(--adm-outstock-bg)] text-[var(--adm-danger)]">
                <Trash size={20} />
              </span>
              <button onClick={() => setConfirmDel(null)} className="flex size-8 items-center justify-center rounded-full hover:bg-[var(--adm-bg)]" aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 pb-6 pt-4">
              <h2 className="text-[18px] font-medium text-black">Hapus Produk</h2>
              <p className="mt-2 text-[14px] text-[var(--adm-muted)]">
                Tindakan ini tidak bisa dibatalkan. Yakin mau hapus "{confirmDel.name}"?
              </p>
            </div>
            <div className="h-px bg-[var(--adm-border)]" />
            <div className="flex justify-end gap-2 p-4">
              <AdminButton variant="secondary" onClick={() => setConfirmDel(null)}>Batal</AdminButton>
              <AdminButton
                variant="danger"
                onClick={() => {
                  deleteProduct(confirmDel.id)
                  setConfirmDel(null)
                }}
              >
                Hapus
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
