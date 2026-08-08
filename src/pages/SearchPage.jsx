import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import CategoryChip from '../components/ui/CategoryChip'
import ProductCard from '../components/ui/ProductCard'
import { ProductGridSkeleton } from '../components/ui/ProductCardSkeleton'
import EmptyState from '../components/ui/EmptyState'
import Select from '../components/ui/Select'
import { useProducts, useCategories } from '../store/hooks'
import searchIcon from '../assets/nav/search-icon.svg'

const SORT_OPTIONS = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'harga-terendah', label: 'Harga terendah' },
  { value: 'harga-tertinggi', label: 'Harga tertinggi' },
]

// The Figma reference for this screen (Search / Results, "Vergelle" skincare
// template) uses a soft banner of skincare product silhouettes behind the
// search bar. We swap that for an abstract graphic in the same spirit as the
// hero treatments elsewhere in this app (see HomePage's hero SVG), rather
// than reusing any literal skincare imagery.
//
// The reference's "Filter Container" is a full-width horizontal bar above
// the results grid (Sort / Price / Rating / Category / Brand / Type
// dropdowns) on both desktop and mobile — not a left sidebar. Since this
// prototype's data model only supports category filtering, that bar is
// reproduced here as a horizontal, wrapping/scrollable row of CategoryChip
// components rather than the dropdown filters, matching the actual layout
// direction (horizontal, full-width) at both breakpoints.
export default function SearchPage() {
  const { products: allProducts, loading } = useProducts()
  const { categories } = useCategories()
  const [params, setParams] = useSearchParams()
  const activeCategory = params.get('category')

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('terbaru')

  const products = useMemo(() => allProducts.filter((p) => p.published === true), [allProducts])

  const handleSelectCategory = (categoryId) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (categoryId) {
        next.set('category', categoryId)
      } else {
        next.delete('category')
      }
      return next
    })
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = products.filter((p) => {
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      const matchesCategory = !activeCategory || p.category === activeCategory
      return matchesQuery && matchesCategory
    })

    const sorted = [...filtered]
    if (sort === 'harga-terendah') {
      sorted.sort((a, b) => a.price - b.price)
    } else if (sort === 'harga-tertinggi') {
      sorted.sort((a, b) => b.price - a.price)
    } else {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return sorted
  }, [products, activeCategory, query, sort])

  return (
    <div>
      <Nav />

      <section className="relative overflow-hidden bg-neutral-25 px-4 py-12 lg:px-16 lg:py-16">
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1440 320"
          aria-hidden="true"
        >
          <circle cx="1220" cy="40" r="220" className="fill-primary-100" fillOpacity="0.5" />
          <circle cx="140" cy="260" r="180" className="fill-primary-200" fillOpacity="0.25" />
          <circle cx="700" cy="120" r="140" className="fill-none stroke-primary-600" strokeOpacity="0.1" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2 rounded-md border border-neutral-100 bg-neutral-0/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.18px] text-neutral-600 backdrop-blur">
            <span>Beranda</span>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-900">Cari Produk</span>
          </div>

          <div className="flex w-full max-w-2xl items-center gap-3 rounded-pill border border-neutral-200 bg-neutral-0 p-2 shadow-input">
            <span className="flex items-center justify-center rounded-pill bg-neutral-50 p-3">
              <img src={searchIcon} alt="" className="size-5" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari sparepart, brand, atau kompatibilitas motor..."
              className="w-full bg-transparent text-base text-neutral-900 placeholder:text-neutral-600 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 lg:px-16">
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <CategoryChip label="Semua" active={!activeCategory} onClick={() => handleSelectCategory(null)} />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              active={activeCategory === c.id}
              onClick={() => handleSelectCategory(c.id)}
            />
          ))}
        </div>

        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Urutkan produk"
          className="w-full sm:w-auto"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </section>

      <section className="px-4 pb-16 lg:px-16">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <ProductGridSkeleton count={8} />
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="Produk tidak ditemukan"
            description="Coba kata kunci atau kategori lain."
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-neutral-600">{results.length} produk ditemukan</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  )
}
