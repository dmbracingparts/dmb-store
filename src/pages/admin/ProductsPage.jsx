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
  Package,
  CheckCircle,
  FileDashed,
} from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../store/StoreProvider'
import { formatCurrency } from '../../utils/formatCurrency'
import { AdminButton, AdminCheckbox, AdminInput } from '../../components/admin/ui/FormControls'
import Dropdown from '../../components/admin/ui/Dropdown'
import { StatTile, StatusPill, RowSkeleton, StatTileSkeleton } from '../../components/admin/ui/Bento'
import { useToast } from '../../components/admin/ui/Toast'
import ProductImportModal from '../../components/admin/ProductImportModal'

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
  const { products, categories, catalogLoading, updateProduct, deleteProduct, addProduct } = useStore()
  const { isEditor } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [selectedCats, setSelectedCats] = useState(new Set())
  const [selected, setSelected] = useState(new Set())
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting] = useState(false)
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

  const duplicateProduct = async (p) => {
    try {
      await addProduct({
        ...p,
        id: nextProductId(products),
        name: p.name + ' (Salinan)',
        sku: p.sku + '-COPY',
        published: false,
        createdAt: new Date().toISOString().slice(0, 10),
      })
      toast.success('Produk diduplikat', { description: `${p.name} (Salinan) ditambahkan sebagai draft.` })
    } catch (e) {
      toast.error('Gagal menduplikat produk', { description: e.message })
    }
  }

  const togglePublish = async (p) => {
    try {
      await updateProduct(p.id, { published: !p.published })
      toast.success(p.published ? 'Produk dijadikan draft' : 'Produk dipublish')
    } catch (e) {
      toast.error('Gagal mengubah status', { description: e.message })
    }
  }

  const doDelete = async () => {
    const target = confirmDel
    setDeleting(true)
    try {
      await deleteProduct(target.id)
      toast.success('Produk dihapus', { description: target.name })
      setConfirmDel(null)
    } catch (e) {
      toast.error('Gagal menghapus produk', { description: e.message })
    } finally {
      setDeleting(false)
    }
  }

  const iconBtn =
    'flex size-9 items-center justify-center rounded-lg border border-[var(--adm-border)] bg-white text-black transition-colors hover:bg-[var(--adm-bg)]'

  return (
    <div className="adm-page-in mx-auto flex max-w-[1240px] flex-col gap-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight text-[var(--adm-ink)]">Produk</h1>
          <p className="mt-1 text-[14px] text-[var(--adm-muted)]">Kelola semua sparepart di katalog kamu.</p>
        </div>
        {isEditor && (
          <div className="flex items-center gap-2">
            <AdminButton variant="secondary" onClick={() => setShowImport(true)}>
              <DownloadSimple size={18} /> Import
            </AdminButton>
            <AdminButton onClick={() => navigate('/products/new')}>
              <Plus size={18} weight="bold" /> Tambah Produk
            </AdminButton>
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        {catalogLoading ? (
          <>
            <StatTileSkeleton />
            <StatTileSkeleton />
            <StatTileSkeleton />
          </>
        ) : (
          <>
            <StatTile icon={Package} variant="dark" label="Total Sparepart" value={products.length.toLocaleString('id-ID')} />
            <StatTile icon={CheckCircle} tone="green" label="Published" value={publishedCount.toLocaleString('id-ID')} />
            <StatTile icon={FileDashed} tone="amber" label="Draft" value={(products.length - publishedCount).toLocaleString('id-ID')} />
          </>
        )}
      </div>

      {/* Table tile */}
      <div className="adm-tile flex flex-col gap-5 p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status tabs — segmented control */}
          <div className="flex items-center gap-1 rounded-full bg-[var(--adm-bg)] p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex h-8 items-center justify-center rounded-full px-4 text-[13px] font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-white text-[var(--adm-ink)] shadow-[var(--adm-shadow-sm)]'
                    : 'text-[var(--adm-muted)] hover:text-[var(--adm-ink)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search / Categories */}
          <div className="flex items-center gap-2">
            <Dropdown
              trigger={(toggle) => (
                <button onClick={toggle} className={iconBtn} aria-label="Cari">
                  <MagnifyingGlass size={18} />
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
                  className="flex h-9 items-center gap-2 rounded-lg border border-[var(--adm-border)] bg-white px-3.5 text-[14px] font-medium text-black hover:bg-[var(--adm-bg)]"
                >
                  Kategori <CaretDown size={15} className="text-[var(--adm-muted)]" />
                </button>
              )}
              align="right"
              panel={() => (
                <div className="adm-card w-56 p-2">
                  <label className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[var(--adm-bg)]">
                    <AdminCheckbox checked={selectedCats.size === 0} onChange={() => setSelectedCats(new Set())} />
                    <span className="text-[14px] text-black">Semua</span>
                  </label>
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[var(--adm-bg)]">
                      <AdminCheckbox checked={selectedCats.has(c.id)} onChange={() => toggleCat(c.id)} />
                      <span className="text-[14px] text-black">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        {/* Table — on desktop the table fits, so allow overflow to be visible
            there; otherwise `overflow-x:auto` forces overflow-y:auto too and
            clips the row "..." action menu on the last rows. Small screens keep
            horizontal scroll. */}
        <div className="overflow-x-auto lg:overflow-visible">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="bg-[var(--adm-bg)] text-[13px] font-medium text-[var(--adm-muted)]">
                <th className="w-12 rounded-l-[10px] py-3 pl-5">
                  <AdminCheckbox checked={allChecked} onChange={toggleAll} />
                </th>
                <th className="py-3 font-medium">Produk</th>
                <th className="py-3 font-medium">Kategori</th>
                <th className="py-3 font-medium">Harga</th>
                <th className="py-3 font-medium">Status</th>
                <th className="rounded-r-[10px] py-3 pr-5 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {catalogLoading && Array.from({ length: 5 }, (_, i) => (
                <RowSkeleton key={i} leadingCheckbox cols={['w-32', 'w-20', 'w-16', 'w-16']} />
              ))}
              {!catalogLoading && filtered.map((p) => (
                <tr key={p.id} className="border-b border-[var(--adm-border)] last:border-0">
                  <td className="py-3 pl-5">
                    <AdminCheckbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--adm-bg)]">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="size-full object-contain p-1" />
                        ) : (
                          <Package size={18} className="text-[var(--adm-muted)]" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="w-[180px] truncate text-[14px] font-medium text-[var(--adm-ink)]">{p.name}</p>
                        <p className="truncate text-[12px] text-[var(--adm-muted)]">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-[14px] text-[var(--adm-text)]">{catName(p.category)}</td>
                  <td className="py-3 pr-4 text-[14px] font-medium adm-nums text-[var(--adm-ink)]">{formatCurrency(p.price)}</td>
                  <td className="py-3 pr-4">
                    <StatusPill published={p.published} />
                  </td>
                  <td className="py-3 pr-5">
                    {isEditor ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/products/${p.id}`)} className={iconBtn} aria-label="Edit">
                          <PencilSimple size={18} />
                        </button>
                        <button onClick={() => setConfirmDel(p)} className={iconBtn} aria-label="Hapus">
                          <Trash size={18} />
                        </button>
                        <Dropdown
                          align="right"
                          trigger={(toggle) => (
                            <button onClick={toggle} className={iconBtn} aria-label="Lainnya">
                              <DotsThree size={18} weight="bold" />
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
                                  togglePublish(p)
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
              {!catalogLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[14px] text-[var(--adm-muted)]">
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

      {/* Delete confirm */}
      {confirmDel && (
        <div className="adm-overlay-in fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setConfirmDel(null)}>
          <div className="adm-card adm-panel-in w-full max-w-sm p-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 pb-0">
              <span className="flex size-11 items-center justify-center rounded-full bg-[var(--adm-outstock-bg)] text-[var(--adm-danger)]">
                <Trash size={20} />
              </span>
              <button onClick={() => setConfirmDel(null)} disabled={deleting} className="flex size-8 items-center justify-center rounded-full hover:bg-[var(--adm-bg)] disabled:opacity-50" aria-label="Tutup">
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
              <AdminButton variant="secondary" onClick={() => setConfirmDel(null)} disabled={deleting}>Batal</AdminButton>
              <AdminButton variant="danger" onClick={doDelete} disabled={deleting}>
                {deleting ? 'Menghapus…' : 'Hapus'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
