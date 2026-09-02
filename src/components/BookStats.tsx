import type { YearlyBookStats, FavoriteQuote } from '@/lib/books'

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

function StatTile({
  label,
  value,
  note,
  tooltip,
}: {
  label: string
  value: string | number
  note?: string
  tooltip?: string
}) {
  return (
    <div className="border border-(--border) bg-(--bg) p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <p className="font-mono text-[10px] tracking-widest uppercase text-(--muted)">{label}</p>
        {tooltip && (
          <span className="relative group">
            <button
              type="button"
              className="w-3.5 h-3.5 border border-(--border) flex items-center justify-center shrink-0 text-(--muted) hover:text-(--fg) focus-visible:text-(--fg) focus-visible:outline-none"
              aria-label={tooltip}
            >
              <svg width="6" height="6" viewBox="0 0 14 14" aria-hidden="true">
                <polygon points="7,1 13,13 1,13" fill="currentColor" />
              </svg>
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full mt-2 w-56 max-w-[85vw] border border-(--border) bg-(--bg) text-(--fg) font-mono text-[10px] normal-case tracking-normal leading-snug p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity z-10"
            >
              {tooltip}
            </span>
          </span>
        )}
      </div>
      <p className="font-mono font-black text-3xl leading-none">{value}</p>
      {note && <p className="font-mono text-[10px] text-(--muted)">{note}</p>}
    </div>
  )
}

function QuoteTile({ quote }: { quote: FavoriteQuote }) {
  const name = quote.speaker ?? quote.author
  const attribution = [name, quote.book].filter(Boolean).join(', ')

  return (
    <div className="border border-(--border) bg-(--bg) p-4 flex flex-col gap-1" title={quote.text}>
      <p className="font-mono text-[10px] tracking-widest uppercase text-(--muted)">Favorite Quote</p>
      <p className="font-mono italic text-sm leading-snug line-clamp-3">&ldquo;{quote.text}&rdquo;</p>
      {attribution && <p className="font-mono text-[10px] text-(--muted) truncate">- {attribution}</p>}
    </div>
  )
}

function MonthBars({ data }: { data: number[] }) {
  const max = Math.max(1, ...data)
  return (
    <div className="flex items-end gap-[2px] h-20">
      {data.map((count, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex items-end h-14">
            <div
              className={count === 0 ? 'w-full h-px bg-(--border-soft)' : 'w-full bg-(--fg)'}
              style={count > 0 ? { height: `${(count / max) * 100}%` } : undefined}
              title={`${count} book${count === 1 ? '' : 's'}`}
            />
          </div>
          <span className="font-mono text-[9px] text-(--muted)">{MONTH_LABELS[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function BookStats({
  stats,
  favoriteQuote,
}: {
  stats: YearlyBookStats
  favoriteQuote?: FavoriteQuote | null
}) {
  const hasAnyCompleted = stats.completedCount > 0

  return (
    <section className="mb-16">
      <h2 className="font-mono text-xs tracking-widest uppercase text-(--muted) mb-4">
        Reading Stats ({stats.year})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatTile
          label="Completed this year"
          value={stats.completedCount}
          tooltip="reading is a new habit, started in 2026. the number's small because it's young, not because I stalled."
        />
        <StatTile label="Total pages read" value={stats.totalPages.toLocaleString()} />
        {favoriteQuote && <QuoteTile quote={favoriteQuote} />}
      </div>
      <div className="border border-(--border) bg-(--bg) p-4">
        <p className="font-mono text-[10px] tracking-widest uppercase text-(--muted) mb-3">
          Books per month
        </p>
        <MonthBars data={stats.booksPerMonth} />
        {!hasAnyCompleted && (
          <p className="font-mono text-[10px] text-(--muted) mt-3">
            nothing finished yet this year, first one&apos;s in progress
          </p>
        )}
      </div>
    </section>
  )
}
