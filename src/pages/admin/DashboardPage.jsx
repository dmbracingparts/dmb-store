import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, Tag, CheckCircle, FileDashed, Sparkle, Plus, ArrowSquareOut, ArrowRight,
} from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../store/StoreProvider'
import { formatCurrency } from '../../utils/formatCurrency'
import { SectionCard, BarChart, BarChartSkeleton, StatRow, StatusPill, Skeleton } from '../../components/admin/ui/Bento'

const STOREFRONT_URL = 'https://dmb-store.vercel.app'

function RecentProductSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="size-12 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-1.5 h-3 w-20" />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

function StatRowSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-1.5 h-5 w-10" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { products = [], categories = [], catalogLoading } = useStore()
  const { currentUser, isEditor } = useAuth()
  const name = currentUser?.name?.split(' ')[0] || 'Admin'

  const published = products.filter((p) => p.published).length
  const draft = products.length - published
  const featured = products.filter((p) => p.isFeatured).length
  const totalCategories = categories.length

  const catName = (id) => categories.find((c) => c.id === id)?.name || id

  const distribution = useMemo(
    () => categories.map((c) => ({ label: c.name, value: products.filter((p) => p.category === c.id).length })),
    [products, categories],
  )

  const recentProducts = useMemo(() => [...products].slice(-6).reverse(), [products])

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="adm-page-in mx-auto flex max-w-[1240px] flex-col gap-4 p-4 lg:p-6">
      {/* Hero band */}
      <section className="relative overflow-hidden rounded-[20px] bg-black px-6 py-7 text-white lg:px-8">
        {/* decorative pattern */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-24 size-72 rounded-full bg-[var(--adm-mint)] opacity-[0.10] blur-2xl" />
          <div className="absolute -bottom-28 right-40 size-72 rounded-full bg-white opacity-[0.04] blur-2xl" />
          <div className="absolute right-10 top-8 size-40 rounded-3xl border border-white/10" />
          <div className="absolute right-28 -top-6 size-40 rounded-3xl border border-white/[0.06]" />
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[13px] font-medium text-white/60">Halo, {name} · {today}</p>
            <p className="mt-3 text-[13px] font-medium uppercase tracking-wide text-white/50">Total Produk di Katalog</p>
            {catalogLoading ? (
              <div className="mt-2 flex items-end gap-3">
                <Skeleton dark className="h-[46px] w-20" />
                <Skeleton dark className="mb-1 h-6 w-24 rounded-full" />
              </div>
            ) : (
              <div className="mt-1.5 flex items-end gap-3">
                <span className="adm-nums text-[46px] font-semibold leading-none">{products.length}</span>
                <span className="mb-1 inline-flex items-center rounded-full bg-[var(--adm-mint)] px-2.5 py-1 text-[12px] font-semibold text-black">
                  {published} published
                </span>
              </div>
            )}
            <p className="mt-2.5 text-[13px] text-white/50">Sinkron langsung ke storefront DMB</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEditor && (
              <Link
                to="/admin/products/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--adm-mint)] px-4 py-2.5 text-[14px] font-semibold text-black transition-transform hover:-translate-y-0.5"
              >
                <Plus size={18} weight="bold" /> Tambah Produk
              </Link>
            )}
            <a
              href={STOREFRONT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[14px] font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <ArrowSquareOut size={18} /> Lihat Storefront
            </a>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[14px] font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <Package size={18} /> Kelola Produk
            </Link>
          </div>
        </div>
      </section>

      {/* Chart + summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Produk per Kategori"
          subtitle="Sebaran katalog"
          className="lg:col-span-2"
        >
          {catalogLoading ? (
            <div className="pt-2">
              <BarChartSkeleton bars={5} height={220} />
            </div>
          ) : distribution.length === 0 ? (
            <p className="py-16 text-center text-[14px] text-[var(--adm-muted)]">Belum ada produk.</p>
          ) : (
            <div className="pt-2">
              <BarChart data={distribution} height={220} />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ringkasan">
          <div className="flex flex-col gap-5 pt-1">
            {catalogLoading ? (
              <>
                <StatRowSkeleton />
                <StatRowSkeleton />
                <StatRowSkeleton />
                <StatRowSkeleton />
              </>
            ) : (
              <>
                <StatRow icon={CheckCircle} tone="green" label="Produk Published" value={published} />
                <StatRow icon={FileDashed} tone="amber" label="Produk Draft" value={draft} />
                <StatRow icon={Sparkle} tone="brand" label="Produk Unggulan" value={featured} />
                <StatRow icon={Tag} tone="blue" label="Total Kategori" value={totalCategories} />
              </>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent products */}
      <SectionCard
        title="Produk Terbaru"
        action={
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--adm-info)] hover:underline"
          >
            Lihat semua <ArrowRight size={14} />
          </Link>
        }
      >
        {catalogLoading ? (
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <RecentProductSkeleton key={i} />)}
          </div>
        ) : recentProducts.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-[var(--adm-muted)]">Belum ada produk.</p>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {recentProducts.map((p) => (
              <Link
                key={p.id}
                to={`/admin/products/${p.id}`}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[var(--adm-bg)]"
              >
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--adm-bg)]">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="size-full object-contain p-1" />
                  ) : (
                    <Package size={18} className="text-[var(--adm-muted)]" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-[var(--adm-ink)]">{p.name}</p>
                  <p className="truncate text-[12px] text-[var(--adm-muted)]">{catName(p.category)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[13px] font-semibold adm-nums text-[var(--adm-ink)]">{formatCurrency(p.price)}</span>
                  <StatusPill published={p.published} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
