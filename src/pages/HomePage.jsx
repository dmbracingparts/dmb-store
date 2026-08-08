import { Link } from 'react-router-dom'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import ProductCard from '../components/ui/ProductCard'
import { ProductGridSkeleton } from '../components/ui/ProductCardSkeleton'
import Button from '../components/ui/Button'
import HeroAssemblySection from '../components/home/HeroAssemblySection'
import HowItWorksSection from '../components/home/HowItWorksSection'
import { useHomepage, useProducts } from '../store/hooks'

// Landing page — long-form section composition (announcement → hero → marquee →
// product lines → product grid → how-it-works → CTA band → why → FAQ → trust →
// footer), with DMB's own content as a motorcycle-parts MANUFACTURER (produsen),
// black + yellow brand. Token-only, no new dependencies.

const MARQUEE_ITEMS = [
  'Diproduksi Sendiri',
  'Sparepart Original',
  'Garansi Keaslian',
  'Harga Langsung Produsen',
  'Kirim Se-Indonesia',
  'Bandung',
]

const PRODUCT_LINES = [
  {
    title: 'Mesin & Pengereman',
    desc: 'Kampas rem, kopling, part mesin presisi — diproduksi dengan standar QC pabrikan.',
    cta: 'Lihat Lini Mesin',
    href: '/search?category=mesin',
  },
  {
    title: 'Kelistrikan & Pengapian',
    desc: 'Aki, busi, koil, dan komponen kelistrikan yang awet untuk motor harian maupun modifikasi.',
    cta: 'Lihat Kelistrikan',
    href: '/search?category=kelistrikan',
  },
  {
    title: 'Bodi & Aksesoris',
    desc: 'Spion, cover body, hingga aksesoris racing — bikin motormu tampil beda.',
    cta: 'Lihat Aksesoris',
    href: '/search',
  },
]

const WHY = [
  { n: '01', title: 'Diproduksi & diuji sendiri', img: 'https://images.unsplash.com/photo-1636761358757-0a616eb9e17e?fm=jpg&q=80&w=800&auto=format&fit=crop' },
  { n: '02', title: 'Harga langsung dari produsen', img: 'https://images.unsplash.com/photo-1683455726905-02c1dfab349f?fm=jpg&q=80&w=800&auto=format&fit=crop' },
  { n: '03', title: 'Cocok untuk banyak tipe motor', img: 'https://images.unsplash.com/photo-1780401531667-849222fb636b?fm=jpg&q=80&w=800&auto=format&fit=crop' },
]

const FAQS = [
  { q: 'Apakah sparepart DMB original?', a: 'Ya. DMB adalah produsen sparepart motor — setiap part diproduksi dan diuji sendiri dengan standar QC pabrikan, bukan barang KW.' },
  { q: 'Bagaimana cara melacak pesanan saya?', a: 'Pelanggan terdaftar bisa melihat riwayat & status di halaman Akun. Tamu bisa memakai halaman Lacak Pesanan dengan Order ID + email/HP yang dipakai saat checkout.' },
  { q: 'Metode pembayaran apa yang didukung?', a: 'Pembayaran diproses lewat Midtrans Snap (Virtual Account, GoPay, QRIS). Pada prototipe ini pembayaran disimulasikan.' },
  { q: 'Apakah melayani grosir atau reseller?', a: 'Ya. Sebagai produsen, kami melayani pembelian grosir untuk bengkel dan reseller. Hubungi tim kami untuk penawaran harga khusus.' },
  { q: 'Berapa lama pengiriman?', a: 'Tergantung ekspedisi dan layanan yang dipilih saat checkout — mulai Same Day (Bandung) sampai Reguler 2–3 hari ke luar kota.' },
]

const TRUST = [
  { icon: ShieldIcon, title: 'Pembayaran aman', sub: 'Diproses lewat Midtrans' },
  { icon: BoxIcon, title: 'Dikemas rapi', sub: 'Aman sampai tujuan' },
  { icon: TruckIcon, title: 'Kirim 1–3 hari', sub: 'Ekspedisi pilihanmu' },
  { icon: ChatIcon, title: 'Tim siap bantu', sub: 'Sebelum & sesudah beli' },
]

