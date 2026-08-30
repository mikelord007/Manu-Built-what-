import { cacheLife } from 'next/cache'

export interface StravaRunStats {
  longestRun4wkKm: number
  totalDistance4wkKm: number
  mostRecentRun: { date: string; distanceKm: number } | null
  streakWeeks: number
}

interface StravaActivity {
  type: string
  start_date: string
  distance: number
}

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const LOOKBACK_WEEKS = 12

function computeStreakWeeks(runs: StravaActivity[], now: number): number {
  let streak = 0
  for (let week = 0; ; week++) {
    const weekStart = now - (week + 1) * WEEK_MS
    const weekEnd = now - week * WEEK_MS
    const hasRun = runs.some(r => {
      const t = new Date(r.start_date).getTime()
      return t > weekStart && t <= weekEnd
    })
    if (!hasRun) break
    streak++
  }
  return streak
}

function computeRunStats(runs: StravaActivity[]): StravaRunStats {
  const now = Date.now()
  const last4wk = runs.filter(r => now - new Date(r.start_date).getTime() <= FOUR_WEEKS_MS)

  const longestRun4wkKm = last4wk.reduce((max, r) => Math.max(max, r.distance / 1000), 0)
  const totalDistance4wkKm = last4wk.reduce((sum, r) => sum + r.distance / 1000, 0)

  const mostRecent = [...runs].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  )[0]
  const mostRecentRun = mostRecent
    ? { date: mostRecent.start_date.slice(0, 10), distanceKm: mostRecent.distance / 1000 }
    : null

  return {
    longestRun4wkKm,
    totalDistance4wkKm,
    mostRecentRun,
    streakWeeks: computeStreakWeeks(runs, now),
  }
}

// Requires STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET / STRAVA_REFRESH_TOKEN in
// env (a one-time OAuth authorization against a Strava API app produces the
// refresh token; access tokens themselves expire every 6h so we mint a
// fresh one from the refresh token on every cache miss instead of storing
// it). Any failure — missing env vars, an expired/revoked refresh token, a
// network error — returns null rather than throwing, so the goals page
// always renders and falls back to a manually-entered progress number.
export async function fetchStravaRunStats(): Promise<StravaRunStats | null> {
  'use cache'
  cacheLife('hours')

  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) return null

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    if (!tokenRes.ok) return null
    const tokenData = await tokenRes.json()
    const accessToken = tokenData?.access_token
    if (typeof accessToken !== 'string') return null

    const after = Math.floor((Date.now() - LOOKBACK_WEEKS * WEEK_MS) / 1000)
    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?${new URLSearchParams({
        after: String(after),
        per_page: '100',
      })}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!activitiesRes.ok) return null
    const activities: StravaActivity[] = await activitiesRes.json()
    const runs = activities.filter(a => a.type === 'Run')

    return computeRunStats(runs)
  } catch (error) {
    console.warn('Failed to fetch Strava run stats', error)
    return null
  }
}
