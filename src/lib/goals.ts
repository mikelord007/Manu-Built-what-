import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getAllBooks, getCompletedBooks, getCurrentYear } from './books'
import { fetchWhoopRunStats, type WhoopRunStats } from './whoop'

const goalsDir = path.join(process.cwd(), 'content/goals')
const indexPath = path.join(goalsDir, 'index.md')

export type GoalSource = 'manual' | 'books' | 'whoop'

export interface GoalMeta {
  slug: string
  title: string
  why: string
  deadline: string
  target: number
  unit: string
  progress: number
  // Only set for source: whoop. `whoop` is null if there's no data at all
  // yet (never fetched successfully). `dataStale` is true whenever the
  // live WHOOP call just failed, whether we're showing a cached fallback
  // or the manual number — the goals page uses it to flag "may be off".
  whoop?: WhoopRunStats | null
  dataStale?: boolean
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
    }))
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

async function resolveBooksProgress(): Promise<number> {
  const year = await getCurrentYear()
  const completed = getCompletedBooks(getAllBooks())
  return completed.filter(b => b.finishedDate && new Date(b.finishedDate).getFullYear() === year).length
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
      }

      if (entry.source === 'books') {
        return { ...base, progress: await resolveBooksProgress() }
      }

      if (entry.source === 'whoop') {
        const { stats, stale } = await fetchWhoopRunStats()
        return {
          ...base,
          progress: stats?.longestRun4wkKm ?? entry.manualProgress ?? 0,
          whoop: stats,
          dataStale: stale,
        }
      }

      return { ...base, progress: entry.progress ?? 0 }
    })
  )
}
