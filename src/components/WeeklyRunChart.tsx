function formatWeekOf(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}

export default function WeeklyRunChart({ weeklyDistanceKm, year }: { weeklyDistanceKm: number[]; year: number }) {
  if (weeklyDistanceKm.length === 0) return null

  const max = Math.max(1, ...weeklyDistanceKm)
  const yearStart = new Date(year, 0, 1)

  return (
    <div>
      <p className="font-mono text-[10px] tracking-widest uppercase text-(--muted) mb-2">
        Weekly distance ({year})
      </p>
      <div className="flex items-end gap-[2px] h-16">
        {weeklyDistanceKm.map((km, i) => {
          const weekStart = new Date(yearStart)
          weekStart.setDate(weekStart.getDate() + i * 7)
          return (
            <div key={i} className="flex-1 flex items-end h-full" title={`Week of ${formatWeekOf(weekStart)}: ${km.toFixed(1)} km`}>
              <div
                className={km === 0 ? 'w-full h-px bg-(--border-soft)' : 'w-full bg-(--fg) rounded-t-[2px]'}
                style={km > 0 ? { height: `${(km / max) * 100}%` } : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
