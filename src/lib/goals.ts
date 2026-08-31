import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getAllBooks, getCompletedBooks, getCurrentYear } from './books'
import { fetchWhoopRunStats, type WhoopRunStats } from './whoop'

const goalsDir = path.join(process.cwd(), 'content/goals')
const indexPath = path.join(goalsDir, 'index.md')

export type GoalSource = 'manual' | 'books' | 'whoop'

export interface HackathonWin {
  project: string
  projectTitle: string
  tweetUrl: string
}

export interface GoalMeta {
  slug: string
  title: string
  why: string
  deadline: string
  target: number
  unit: string
  progress: number
  // A "follow along" link shown next to the goal, if any (e.g. Strava).
  externalUrl?: string
  // Only set for source: whoop. `whoop` is null if there's no data at all
  // yet (never fetched successfully). `dataStale` is true whenever the
  // live WHOOP call just failed, whether we're showing a cached fallback
  // or the manual number — the goals page uses it to flag "may be off".
  whoop?: WhoopRunStats | null
  dataStale?: boolean
  // Only set for source: whoop — needed by WeeklyRunChart, which can't call
  // `new Date()` itself (that's disallowed in a prerendered Server
  // Component; see books.ts's getCurrentYear for the same constraint).
  currentYear?: number
  // Only set for source: books.
  lastFinishedBook?: { title: string; author: string; finishedDate: string } | null
  // Only set when the goal's index entry has a `wins` list (e.g. hackathons).
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
  progress?: number
  manualProgress?: number
  order?: number
  externalUrl?: string
  wins?: HackathonWin[]
}

function readWins(value: unknown): HackathonWin[] | undefined {
  if (!Array.isArray(value)) return undefined
  const wins = value
    .filter((w): w is Record<string, unknown> => !!w && typeof w === 'object')
    .map(w => ({
      project: String(w.project ?? ''),
      projectTitle: String(w.projectTitle ?? w.project ?? ''),
      tweetUrl: String(w.tweetUrl ?? ''),
    }))
    .filter(w => w.project && w.tweetUrl)
  return wins.length > 0 ? wins : undefined
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
      source: ['manual', 'books', 'whoop'].includes(entry.source as string)
        ? (entry.source as GoalSource)
        : 'manual',
      target: typeof entry.target === 'number' ? entry.target : 0,
      unit: (entry.unit as string) ?? '',
      ...(typeof entry.progress === 'number' ? { progress: entry.progress } : {}),
      ...(typeof entry.manualProgress === 'number' ? { manualProgress: entry.manualProgress } : {}),
      ...(typeof entry.order === 'number' ? { order: entry.order } : {}),
      ...(typeof entry.externalUrl === 'string' ? { externalUrl: entry.externalUrl } : {}),
      ...(readWins(entry.wins) ? { wins: readWins(entry.wins) } : {}),
    }))
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

async function resolveBooksGoal(): Promise<{
  progress: number
  lastFinishedBook: GoalMeta['lastFinishedBook']
}> {
  const year = await getCurrentYear()
  const completed = getCompletedBooks(getAllBooks())
  const thisYear = completed.filter(b => b.finishedDate && new Date(b.finishedDate).getFullYear() === year)
  const lastFinished = completed[0]

  return {
    progress: thisYear.length,
    lastFinishedBook: lastFinished
      ? { title: lastFinished.title, author: lastFinished.author, finishedDate: lastFinished.finishedDate ?? '' }
      : null,
  }
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
        ...(entry.externalUrl ? { externalUrl: entry.externalUrl } : {}),
        ...(entry.wins ? { wins: entry.wins } : {}),
      }

      if (entry.source === 'books') {
        const { progress, lastFinishedBook } = await resolveBooksGoal()
        return { ...base, progress, lastFinishedBook }
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
