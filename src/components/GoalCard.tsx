import type { GoalMeta } from '@/lib/goals'

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

export default function GoalCard({ goal }: { goal: GoalMeta }) {
  return (
    <div className="flex h-full flex-col gap-4 border border-(--border) bg-(--bg) p-5">
      <div>
        <h3 className="font-mono font-bold text-sm leading-snug">{goal.title}</h3>
        {goal.why && <p className="font-mono text-xs text-(--muted) mt-1">{goal.why}</p>}
      </div>

      <ProgressBar progress={goal.progress} target={goal.target} unit={goal.unit} />

      {goal.strava && (
        <div className="flex flex-col gap-1 pt-3 border-t border-(--border-soft)">
          <p className="font-mono text-[10px] text-(--muted)">
            {goal.strava.streakWeeks} week{goal.strava.streakWeeks === 1 ? '' : 's'} streak
          </p>
          <p className="font-mono text-[10px] text-(--muted)">
            {formatNumber(goal.strava.totalDistance4wkKm)} km in the last 4 weeks
          </p>
          {goal.strava.mostRecentRun && (
            <p className="font-mono text-[10px] text-(--muted)">
              Last run {formatGoalDate(goal.strava.mostRecentRun.date)}, {formatNumber(goal.strava.mostRecentRun.distanceKm)} km
            </p>
          )}
        </div>
      )}

      {goal.deadline && (
        <p className="mt-auto ml-auto font-mono text-[10px] text-(--muted)">
          By {formatGoalDate(goal.deadline)}
        </p>
      )}
    </div>
  )
}
