import Link from 'next/link'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy',
  description: 'What data this site touches, and what happens to it.',
  path: '/privacy',
})

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="font-mono text-xs tracking-widest uppercase text-(--muted) mb-3">{title}</h2>
      <div className="font-mono text-sm leading-relaxed space-y-3 max-w-2xl">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
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
            Privacy
          </h1>
          <p className="font-mono text-sm text-(--muted)">
            this is a personal site, so this is a short page.
          </p>
        </header>

        <Section title="Who runs this">
          <p>
            This site (manu built what?) is built and run by one person, Manu, not a
            company. There&apos;s no ad network and nothing here is sold to third parties.
          </p>
        </Section>

        <Section title="Analytics">
          <p>
            The site uses PostHog to see basic, aggregate usage (which pages get visited,
            roughly how much traffic). This is standard client-side web analytics, not
            tied to your identity.
          </p>
        </Section>

        <Section title="Third-party data on this site">
          <p>
            The /books page fetches public book metadata (covers, page counts) from the
            Google Books and Open Library APIs, by title and author only.
          </p>
          <p>
            The /goals page displays Manu&apos;s own running progress, pulled from his own
            WHOOP account via WHOOP&apos;s developer API. That connection is authorized by
            Manu, reads only his own workout data (distance, date, sport type), and is
            used solely to compute and display the aggregate stats shown on that page
            (e.g. distance in the last 4 weeks, a weekly streak). It is not stored beyond
            normal server-side caching used to avoid hitting WHOOP&apos;s API on every page
            load, and it is not shared with anyone else.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            Reach out at{' '}
            <a href="mailto:manujasan23@gmail.com" className="underline hover:no-underline">
              manujasan23@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  )
}
