import Image from 'next/image'
import type { BookMeta } from '@/lib/books'

function formatBookDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('en-GB').format(parsed)
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating)
  return (
    <span className="font-mono text-sm tracking-wider" aria-label={`${rating} out of 5`}>
      {'★'.repeat(filled)}
      <span className="text-(--muted)">{'★'.repeat(Math.max(0, 5 - filled))}</span>
      <span className="ml-2 text-xs text-(--muted)">{rating}/5</span>
    </span>
  )
}

export default function BookCard({ book }: { book: BookMeta }) {
  return (
    <div className="flex h-full flex-col border border-(--border)">
      <div className="group relative w-full aspect-[2/3] bg-(--fg) overflow-hidden shrink-0">
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
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
      <div className="p-5 flex flex-1 flex-col gap-3">
        <div>
          <h3 className="font-mono font-bold text-sm leading-snug">{book.title}</h3>
          <p className="font-mono text-xs text-(--muted)">{book.author}</p>
        </div>

        {typeof book.rating === 'number' && <Stars rating={book.rating} />}

        {book.summary && (
          <p className="font-mono text-xs leading-relaxed">{book.summary}</p>
        )}

        {book.whatChangedForMe && (
          <div className="pt-3 border-t border-(--border-soft)">
            <p className="font-mono text-[10px] tracking-widest uppercase text-(--muted) mb-1">
              What changed for me
            </p>
            <p className="font-mono text-xs leading-relaxed">{book.whatChangedForMe}</p>
          </div>
        )}

        {book.finishedDate && (
          <p className="mt-auto ml-auto font-mono text-[10px] text-(--muted)">
            Finished {formatBookDate(book.finishedDate)}
          </p>
        )}
      </div>
    </div>
  )
}
