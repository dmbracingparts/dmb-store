import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import PriceTag from '../components/ui/PriceTag'
import QuantitySelector from '../components/ui/QuantitySelector'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Carousel from '../components/ui/Carousel'
import { useCart } from '../context/CartContext'
import { useProduct, useCategories } from '../store/hooks'
import { CATALOG_ONLY, STORE_WHATSAPP } from '../config/features'
import { WhatsappLogo } from '@phosphor-icons/react'

// Accept the three forms an admin might paste: watch?v=ID, youtu.be/ID, and
// an already-embed URL. Extract the 11-char video id and always return a
// proper /embed/ URL so the iframe actually plays (a bare youtu.be link
// renders a blocked page inside an iframe).
function toEmbedUrl(url) {
  const match = String(url).match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : url
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { categories } = useCategories()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const { product, loading, error } = useProduct(id)

  if (loading) {
    return (
      <div>
        <Nav />
        <section className="flex animate-pulse flex-col gap-8 px-4 py-6 motion-reduce:animate-none lg:flex-row lg:gap-10 lg:px-16 lg:py-10">
          <div className="aspect-square w-full rounded-md bg-neutral-100 lg:w-3/5" />
          <div className="flex flex-col gap-5 lg:w-2/5">
            <div className="h-3 w-40 rounded bg-neutral-100" />
            <div className="border-t border-neutral-100" />
            <div className="h-8 w-3/4 rounded bg-neutral-100" />
            <div className="h-7 w-32 rounded bg-neutral-100" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-full rounded bg-neutral-100" />
              <div className="h-4 w-5/6 rounded bg-neutral-100" />
              <div className="h-4 w-2/3 rounded bg-neutral-100" />
            </div>
            <div className="h-12 w-full rounded-md bg-neutral-100" />
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Nav />
        <p className="py-24 text-center text-neutral-600">Gagal memuat produk.</p>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div>
        <Nav />
        <EmptyState
          title="Produk tidak ditemukan"
          description="Produk yang kamu cari tidak tersedia atau sudah dihapus."
          actionLabel="Cari Produk Lain"
          onAction={() => navigate('/search')}
        />
        <Footer />
      </div>
    )
  }

  const category = categories.find((c) => c.id === product.category)

  // Catalog-only phase: no cart/checkout, funnel enquiries to WhatsApp.
  const waHref = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
    `Halo, saya ingin bertanya tentang produk "${product.name}".`,
  )}`

  const handleAddToCart = () => {
    addItem(product.id, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    addItem(product.id, qty)
    navigate('/checkout')
  }

  return (
    <div>
      <Nav />

      <section className="flex flex-col gap-8 px-4 py-6 lg:flex-row lg:gap-10 lg:px-16 lg:py-10">
        {/* Gallery */}
        <div className="flex flex-col gap-3 lg:w-3/5">
          <Carousel images={product.images} alt={product.name} />

          {product.videoUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-md bg-neutral-50">
              <iframe
                src={toEmbedUrl(product.videoUrl)}
                title={`Video ${product.name}`}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5 lg:w-2/5">
          <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.18px] text-neutral-600">
            <Link to="/">Beranda</Link>
            <span aria-hidden="true">/</span>
            {category && (
              <>
                <Link to="/search">{category.name}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span className="text-neutral-900">Detail Produk</span>
          </div>
          <div className="border-t border-neutral-100" />

          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center rounded-md bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-900">
              {product.brand}
            </span>
            <h1 className="text-xl font-medium leading-tight tracking-tight text-neutral-900 lg:text-[32px]">
              {product.name}
            </h1>
          </div>
          <div className="border-t border-neutral-100" />

          <PriceTag amount={product.price} />
          <div className="border-t border-neutral-100" />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-neutral-900">Tentang Produk</h3>
              <p className="text-sm text-neutral-600">{product.description}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-900">Kompatibel dengan:</h3>
              <ul className="flex flex-wrap gap-2">
                {product.compatibleWith.map((m) => (
                  <li key={m} className="rounded-md bg-secondary-25 px-2.5 py-1.5 text-xs font-medium text-secondary-800">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {CATALOG_ONLY ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-primary-600 px-6 py-3 text-base font-medium text-neutral-0 transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              <WhatsappLogo size={20} weight="fill" />
              Hubungi Kami
            </a>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <QuantitySelector value={qty} min={1} max={99} onChange={setQty} />
              <div className="flex flex-1 gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 whitespace-nowrap"
                  onClick={handleAddToCart}
                >
                  {added ? 'Ditambahkan ✓' : 'Tambah ke Keranjang'}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 whitespace-nowrap"
                  onClick={handleBuyNow}
                >
                  Checkout Sekarang
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
