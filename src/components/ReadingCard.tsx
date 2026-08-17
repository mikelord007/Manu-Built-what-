import Image from 'next/image'
import type { BookMeta } from '@/lib/books'

function formatBookDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('en-GB').format(parsed)
}

export default function ReadingCard({ book, priority }: { book: BookMeta; priority?: boolean }) {
  return (
    <div className="flex h-full flex-col border border-(--border)">
      <div className="group relative w-full aspect-[2/3] bg-(--fg) overflow-hidden shrink-0">
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
            priority={priority}
            className="object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0"
          />
        ) : (
          <div className="w-full h-full bg-(--fg) grid place-items-center">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-(--bg) opacity-40 px-2 text-center">
              No Cover
            </span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-1 flex-col gap-1 bg-(--bg)">
        <h3 className="font-mono font-bold text-sm leading-snug">{book.title}</h3>
        <p className="font-mono text-xs text-(--muted)">{book.author}</p>
        {book.startedDate && (
          <p className="mt-auto font-mono text-[10px] text-(--muted)">
            Started {formatBookDate(book.startedDate)}
          </p>
        )}
        {book.link && (
          <a
            href={book.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto font-mono text-xs underline hover:no-underline"
          >
            [ Info ↗ ]
          </a>
        )}
      </div>
    </div>
  )
}
