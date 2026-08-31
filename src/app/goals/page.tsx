import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllGoals } from '@/lib/goals'
import GoalCard from '@/components/GoalCard'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Goals',
  description: "Manu's 2026 goals and live progress toward them.",
  path: '/goals',
})

export default async function GoalsPage() {
  const goals = await getAllGoals()

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
            2026 Goals
          </h1>
          <p className="font-mono text-sm text-(--muted)">
            what I&apos;m chasing this year, and how it&apos;s going.
          </p>
        </header>

        {goals.length === 0 ? (
          <p className="font-mono text-sm text-(--muted)">nothing set yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {goals.map((goal, i) => (
              <GoalCard key={goal.slug} goal={goal} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
