import Link from 'next/link'
import type { GoalMeta } from '@/lib/goals'
import WeeklyRunChart from './WeeklyRunChart'

function formatGoalDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed)
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function ProgressBar({ progress, target, unit }: { progress: number; target: number; unit: string }) {
  const pct = target > 0 ? Math.min(100, Math.max(0, (progress / target) * 100)) : 0
  return (
    <div>
      <div className="h-2 border border-(--border) bg-(--bg)">
        <div className="h-full bg-(--fg)" style={{ width: `${pct}%` }} />
      </div>
      <p className="font-mono text-[10px] text-(--muted) mt-1">
        {formatNumber(progress)} / {formatNumber(target)} {unit}
      </p>
    </div>
  )
}

export default function GoalCard({ goal, index }: { goal: GoalMeta; index: number }) {
  const number = String(index + 1).padStart(2, '0')

  return (
    <div className="py-10 first:pt-0">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-xs tracking-widest text-(--muted) mb-2">{number}</p>
          <h2 className="font-mono font-black text-3xl sm:text-4xl tracking-tight leading-none flex items-center gap-3">
            {goal.title}
            {goal.dataStale && (
              <span
                className="text-amber-500 text-xl shrink-0"
                title="Live data unavailable right now — showing a cached number."
                aria-label="Live data unavailable"
              >
                ⚠
              </span>
            )}
          </h2>
          {goal.why && <p className="font-mono text-sm text-(--muted) mt-2 max-w-lg">{goal.why}</p>}
        </div>
        {goal.deadline && (
          <p className="font-mono text-[10px] text-(--muted) whitespace-nowrap shrink-0 mt-1">
            By {formatGoalDate(goal.deadline)}
          </p>
        )}
      </div>

      <div className="max-w-xl mt-6">
        <ProgressBar progress={goal.progress} target={goal.target} unit={goal.unit} />
      </div>

      <div className="max-w-xl mt-6 flex flex-col gap-5">
        {goal.whoop && goal.currentYear && (
          <>
            <WeeklyRunChart weeklyDistanceKm={goal.whoop.weeklyDistanceKm} year={goal.currentYear} />
            <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] text-(--muted)">
              <span>{goal.whoop.streakWeeks} week{goal.whoop.streakWeeks === 1 ? '' : 's'} streak</span>
              <span>{formatNumber(goal.whoop.totalDistanceYearKm)} km this year</span>
              {goal.whoop.mostRecentRun && (
                <span>
                  Last run {formatGoalDate(goal.whoop.mostRecentRun.date)}, {formatNumber(goal.whoop.mostRecentRun.distanceKm)} km
                </span>
              )}
            </div>
          </>
        )}

        {goal.externalUrl && (
          <a
            href={goal.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs underline hover:no-underline w-fit"
            data-cuelume-hover="tick"
            data-cuelume-toggle
          >
            [ Follow on Strava ]
          </a>
        )}

        {goal.lastFinishedBook && (
          <p className="font-mono text-xs text-(--muted)">
            Last finished: <span className="text-(--fg)">{goal.lastFinishedBook.title}</span>
            {' — '}
            {goal.lastFinishedBook.author}
            {goal.lastFinishedBook.finishedDate && `, ${formatGoalDate(goal.lastFinishedBook.finishedDate)}`}
          </p>
        )}

        {goal.wins && goal.wins.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-widest uppercase text-(--muted)">Wins</p>
            {goal.wins.map(win => (
              <div key={win.project} className="flex items-center gap-4 font-mono text-xs">
                <span className="font-bold">{win.projectTitle}</span>
                <Link
                  href={`/projects/${win.project}`}
                  className="underline hover:no-underline"
                  data-cuelume-hover="tick"
                  data-cuelume-toggle
                >
                  [ Project ]
                </Link>
                <a
                  href={win.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                  data-cuelume-hover="tick"
                  data-cuelume-toggle
                >
                  [ Tweet ]
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
