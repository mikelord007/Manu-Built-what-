import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getAllBooks,
  getCurrentlyReading,
  getUpcomingReads,
  getCompletedBooks,
  getYearlyBookStats,
  getCurrentYear,
  getFavoriteQuote,
  withResolvedMetadata,
} from '@/lib/books'
import ReadingCard from '@/components/ReadingCard'
import BookCard from '@/components/BookCard'
import BookStats from '@/components/BookStats'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Books',
  description: "What Manu is reading, plans to read, and has finished, plus yearly stats.",
  path: '/books',
})

export default async function BooksPage() {
  const books = await withResolvedMetadata(getAllBooks())
  const currentlyReading = getCurrentlyReading(books)
  const upcomingReads = getUpcomingReads(books)
  const completedBooks = getCompletedBooks(books)
  const stats = getYearlyBookStats(books, await getCurrentYear())
  const favoriteQuote = getFavoriteQuote()

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-5xl px-4 sm:px-6 pt-16 pb-24">
        <Link
          href="/"
          className="font-mono text-xs tracking-widest uppercase underline mb-10 block text-(--muted) hover:text-(--fg)"
          data-cuelume-hover="tick"
          data-cuelume-toggle
        >
          ← back
        </Link>

        <header className="mb-16">
          <h1 className="font-mono font-black text-4xl sm:text-5xl tracking-tight leading-none mb-2">
            Books
          </h1>
          <p className="font-mono text-sm text-(--muted)">
            what I&apos;m reading, what&apos;s next, and what I&apos;ve finished.
          </p>
        </header>

        <div className="mb-16 border border-(--border) bg-(--bg) p-4 flex items-start gap-4">
          <div className="w-8 h-8 border border-(--border) flex items-center justify-center shrink-0" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 14 14">
              <polygon points="7,1 13,13 1,13" fill="currentColor" />
            </svg>
          </div>
          <p className="font-mono text-sm text-(--muted)">
            reading is a new habit for me, started in 2026. the shelf is thin because the habit is young, not
            because I stalled, one book at a time, tracked here as it happens.
          </p>
        </div>

        <BookStats stats={stats} favoriteQuote={favoriteQuote} />

        <section className="mb-16">
          <h2 className="font-mono text-xs tracking-widest uppercase text-(--muted) mb-4">
            Currently Reading
          </h2>
          {currentlyReading.length === 0 ? (
            <p className="font-mono text-sm text-(--muted)">nothing in progress right now.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentlyReading.map((book, i) => (
                <ReadingCard key={book.slug} book={book} priority={i === 0} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-16">
          <h2 className="font-mono text-xs tracking-widest uppercase text-(--muted) mb-4">
            Completed
          </h2>
          {completedBooks.length === 0 ? (
            <p className="font-mono text-sm text-(--muted)">
              nothing finished yet, first one&apos;s still in progress.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {completedBooks.map(book => (
                <BookCard key={book.slug} book={book} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-mono text-xs tracking-widest uppercase text-(--muted) mb-4">
            Upcoming Reads
          </h2>
          {upcomingReads.length === 0 ? (
            <p className="font-mono text-sm text-(--muted)">nothing queued yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {upcomingReads.map(book => (
                <ReadingCard key={book.slug} book={book} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
