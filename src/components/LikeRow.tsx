import Image from 'next/image'
import type { LikeItem } from '@/lib/likes'

const TYPE_LABEL: Record<LikeItem['type'], string> = {
  essay: 'Read',
  video: 'Watch',
  podcast: 'Listen',
}

export default function LikeRow({ item, priority }: { item: LikeItem; priority?: boolean }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 sm:gap-5 py-5 px-2 -mx-2 border-b border-(--border) transition-colors hover:bg-(--card-hover-bg) hover:text-(--card-hover-fg)"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-(--fg) overflow-hidden">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            sizes="96px"
            priority={priority}
            className="object-cover grayscale group-hover:opacity-20 transition-opacity"
          />
        ) : (
          <div className="w-full h-full bg-(--fg) grid place-items-center">
            <span className="font-mono text-[8px] tracking-[0.15em] uppercase text-(--bg) opacity-40 text-center px-1">
              No Preview
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 min-w-0 justify-center">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-mono font-bold text-sm leading-snug">{item.title}</h2>
          <span className="shrink-0 font-mono text-[10px] font-bold tracking-widest uppercase border border-(--border) px-1.5 py-0.5 text-(--muted) group-hover:text-(--card-hover-fg) group-hover:border-(--card-hover-fg)">
            {item.type}
          </span>
        </div>
        {item.note && (
          <p className="font-mono text-xs leading-relaxed text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-70">
            {item.note}
          </p>
        )}
        {item.author && (
          <p className="font-mono text-xs text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-70">
            {item.author}
          </p>
        )}
        <p className="ml-auto font-mono text-[10px] text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-50">
          [ {TYPE_LABEL[item.type]} ↗ ]
        </p>
      </div>
    </a>
  )
}
