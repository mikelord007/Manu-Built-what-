// Notion's calendar date is the date written in the property, including when
// a time/offset is supplied. Never let the server/browser timezone move it.
export function calendarDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return
  const day = value.slice(0, 10)
  const parsed = new Date(`${day}T00:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) return
  if (value.length > 10 && !Number.isFinite(Date.parse(value))) return
  return day
}

export function isInYear(date: string | undefined, year: number): boolean {
  return !!date && calendarDate(date)?.slice(0, 4) === String(year)
}

export function formatCalendarDate(date: string, long = false): string {
  const day = calendarDate(date)
  if (!day) return date
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    ...(long ? { day: 'numeric', month: 'short', year: 'numeric' } as const : {}),
  }).format(new Date(`${day}T00:00:00Z`))
}
