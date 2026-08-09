"use client"

import { useState } from 'react'
import type { LikeItem, LikeType } from '@/lib/likes'
import LikeRow from './LikeRow'

type Filter = 'all' | LikeType

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'essay', label: 'Writings' },
  { key: 'video', label: 'Videos' },
  { key: 'podcast', label: 'Podcasts' },
]

export default function LikesFilter({ items }: { items: LikeItem[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = filter === 'all' ? items : items.filter(item => item.type === filter)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-10">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`font-mono text-xs tracking-widest uppercase border px-3 py-1 transition-colors ${
              filter === f.key
                ? 'bg-(--fg) text-(--bg) border-(--fg)'
                : 'bg-(--bg) text-(--fg) border-(--border) hover:bg-(--fg) hover:text-(--bg)'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="font-mono text-sm text-(--muted)">nothing here yet.</p>
      ) : (
        <div className="max-w-3xl border-t border-(--border)">
          {filtered.map((item, i) => (
            <LikeRow key={item.url} item={item} priority={i === 0} />
          ))}
        </div>
      )}
    </div>
  )
}
