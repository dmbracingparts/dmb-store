// Placeholder that mirrors ProductCard's layout while products load, so the
// grid keeps its shape instead of collapsing to a centered spinner.
export default function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5 p-2 motion-reduce:animate-none" aria-hidden="true">
      <div className="aspect-square w-full rounded-md bg-neutral-100" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-12 rounded bg-neutral-100" />
          <div className="h-4 w-3/4 rounded bg-neutral-100" />
        </div>
        <div className="h-5 w-24 rounded bg-neutral-100" />
      </div>
    </div>
  )
}

// A grid of skeleton cards, matching the catalog grid columns.
export function ProductGridSkeleton({ count = 8 }) {
  return Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)
}
