import 'server-only'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getBookData, getReadingGoal, getCurrentYear } from './books'
import { getHackathonData } from './notion'
import { getYearlyWins, type HackathonWin } from './notion-model'
import { fetchWhoopRunStats, type WhoopRunStats } from './whoop'

const goalsDir = path.join(process.cwd(), 'content/goals')
const indexPath = path.join(goalsDir, 'index.md')

export type GoalSource = 'manual' | 'books' | 'whoop' | 'hackathons'

export interface GoalMeta {
  slug: string
  title: string
  why: string
  deadline: string
  target: number
  unit: string
  progress: number | null
  // Prefix shown before the "X out of Y unit" line under the progress bar,
  // e.g. "Current mileage" -> "Current mileage: 8.1 out of 21.1 km".
  progressLabel: string
  // A "follow along" link shown next to the goal, if any (e.g. Strava).
  externalUrl?: string
  // Only set for source: whoop. `whoop` is null if there's no data at all
  // yet (never fetched successfully). `dataStale` is true whenever the
  // live WHOOP call just failed, whether we're showing a cached fallback
  // or the manual number — the goals page uses it to flag "may be off".
  whoop?: WhoopRunStats | null
  // Also marks last-good Notion data when a book/win refresh fails.
  dataStale?: boolean
  // Only set for source: whoop — needed by WeeklyRunChart, which can't call
  // `new Date()` itself (that's disallowed in a prerendered Server
  // Component; see books.ts's getCurrentYear for the same constraint).
  currentYear?: number
  // Only set for source: books.
  lastFinishedBook?: { title: string; author: string; finishedDate: string } | null
  // Dated Notion wins for the current calendar year.
  wins?: HackathonWin[]
}

interface GoalIndexEntry {
  slug: string
  title: string
  why: string
  deadline: string
  source: GoalSource
  target: number
  unit: string
  progressLabel: string
  progress?: number
  manualProgress?: number
  order?: number
  externalUrl?: string
}

function readGoalsIndex(): GoalIndexEntry[] {
  if (!fs.existsSync(indexPath)) return []
  const { data } = matter(fs.readFileSync(indexPath, 'utf8'))
  const entries = Array.isArray(data.goals) ? data.goals : []
  return entries
    .filter((entry: unknown): entry is Record<string, unknown> =>
      !!entry && typeof entry === 'object' && typeof (entry as Record<string, unknown>).slug === 'string'
    )
    .map(entry => ({
      slug: entry.slug as string,
      title: (entry.title as string) ?? (entry.slug as string),
      why: (entry.why as string) ?? '',
      deadline: (entry.deadline as string) ?? '',
      source: ['manual', 'books', 'whoop', 'hackathons'].includes(entry.source as string)
        ? (entry.source as GoalSource)
        : 'manual',
      target: typeof entry.target === 'number' ? entry.target : 0,
      unit: (entry.unit as string) ?? '',
      progressLabel: (entry.progressLabel as string) ?? 'Progress',
      ...(typeof entry.progress === 'number' ? { progress: entry.progress } : {}),
      ...(typeof entry.manualProgress === 'number' ? { manualProgress: entry.manualProgress } : {}),
      ...(typeof entry.order === 'number' ? { order: entry.order } : {}),
      ...(typeof entry.externalUrl === 'string' ? { externalUrl: entry.externalUrl } : {}),
    }))
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

export async function getAllGoals(): Promise<GoalMeta[]> {
  const entries = readGoalsIndex()
  return Promise.all(
    entries.map(async (entry): Promise<GoalMeta> => {
      const base = {
        slug: entry.slug,
        title: entry.title,
        why: entry.why,
        deadline: entry.deadline,
        target: entry.target,
        unit: entry.unit,
        progressLabel: entry.progressLabel,
        ...(entry.externalUrl ? { externalUrl: entry.externalUrl } : {}),
      }

      if (entry.source === 'books') {
        const [result, year] = await Promise.all([getBookData(), getCurrentYear()])
        if (result.data === null) return { ...base, progress: null }
        return { ...base, ...getReadingGoal(result.data, year), dataStale: result.status === 'stale' }
      }

      if (entry.source === 'hackathons') {
        const [result, year] = await Promise.all([getHackathonData(), getCurrentYear()])
        if (result.data === null) return { ...base, progress: null }
        const wins = getYearlyWins(result.data, year)
        return { ...base, progress: wins.length, wins, dataStale: result.status === 'stale' }
      }

      if (entry.source === 'whoop') {
        const [{ stats, stale }, currentYear] = await Promise.all([fetchWhoopRunStats(), getCurrentYear()])
        return {
          ...base,
          progress: stats?.longestRun4wkKm ?? entry.manualProgress ?? 0,
          whoop: stats,
          dataStale: stale,
          currentYear,
        }
      }

      return { ...base, progress: entry.progress ?? 0 }
    })
  )
}