export default function HomePage() {
  const homepage = useHomepage()
  const { products, loading } = useProducts()

  const publishedProducts = products.filter((p) => p.published)
  const featured = homepage.featuredProductIds
    .map((id) => publishedProducts.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <div>
      {/* Announcement bar */}
      <div className="home-announcement flex min-h-[38px] items-center justify-center bg-neutral-900 px-4 py-2 text-center text-xs font-medium tracking-wide text-neutral-0 lg:text-sm">
        🔥 Promo Launch — Gratis ongkir untuk pembelian di atas Rp300.000. Pakai kode{' '}
        <span className="font-semibold text-secondary-600">ONGKIR</span>
      </div>

      <Nav overlay />

      <HeroAssemblySection />

      {/* Marquee */}
      <div className="mt-16 lg:mt-24">
        <Marquee />
      </div>

      {/* Product lines */}
      <section className="px-4 py-16 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mx-auto mb-12 max-w-3xl text-center text-3xl font-medium tracking-tight text-neutral-900 lg:mb-16 lg:text-5xl">
            Diproduksi untuk setiap lini motormu.
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PRODUCT_LINES.map((it) => (
              <div key={it.title} className="flex flex-col gap-4 rounded-2xl bg-neutral-900 p-8">
                <h3 className="text-2xl font-medium text-neutral-0">{it.title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-neutral-300">{it.desc}</p>
                <Link to={it.href} className="w-fit">
                  <Button variant="accent" size="sm">{it.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="px-4 pb-16 lg:px-16 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-center gap-3 text-center lg:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-800">
              Produk Terbaru
            </span>
            <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-neutral-900 lg:text-5xl">
              Part pilihan yang paling dicari
            </h2>
            <p className="max-w-md text-neutral-600">
              Kurasi sparepart original terlaris — siap kirim, cocok untuk motor harian maupun modifikasi.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
            {loading ? (
              <ProductGridSkeleton count={4} />
            ) : (
              featured.map((p) => <ProductCard key={p.id} product={p} />)
            )}
          </div>
          <div className="mt-14 flex justify-center">
            <Link to="/search">
              <Button variant="primary" size="lg">Lihat Semua Produk</Button>
            </Link>
          </div>
        </div>
      </section>

      <HowItWorksSection />

      {/* CTA band */}
      <section className="relative overflow-hidden bg-secondary-600 px-4 py-20 text-center lg:px-16">
        <CtaOrnaments />
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900/70">
            Motormu, prioritas kami
          </span>
          <h2 className="mt-4 text-3xl font-medium tracking-tight text-neutral-900 lg:text-5xl">
            Siap upgrade motormu dengan part original?
          </h2>
          <p className="mt-4 text-neutral-900/80">
            Diproduksi sendiri • Gratis ongkir 300rb+ • Kirim se-Indonesia • Bandung
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/search">
              <Button variant="primary" size="lg">Belanja Sekarang</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why choose us — big numbered image cards */}
      <section className="px-4 py-16 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-center gap-3 text-center lg:mb-16">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-800">
              Kenapa DMB
            </span>
            <h2 className="max-w-2xl text-3xl font-medium tracking-tight text-neutral-900 lg:text-5xl">
              Kenapa pilih sparepart DMB?
            </h2>
            <p className="max-w-md text-neutral-600">
              Karena mengurus motor harusnya gampang, jujur, dan cepat — langsung dari produsennya.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {WHY.map((w) => (
              <div
                key={w.n}
                className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl bg-neutral-100"
              >
                <img src={w.img} alt={w.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-900/85 via-neutral-900/20 to-transparent" />
                <div className="relative z-10 flex flex-col gap-1 p-6">
                  <span className="text-sm font-semibold text-secondary-600">{w.n}</span>
                  <h3 className="text-2xl font-medium leading-tight text-neutral-0">{w.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-16 lg:px-16 lg:pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 flex flex-col items-center gap-3 text-center lg:mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-800">
              Pertanyaan Umum
            </span>
            <h2 className="text-3xl font-medium tracking-tight text-neutral-900 lg:text-4xl">
              Masih ragu? Ini jawabannya.
            </h2>
          </div>
          <div className="flex flex-col">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-b border-neutral-200 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-neutral-900">
                  {f.q}
                  <span className="flex size-6 shrink-0 items-center justify-center text-xl text-secondary-800 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="border-t border-neutral-100 px-4 py-14 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 text-center sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <span className="flex size-11 items-center justify-center rounded-full bg-secondary-100 text-secondary-800">
                <Icon />
              </span>
              <span className="font-medium text-neutral-900">{title}</span>
              <span className="text-sm text-neutral-600">{sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Marquee (repeat) */}
      <Marquee />

      <Footer />
    </div>
  )
}

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="overflow-hidden bg-secondary-600 py-3">
      <div className="flex w-max animate-marquee items-center gap-6 whitespace-nowrap pr-6 motion-reduce:animate-none">
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-6 text-sm font-semibold uppercase tracking-wide text-neutral-900">
            {t}
            <span aria-hidden="true" className="text-neutral-900/40">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </svg>
  )
}
function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h16v11H8l-4 3V5z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  )
}

// Decorative, automotive-themed vector accents for the CTA band background.
// Two large, deliberate shapes (a gear + a tachometer) bleeding off opposite
// corners — kept minimal and very low opacity so the content stays dominant.
function CtaOrnaments() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-neutral-900">
      <Gear teeth={12} className="absolute -bottom-24 -left-20 size-72 opacity-[0.06] lg:size-80" />
      <Tachometer className="absolute -right-16 -top-16 size-72 opacity-[0.07] lg:size-80" />
    </div>
  )
}

function Gear({ teeth = 12, className = '' }) {
  const angles = Array.from({ length: teeth }, (_, i) => (i * 360) / teeth)
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      {angles.map((a, i) => (
        <rect key={i} x="46" y="3" width="8" height="15" rx="2" fill="currentColor" transform={`rotate(${a} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="30" strokeWidth="7" />
      <circle cx="50" cy="50" r="12" strokeWidth="6" />
    </svg>
  )
}

// Stylized tachometer / rev counter — a 270° arc with tick marks and a needle.
function Tachometer({ className = '' }) {
  const rad = (deg) => (deg * Math.PI) / 180
  const pt = (deg, r) => [100 + r * Math.cos(rad(deg)), 100 - r * Math.sin(rad(deg))]
  const ticks = Array.from({ length: 11 }, (_, i) => 225 - i * 27) // 225° over the top to -45°
  const [ax, ay] = pt(225, 86)
  const [bx, by] = pt(-45, 86)
  const [nx, ny] = pt(63, 58) // needle tip (upper-right / high revs)
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
      <path d={`M${ax} ${ay} A86 86 0 1 1 ${bx} ${by}`} strokeWidth="4" />
      {ticks.map((a, i) => {
        const [x1, y1] = pt(a, 72)
        const [x2, y2] = pt(a, 86)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={i >= 8 ? 6 : 3} />
      })}
      <line x1="100" y1="100" x2={nx} y2={ny} strokeWidth="6" />
      <circle cx="100" cy="100" r="9" fill="currentColor" stroke="none" />
    </svg>
  )
}
