import { useRef, useState } from 'react'
import { ClipboardText, Info, X } from '@phosphor-icons/react'
import { AdminButton } from './ui/FormControls'

// Commerly "Import Product" modal: dashed dropzone + supported-formats note +
// full-width Upload CTA. Functionally real for this POC: parses a small CSV
// (name,sku,brand,category,price) and adds one product per row.
function parseCsv(text, categories) {
  const rows = text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean)
  if (rows.length <= 1) return { products: [], skipped: 0 }

  const catIds = new Set(categories.map((c) => c.id))
  const products = []
  let skipped = 0

  for (const row of rows.slice(1)) {
    const [name, sku, brand, category, price] = row.split(',').map((s) => s?.trim())
    if (!name || !sku || !catIds.has(category) || isNaN(Number(price))) {
      skipped++
      continue
    }
    products.push({
      name,
      sku,
      brand: brand || '',
      category,
      price: Number(price),
      images: [`/products/${category}.svg`, `/products/${category}.svg`],
      description: '',
      compatibleWith: [],
      videoUrl: '',
      published: true,
      isFeatured: false,
      rating: 0,
      reviewCount: 0,
      testimonials: [],
      createdAt: new Date().toISOString().slice(0, 10),
    })
  }
  return { products, skipped }
}

export default function ProductImportModal({ categories, nextId, onImport, onClose }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    setFile(f)
    setResult(null)
  }

  const upload = async () => {
    if (!file) return
    const text = await file.text()
    const { products, skipped } = parseCsv(text, categories)
    let id = nextId
    const withIds = products.map((p) => {
      const withId = { ...p, id }
      id = 'p' + (Number(id.slice(1)) + 1)
      return withId
    })
    withIds.forEach((p) => onImport(p))
    setResult({ count: withIds.length, skipped })
  }

  return (
    <div className="adm-overlay-in fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="adm-card adm-panel-in w-full max-w-md p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-[18px] font-medium text-black">Import Produk</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full hover:bg-[var(--adm-bg)]" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="h-px bg-[var(--adm-border)]" />

        <div className="flex flex-col gap-4 p-6">
          <p className="text-[14px] text-[var(--adm-muted)]">
            Pilih file untuk diunggah, kami akan proses daftar produknya otomatis.
          </p>

          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
            }}
            className={`flex h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed transition-colors ${
              dragOver ? 'border-[var(--adm-info)] bg-[var(--adm-bg)]' : 'border-[var(--adm-border-strong)]'
            }`}
          >
            <ClipboardText size={28} className="text-black" />
            <span className="text-[15px] text-black">{file ? file.name : 'Taruh file di sini'}</span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>

          <div className="flex items-center gap-1.5 text-[12px] text-[var(--adm-muted)]">
            <Info size={14} />
            <span>Format didukung: CSV (nama,sku,brand,kategori,harga)</span>
          </div>

          {result && (
            <div className="rounded-[12px] bg-[var(--adm-success-bg)] px-4 py-2.5 text-[13px] text-[var(--adm-success)]">
              {result.count} produk berhasil diimpor{result.skipped > 0 ? `, ${result.skipped} baris dilewati` : ''}.
            </div>
          )}

          <AdminButton onClick={upload} disabled={!file} className="w-full">
            Upload
          </AdminButton>
        </div>
      </div>
    </div>
  )
}
