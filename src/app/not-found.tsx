import Link from 'next/link'
import type { Metadata } from 'next'
import TerrainBackground from '@/components/TerrainBackground'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Page Not Found',
  description: "The page you're looking for doesn't exist, moved, or never got built.",
  path: '/404',
  noIndex: true,
})

const ROUTES = [
  {
    n: '01',
    title: 'Home',
    note: 'go back to base.',
    href: '/',
    label: 'Home',
  },
  {
    n: '02',
    title: "Books I'm Reading",
    note: "what I'm reading, and what I've finished.",
    href: '/books',
    label: 'Books',
  },
  {
    n: '03',
    title: 'Worth Your Time',
    note: 'writings, videos, and podcasts I like.',
    href: '/worth-your-time',
    label: 'Worth Your Time',
  },
]

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="w-full max-w-5xl px-4 sm:px-6 pt-16 pb-24">
        <p className="font-mono text-xs tracking-widest uppercase text-(--muted) mb-6">// Error</p>

        <h1 className="font-mono font-black text-[5rem] sm:text-[7rem] leading-none tracking-tight mb-4">
          404
        </h1>
        <p className="font-mono font-bold text-lg sm:text-xl tracking-tight mb-8">
          PAGE NOT FOUND.
        </p>

        <div className="font-mono text-sm text-(--muted) leading-relaxed space-y-3 max-w-lg mb-4">
          <p>// the page you&apos;re looking for doesn&apos;t exist, moved, or never got built.</p>
          <p>
            // you might have:
            <br />
            {'//  - mistyped the address'}
            <br />
            {'//  - followed a dead link'}
            <br />
            {"//  - gone looking for something that isn't here yet"}
          </p>
        </div>

        <div className="relative w-full aspect-[3/2] sm:aspect-[16/7] my-12">
          <TerrainBackground className="absolute inset-0" />
          <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 border border-(--border) bg-(--bg) px-6 py-3 text-center">
            <p className="font-mono font-bold text-sm tracking-widest">404</p>
            <p className="font-mono text-[10px] tracking-widest uppercase text-(--muted)">Unknown Route</p>
          </div>
        </div>

        <p className="font-mono text-xs tracking-widest uppercase text-(--muted) mb-4">// Possible Routes</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {ROUTES.map(r => (
            <Link
              key={r.href}
              href={r.href}
              className="group flex flex-col gap-3 border border-(--border) p-5 transition-colors hover:bg-(--card-hover-bg) hover:text-(--card-hover-fg)"
              data-cuelume-hover="tick"
              data-cuelume-toggle
            >
              <div>
                <p className="font-mono text-xs text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-70">{r.n}</p>
                <p className="font-mono font-bold text-sm border-b border-(--border-soft) pb-2 mt-1">{r.title}</p>
              </div>
              <p className="font-mono text-xs text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-70 flex-1">{r.note}</p>
              <p className="font-mono text-xs underline group-hover:no-underline">[ {r.label} ]</p>
            </Link>
          ))}
        </div>

        <p className="font-mono text-xs text-(--muted) border-t border-(--border) pt-4">
          &gt; or check your URL and try again.
        </p>
      </div>
    </main>
  )
}
