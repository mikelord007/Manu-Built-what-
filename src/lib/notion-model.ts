import type { BookMeta, BookStatus } from './book-model'
import { calendarDate, isInYear } from './calendar'
import { safeHttpUrl } from './safe-url'

export type NotionKind = 'books' | 'hackathons'
export type JsonObject = Record<string, unknown>

export function object(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {}
}

export const requiredSchemas = {
  books: {
    Title: 'title', Author: 'rich_text', Status: 'select', 'Finish Date': 'date',
    Rating: 'number', 'Cover Url': 'url', Slug: 'rich_text', Order: 'number',
    'Favorite Quote': 'rich_text', 'Quote Speaker': 'rich_text',
  },
  hackathons: { Name: 'title', Date: 'date', 'Project Url': 'url', 'Social Url': 'url' },
} as const

export const optionalBookSchema = {
  Summary: 'rich_text', 'What Changed For Me': 'rich_text', 'Start Date': 'date', Pages: 'number', Link: 'url',
} as const

export function matchesSchema(value: unknown, kind: NotionKind): boolean {
  const properties = object(value)
  return Object.entries(requiredSchemas[kind]).every(([name, type]) => object(properties[name]).type === type) &&
    (kind !== 'books' || Object.entries(optionalBookSchema).every(([name, type]) =>
      properties[name] === undefined || object(properties[name]).type === type))
}

export function richText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value.map(segment => {
    const part = object(segment)
    return typeof part.plain_text === 'string' ? part.plain_text :
      typeof object(part.text).content === 'string' ? object(part.text).content as string : ''
  }).join('')
}

function property(properties: JsonObject, name: string, type: string): unknown {
  const prop = object(properties[name])
  if (prop.type !== undefined && prop.type !== type) throw new Error('Unexpected Notion property type')
  return prop[type]
}

function text(properties: JsonObject, name: string, type = 'rich_text'): string {
  return richText(property(properties, name, type)).trim()
}

function number(properties: JsonObject, name: string): number | undefined {
  const value = property(properties, name, 'number')
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function date(properties: JsonObject, name: string): string | undefined {
  return calendarDate(object(property(properties, name, 'date')).start)
}

function page(value: unknown): { id: string; properties: JsonObject } | null {
  const row = object(value)
  if (row.object !== 'page' || typeof row.id !== 'string' || !row.properties) throw new Error('Invalid Notion page')
  if (row.archived || row.in_trash) return null
  return { id: row.id, properties: object(row.properties) }
}

export function normalizeBooks(rows: unknown[]): BookMeta[] {
  const statuses: Record<string, BookStatus> = { Upcoming: 'upcoming', 'Currently Reading': 'reading', Completed: 'completed' }
  return rows.flatMap(value => {
    const row = page(value)
    if (!row) return []
    const p = row.properties
    const title = text(p, 'Title', 'title')
    const status = object(property(p, 'Status', 'select')).name
    // New blank rows are drafts. Unexpected nonblank statuses are an error,
    // rather than silently lowering the public completed count.
    if (!title || status === undefined) return []
    if (typeof status !== 'string' || !Object.hasOwn(statuses, status)) throw new Error('Unknown Notion book status')
    const rating = number(p, 'Rating')
    const pages = number(p, 'Pages')
    return [{
      id: row.id,
      slug: text(p, 'Slug') || row.id,
      title,
      author: text(p, 'Author'),
      status: statuses[status],
      cover: safeHttpUrl(property(p, 'Cover Url', 'url')),
      startedDate: date(p, 'Start Date'),
      finishedDate: date(p, 'Finish Date'),
      rating: rating !== undefined && rating >= 0 && rating <= 5 ? rating : undefined,
      pages: pages !== undefined && Number.isInteger(pages) && pages > 0 ? pages : undefined,
      order: number(p, 'Order'),
      summary: text(p, 'Summary') || undefined,
      whatChangedForMe: text(p, 'What Changed For Me') || undefined,
      link: safeHttpUrl(property(p, 'Link', 'url')),
      favoriteQuote: text(p, 'Favorite Quote') || undefined,
      quoteSpeaker: text(p, 'Quote Speaker') || undefined,
    }]
  })
}

export interface HackathonWin {
  id: string
  projectTitle: string
  date?: string
  projectUrl?: string
  tweetUrl?: string
}

export function normalizeHackathons(rows: unknown[]): HackathonWin[] {
  return rows.flatMap(value => {
    const row = page(value)
    if (!row) return []
    const p = row.properties
    const projectTitle = text(p, 'Name', 'title')
    if (!projectTitle) return []
    return [{ id: row.id, projectTitle, date: date(p, 'Date'),
      projectUrl: safeHttpUrl(property(p, 'Project Url', 'url')),
      tweetUrl: safeHttpUrl(property(p, 'Social Url', 'url')) }]
  })
}

export function getYearlyWins(wins: HackathonWin[], year: number): HackathonWin[] {
  return wins.filter(win => isInYear(win.date, year))
    .sort((a, b) => b.date!.localeCompare(a.date!) || a.id.localeCompare(b.id))
}
