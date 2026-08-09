import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllLikes } from '@/lib/likes'
import LikeCard from '@/components/LikeCard'

export const metadata: Metadata = {
  title: 'Worth Your Time',
  description: 'Writings, videos, and podcasts Manu recommends.',
  alternates: {
    canonical: '/worth-your-time',
  },
}

export default function WorthYourTimePage() {
  const items = getAllLikes()

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-5xl px-4 sm:px-6 pt-16 pb-24">
        <Link
          href="/"
          className="font-mono text-xs tracking-widest uppercase underline mb-10 block text-(--muted) hover:text-(--fg)"
        >
          ← back
        </Link>

        <header className="mb-16">
          <h1 className="font-mono font-black text-4xl sm:text-5xl tracking-tight leading-none mb-2">
            Worth Your Time
          </h1>
          <p className="font-mono text-sm text-(--muted)">
            writings, podcasts, and videos I keep coming back to.
          </p>
        </header>

        {items.length === 0 ? (
          <p className="font-mono text-sm text-(--muted)">nothing here yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => (
              <LikeCard key={item.url} item={item} priority={i === 0} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
