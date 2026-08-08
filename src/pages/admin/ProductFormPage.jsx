import { useState, useRef } from 'react'
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom'
import {
  X, CaretDown, ShoppingCart, Package, Plus,
} from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../store/StoreProvider'
import { formatCurrency } from '../../utils/formatCurrency'
import { useToast } from '../../components/admin/ui/Toast'

const BRANDS = ['NHK', 'GS Astra', 'RCB', 'Shell', 'IRC', 'NGK', 'Osram', 'TDR', 'Yamalube', 'Rossi', 'Honda Genuine', 'Daytona', 'Acerbis', 'AHM', 'Corsa', 'Yamaha Genuine', 'FDR']

const MAX_IMAGES = 5

function FieldLabel({ children }) {
  return <p className="mb-1.5 text-[14px] font-medium text-[var(--adm-ink)]">{children}</p>
}

function Input({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      className={`w-full rounded-xl border border-[var(--adm-border)] bg-white px-4 py-2.5 text-[14px] text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-muted)] focus:border-[var(--adm-forest-500)] ${className}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        className="w-full appearance-none rounded-xl border border-[var(--adm-border)] bg-white px-4 py-2.5 text-[14px] text-[var(--adm-ink)] outline-none focus:border-[var(--adm-forest-500)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      <CaretDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--adm-muted)]" />
    </div>
  )
}

function ProductFormPageInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, categories, addProduct, updateProduct } = useStore()
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const existing = id && id !== 'new' ? products.find((p) => p.id === id) : null

  const [images, setImages] = useState(existing?.images || [])
  const [name, setName] = useState(existing?.name || '')
  const [category, setCategory] = useState(existing?.category || '')
  const [brand, setBrand] = useState(existing?.brand || '')
  const [compat, setCompat] = useState(existing?.compatibleWith?.join(', ') || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [price, setPrice] = useState(existing?.price || '')
  const [sku, setSku] = useState(existing?.sku || '')
  const [videoUrl, setVideoUrl] = useState(existing?.videoUrl || '')

  const isNew = !existing

  // First image is the cover ("Utama").
  const previewImg = images[0] || null

  const openPicker = () => fileInputRef.current?.click()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Preview via a temporary object URL. Real persistence needs Vercel Blob
    // (upload the file, then store the returned URL) — deferred to a later phase.
    const url = URL.createObjectURL(file)
    setImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, url]))
    e.target.value = ''
  }

  const removeImg = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const handleSave = async (asDraft = false) => {
    if (saving) return
    const payload = {
      name,
      category,
      brand,
      compatibleWith: compat.split(',').map((s) => s.trim()).filter(Boolean),
      description,
      price: Number(price),
      sku,
      images,
      videoUrl: videoUrl.trim(),
      published: !asDraft,
      isFeatured: existing?.isFeatured || false,
      featuredOrder: existing?.featuredOrder ?? null,
    }
    setSaving(true)
    try {
      if (isNew) {
        const nums = products.map((p) => /^p(\d+)$/.exec(p.id)).filter(Boolean).map((m) => Number(m[1]))
        await addProduct({ ...payload, id: 'p' + ((nums.length ? Math.max(...nums) : 0) + 1) })
      } else {
        await updateProduct(id, payload)
      }
      toast.success(asDraft ? 'Disimpan sebagai draft' : 'Produk dipublish', { description: name })
      navigate('/admin/products')
    } catch (e) {
      toast.error('Gagal menyimpan produk', { description: e.message })
      setSaving(false)
    }
  }

  const catOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="adm-page-in mx-auto max-w-[1240px] px-4 pb-28 pt-4 lg:px-6 lg:pt-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[24px] font-semibold tracking-tight text-[var(--adm-ink)]">
          {isNew ? 'Tambah Produk' : 'Edit Produk'}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--adm-muted)]">
          <Link to="/admin/products" className="hover:underline">Produk</Link>
          {' / '}
          <span>{isNew ? 'Tambah Produk' : name || 'Edit'}</span>
        </p>
      </div>

      <div className="flex gap-6">
        {/* ─── Left: Form ─────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          {/* Images */}
          <div className="adm-tile p-5">
            <div className="mb-1 flex items-center justify-between">
              <FieldLabel>Gambar</FieldLabel>
              <span className="text-[12px] text-[var(--adm-muted)]">{images.length}/{MAX_IMAGES}</span>
            </div>
            <p className="mb-3 text-[12px] text-[var(--adm-muted)]">
              Maks. {MAX_IMAGES} foto. Foto pertama jadi gambar utama. Format: JPG, JPEG, PNG.
            </p>
            <div className="flex flex-wrap gap-3">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square w-[104px] overflow-hidden rounded-xl border border-[var(--adm-border)] bg-[var(--adm-bg)]"
                >
                  <img src={src} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImg(i)}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                    aria-label="Hapus gambar"
                  >
                    <X size={11} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-white">Utama</span>
                  )}
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={openPicker}
                  className="flex aspect-square w-[104px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--adm-border)] bg-[var(--adm-bg)] text-[var(--adm-muted)] transition-colors hover:border-[var(--adm-muted)] hover:text-[var(--adm-ink)]"
                >
                  <Plus size={20} />
                  <span className="text-[11px]">Tambah Gambar</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Basic Info */}
          <div className="adm-tile flex flex-col gap-4 p-5">
            <div>
              <FieldLabel>Nama Produk</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama produk di sini" />
            </div>
            <div>
              <FieldLabel>Kategori</FieldLabel>
              <Select value={category} onChange={setCategory} options={catOptions} placeholder="Pilih kategori" />
            </div>
            <div>
              <FieldLabel>Brand</FieldLabel>
              <Select value={brand} onChange={setBrand} options={BRANDS} placeholder="Pilih brand" />
            </div>
            <div>
              <FieldLabel>Kompatibel Dengan</FieldLabel>
              <Input value={compat} onChange={(e) => setCompat(e.target.value)} placeholder="Contoh: Honda Vario 125, Universal" />
              <p className="mt-1 text-[11px] text-[var(--adm-muted)]">Pisahkan dengan koma</p>
            </div>
          </div>

          {/* Description */}
          <div className="adm-tile flex flex-col gap-3 p-5">
            <FieldLabel>Deskripsi</FieldLabel>
            <textarea
              className="h-32 w-full rounded-xl border border-[var(--adm-border)] px-4 py-3 text-[14px] text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-muted)] focus:border-[var(--adm-forest-500)] resize-none"
              placeholder="Masukkan deskripsi produk di sini"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Video (YouTube URL) */}
          <div className="adm-tile p-5">
            <FieldLabel>Video YouTube</FieldLabel>
            <p className="mb-3 text-[12px] text-[var(--adm-muted)]">
              Tempel link YouTube produk. Ditampilkan sebagai video tertanam di halaman produk.
            </p>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
          </div>

          {/* Price */}
          <div className="adm-tile flex flex-col gap-4 p-5">
            <p className="text-[15px] font-medium text-[var(--adm-ink)]">Harga</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Harga Jual</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--adm-muted)]">Rp</span>
                  <input
                    className="w-full rounded-xl border border-[var(--adm-border)] py-2.5 pl-9 pr-3 text-[14px] outline-none focus:border-[var(--adm-forest-500)]"
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>SKU Produk</FieldLabel>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Contoh: NHK-001" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right: Preview + Recommendations ───────────────────────── */}
        <div className="hidden w-[260px] shrink-0 flex-col gap-4 lg:flex">
          {/* Preview card */}
          <div className="adm-tile p-4">
            <p className="mb-1 text-[13px] font-medium text-[var(--adm-ink)]">Preview</p>
            <p className="mb-3 text-[11px] text-[var(--adm-muted)]">Tampilan produk kamu.</p>

            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[var(--adm-bg)]">
              {previewImg ? (
                <img src={previewImg} alt="Preview" className="size-full object-cover" />
              ) : (
                <Package size={48} className="text-[var(--adm-border-strong)]" />
              )}
            </div>

            <p className="mt-3 text-[13px] font-medium text-[var(--adm-ink)] line-clamp-2">
              {name || 'Nama Produk'}
            </p>
            {description && (
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--adm-muted)] line-clamp-3">{description}</p>
            )}

            {images.length > 1 && (
              <div className="mt-2 flex gap-1">
                {images.slice(1, 4).map((src, i) => (
                  <img key={i} src={src} alt="" className="size-9 rounded-lg object-cover border border-[var(--adm-border)]" />
                ))}
              </div>
            )}

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--adm-border)] py-2 text-[13px] font-medium text-[var(--adm-ink)] hover:bg-[var(--adm-bg)]"
            >
              <ShoppingCart size={15} />
              Beli sekarang
            </button>

            {price && (
              <p className="mt-2 text-center text-[13px] font-semibold text-[var(--adm-ink)]">
                {formatCurrency(Number(price))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Floating action bar — spans the content area (right of the 279px
          sidebar on lg), buttons right-aligned. */}
      <div className="fixed bottom-3 left-3 right-3 z-40 lg:left-[272px]">
        <div className="flex items-center justify-end gap-2 rounded-[16px] border border-[var(--adm-border)] bg-white px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.10)]">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="rounded-full border border-[var(--adm-border)] bg-white px-5 py-2.5 text-[13px] font-medium text-[var(--adm-ink)] transition-transform hover:bg-[var(--adm-bg)] active:scale-[0.97] disabled:opacity-50"
          >
            {saving ? 'Menyimpan…' : 'Simpan Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="rounded-full px-6 py-2.5 text-[13px] font-semibold text-black transition-transform active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'var(--adm-mint)' }}
          >
            {saving ? 'Menyimpan…' : 'Submit Produk'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Viewers can't reach the editor — server also blocks writes with 403.
export default function ProductFormPage() {
  const { isEditor } = useAuth()
  if (!isEditor) return <Navigate to="/admin/products" replace />
  return <ProductFormPageInner />
}
