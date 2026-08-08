// Shared Bento primitives for the admin surface. One design language, reused
// across Dashboard / Produk / Staff so every page reads as the same product.

// Icon-chip tones — tinted background + matching foreground.
const TONES = {
  neutral: { bg: 'var(--adm-bg)', fg: 'var(--adm-ink)' },
  green: { bg: 'var(--adm-instock-bg)', fg: 'var(--adm-instock-text)' },
  amber: { bg: 'var(--adm-lowstock-bg)', fg: 'var(--adm-lowstock-text)' },
  blue: { bg: '#EFF4FF', fg: 'var(--adm-info)' },
  brand: { bg: 'var(--adm-mint)', fg: '#000000' },
}

// A single stat tile: icon chip, big tabular number, label, optional footnote.
// `variant="dark"` renders a filled black tile — the one accent in an otherwise
// white bento, for the hero stat.
export function StatTile({ icon: Icon, tone = 'neutral', label, value, foot, variant = 'light' }) {
  const dark = variant === 'dark'
  const chip = dark ? { bg: 'var(--adm-mint)', fg: '#000000' } : TONES[tone] || TONES.neutral
  return (
    <div
      className={`adm-tile adm-tile-hover flex items-center gap-3.5 p-4 ${dark ? 'border-transparent' : ''}`}
      style={dark ? { background: '#000000' } : undefined}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: chip.bg, color: chip.fg }}
      >
        {Icon && <Icon size={22} weight="bold" />}
      </span>
      <div className="min-w-0">
        <div
          className="adm-nums text-[26px] font-semibold leading-none"
          style={{ color: dark ? '#FFFFFF' : 'var(--adm-ink)' }}
        >
          {value}
        </div>
        <div
          className="mt-1 truncate text-[13px] font-medium"
          style={{ color: dark ? '#A1A1AA' : 'var(--adm-muted)' }}
        >
          {label}
        </div>
        {foot && (
          <div className="mt-0.5 truncate text-[12px]" style={{ color: dark ? '#71717A' : 'var(--adm-muted)' }}>
            {foot}
          </div>
        )}
      </div>
    </div>
  )
}

// A titled container tile with an optional right-aligned action.
export function SectionCard({ title, subtitle, action, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`adm-tile flex flex-col p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-[var(--adm-ink)]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[13px] text-[var(--adm-muted)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

// A side-panel stat row (icon chip + label + big number) — the Income/Expense
// style summary next to the chart.
export function StatRow({ icon: Icon, tone = 'neutral', label, value }) {
  const c = TONES[tone] || TONES.neutral
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: c.bg, color: c.fg }}
      >
        {Icon && <Icon size={20} weight="bold" />}
      </span>
      <div className="min-w-0">
        <div className="truncate text-[13px] text-[var(--adm-muted)]">{label}</div>
        <div className="adm-nums text-[22px] font-semibold leading-tight text-[var(--adm-ink)]">{value}</div>
      </div>
    </div>
  )
}

// A lightweight vertical bar chart (no charting library). Value label hugs the
// top of each bar; category label sits underneath.
export function BarChart({ data, height = 200 }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-stretch gap-2 sm:gap-4" style={{ height }}>
      {data.map((d) => {
        const h = Math.max(4, Math.round((d.value / max) * 100))
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="adm-nums text-[12px] font-semibold text-[var(--adm-ink)]">{d.value}</span>
              <div
                className="w-full max-w-[56px] rounded-t-lg bg-[var(--adm-ink)] transition-[height] duration-500"
                style={{ height: `${h}%` }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="mt-2 line-clamp-2 w-full text-center text-[11px] leading-tight text-[var(--adm-muted)]">
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// A horizontal proportion bar — used for the category distribution.
export function BarRow({ label, value, max }) {
  const pct = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-[13px] text-[var(--adm-text)]">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--adm-bg)]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: 'var(--adm-ink)' }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-[13px] font-semibold adm-nums text-[var(--adm-ink)]">
        {value}
      </span>
    </div>
  )
}

// Shimmering placeholder block — the base skeleton primitive.
export function Skeleton({ className = '', style, dark = false }) {
  return <div className={`${dark ? 'adm-skeleton-dark' : 'adm-skeleton'} ${className}`} style={style} />
}

// Stat tile shaped like StatTile — same footprint so the grid doesn't jump
// once real data replaces it.
export function StatTileSkeleton() {
  return (
    <div className="adm-tile flex items-center gap-3.5 p-4">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// A table row shaped skeleton — `cols` widths (tailwind width classes) let
// each caller mimic its own column layout.
export function RowSkeleton({ cols = ['w-40', 'w-24', 'w-20', 'w-16'], withAvatar = true, leadingCheckbox = false }) {
  return (
    <tr className="border-b border-[var(--adm-border)] last:border-0">
      {leadingCheckbox && (
        <td className="py-3 pl-5">
          <Skeleton className="size-5 rounded-[6px]" />
        </td>
      )}
      {withAvatar ? (
        <td className={`py-3 ${leadingCheckbox ? 'pr-4' : 'pl-5'}`}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-lg" />
            <Skeleton className={`h-4 ${cols[0]}`} />
          </div>
        </td>
      ) : (
        <td className={`py-3 ${leadingCheckbox ? 'pr-4' : 'pl-5'}`}>
          <Skeleton className={`h-4 ${cols[0]}`} />
        </td>
      )}
      {cols.slice(1).map((w, i) => (
        <td key={i} className="py-3 pr-4">
          <Skeleton className={`h-4 ${w}`} />
        </td>
      ))}
      <td className="py-3 pr-5">
        <Skeleton className="h-8 w-24" />
      </td>
    </tr>
  )
}

// Bar-chart shaped skeleton, mirrors BarChart's footprint.
export function BarChartSkeleton({ bars = 5, height = 220 }) {
  return (
    <div className="flex items-end gap-2 sm:gap-4" style={{ height }}>
      {Array.from({ length: bars }, (_, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <Skeleton className="w-full max-w-[56px]" style={{ height: `${40 + ((i * 17) % 50)}%` }} />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

// Published / Draft status pill.
export function StatusPill({ published }) {
  const s = published
    ? { t: 'Published', bg: 'var(--adm-instock-bg)', c: 'var(--adm-instock-text)', b: 'var(--adm-instock-border)' }
    : { t: 'Draft', bg: 'var(--adm-lowstock-bg)', c: 'var(--adm-lowstock-text)', b: 'var(--adm-lowstock-border)' }
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[12px] font-medium"
      style={{ background: s.bg, color: s.c, borderColor: s.b }}
    >
      {s.t}
    </span>
  )
}
