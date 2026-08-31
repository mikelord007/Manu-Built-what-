import { cacheLife } from 'next/cache'

export interface WhoopRunStats {
  longestRun4wkKm: number
  totalDistanceYearKm: number
  mostRecentRun: { date: string; distanceKm: number } | null
  streakWeeks: number
}

// `stale: true` means this isn't a live read — either the last successfully
// fetched stats (served because the live call just failed) or, when there's
// no prior success to fall back to, none of it. The goals page uses this to
// show a "data may be off" warning without hiding the numbers it does have.
export interface WhoopResult {
  stats: WhoopRunStats | null
  stale: boolean
}

interface WhoopWorkout {
  sport_name: string
  start: string
  score?: { distance_meter?: number } | null
}

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const MAX_PAGES = 20

const REFRESH_TOKEN_KEY = 'whoop:refresh_token'
const LAST_GOOD_STATS_KEY = 'whoop:last_good_stats'

async function redisGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const res = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  const data = await res.json()
  return typeof data?.result === 'string' ? data.result : null
}

async function redisSet(key: string, value: string): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return
  await fetch(`${url}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: value,
  })
}

// WHOOP rotates its refresh token on every use (the old one is invalidated
// the moment a new access token is minted), unlike Strava's, which stays
// valid forever. So the current token can't just live in a static env var
// — it's read from and written back to a tiny Upstash Redis store (REST
// API, no client library needed) every time this function actually runs.
// The same store also keeps the last successfully fetched stats, so a
// failed live call has something better than a bare zero to fall back to.
function getStoredRefreshToken(): Promise<string | null> {
  return redisGet(REFRESH_TOKEN_KEY)
}

function storeRefreshToken(refreshToken: string): Promise<void> {
  return redisSet(REFRESH_TOKEN_KEY, refreshToken)
}

// Guards against a stale cached entry left over from a previous shape of
// WhoopRunStats (e.g. a field got renamed) — treat it as absent rather than
// handing the caller a value with missing fields.
function isValidStats(value: unknown): value is WhoopRunStats {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.longestRun4wkKm === 'number' &&
    typeof v.totalDistanceYearKm === 'number' &&
    typeof v.streakWeeks === 'number' &&
    (v.mostRecentRun === null || typeof v.mostRecentRun === 'object')
  )
}

async function getLastGoodStats(): Promise<WhoopRunStats | null> {
  const raw = await redisGet(LAST_GOOD_STATS_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return isValidStats(parsed) ? parsed : null
  } catch {
    return null
  }
}

function storeLastGoodStats(stats: WhoopRunStats): Promise<void> {
  return redisSet(LAST_GOOD_STATS_KEY, JSON.stringify(stats))
}

function computeStreakWeeks(runs: WhoopWorkout[], now: number): number {
  let streak = 0
  for (let week = 0; ; week++) {
    const weekStart = now - (week + 1) * WEEK_MS
    const weekEnd = now - week * WEEK_MS
    const hasRun = runs.some(r => {
      const t = new Date(r.start).getTime()
      return t > weekStart && t <= weekEnd
    })
    if (!hasRun) break
    streak++
  }
  return streak
}

function computeRunStats(runs: WhoopWorkout[]): WhoopRunStats {
  const now = Date.now()
  const distanceKm = (w: WhoopWorkout) => (w.score?.distance_meter ?? 0) / 1000
  const last4wk = runs.filter(r => now - new Date(r.start).getTime() <= FOUR_WEEKS_MS)

  const longestRun4wkKm = last4wk.reduce((max, r) => Math.max(max, distanceKm(r)), 0)
  // `runs` is already scoped to the current calendar year (see fetchLive),
  // so summing all of it is the year-to-date total.
  const totalDistanceYearKm = runs.reduce((sum, r) => sum + distanceKm(r), 0)

  const mostRecent = [...runs].sort(
    (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()
  )[0]
  const mostRecentRun = mostRecent
    ? { date: mostRecent.start.slice(0, 10), distanceKm: distanceKm(mostRecent) }
    : null

  return {
    longestRun4wkKm,
    totalDistanceYearKm,
    mostRecentRun,
    streakWeeks: computeStreakWeeks(runs, now),
  }
}

async function fetchAllWorkouts(accessToken: string, after: number): Promise<WhoopWorkout[]> {
  const workouts: WhoopWorkout[] = []
  let nextToken: string | undefined

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      limit: '25',
      start: new Date(after).toISOString(),
      ...(nextToken ? { nextToken } : {}),
    })
    const res = await fetch(`https://api.prod.whoop.com/developer/v2/activity/workout?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) break
    const data = await res.json()
    workouts.push(...(Array.isArray(data?.records) ? data.records : []))
    nextToken = data?.next_token || undefined
    if (!nextToken) break
  }

  return workouts
}

// The live path. Requires WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET plus a
// refresh token seeded into Upstash. Returns null on any failure — missing
// env vars, an invalidated refresh token, a network error — so the caller
// can fall back to the last known-good stats instead.
async function fetchLive(): Promise<WhoopRunStats | null> {
  const clientId = process.env.WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  try {
    const refreshToken = await getStoredRefreshToken()
    if (!refreshToken) return null

    const tokenRes = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'offline',
      }),
    })
    if (!tokenRes.ok) return null
    const tokenData = await tokenRes.json()
    const accessToken = tokenData?.access_token
    const newRefreshToken = tokenData?.refresh_token
    if (typeof accessToken !== 'string' || typeof newRefreshToken !== 'string') return null

    // Persist the rotated token before doing anything else with the access
    // token, so a failure fetching workouts below never strands us with an
    // already-invalidated refresh token.
    await storeRefreshToken(newRefreshToken)

    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime()
    const workouts = await fetchAllWorkouts(accessToken, yearStart)
    const runs = workouts.filter(w => w.sport_name === 'running')

    return computeRunStats(runs)
  } catch (error) {
    console.warn('Failed to fetch WHOOP run stats', error)
    return null
  }
}

export async function fetchWhoopRunStats(): Promise<WhoopResult> {
  'use cache'
  cacheLife('hours')

  const live = await fetchLive()
  if (live) {
    await storeLastGoodStats(live)
    return { stats: live, stale: false }
  }

  const lastGood = await getLastGoodStats()
  return { stats: lastGood, stale: true }
}
