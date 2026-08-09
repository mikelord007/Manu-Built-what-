import Image from 'next/image'
import type { LikeItem } from '@/lib/likes'

const TYPE_LABEL: Record<LikeItem['type'], string> = {
  essay: 'Read',
  video: 'Watch',
  podcast: 'Listen',
}

export default function LikeCard({ item, priority }: { item: LikeItem; priority?: boolean }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col border border-(--border) transition-colors hover:bg-(--card-hover-bg) hover:text-(--card-hover-fg)"
    >
      <div className="relative w-full aspect-video bg-(--fg) overflow-hidden shrink-0">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            priority={priority}
            className="object-cover grayscale group-hover:opacity-20 transition-opacity"
          />
        ) : (
          <div className="w-full h-full bg-(--fg) grid place-items-center">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-(--bg) opacity-40">
              No Preview
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-mono font-bold text-sm leading-snug">{item.title}</h2>
          <span className="shrink-0 font-mono text-[10px] font-bold tracking-widest uppercase border border-(--border) px-1.5 py-0.5 text-(--muted) group-hover:text-(--card-hover-fg) group-hover:border-(--card-hover-fg)">
            {item.type}
          </span>
        </div>
        {item.author && (
          <p className="font-mono text-xs text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-70">{item.author}</p>
        )}
        {item.note && (
          <p className="font-mono text-xs leading-relaxed text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-70">{item.note}</p>
        )}
        <p className="mt-auto ml-auto font-mono text-[10px] text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-50">
          [ {TYPE_LABEL[item.type]} ↗ ]
        </p>
      </div>
    </a>
  )
}
