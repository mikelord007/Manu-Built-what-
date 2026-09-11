import { isInYear } from './calendar'

export type BookStatus = 'completed' | 'reading' | 'upcoming'

export interface BookMeta {
  id: string
  slug: string
  title: string
  author: string
  status: BookStatus
  cover?: string
  startedDate?: string
  finishedDate?: string
  pages?: number
  rating?: number
  summary?: string
  whatChangedForMe?: string
  link?: string
  order?: number
  favoriteQuote?: string
  quoteSpeaker?: string
}

export interface YearlyBookStats {
  year: number
  completedCount: number
  booksPerMonth: number[]
  totalPages: number
}

export interface FavoriteQuote {
  text: string
  book?: string
  author?: string
  speaker?: string
}

export function getCurrentlyReading(books: BookMeta[]): BookMeta[] {
  return books.filter(b => b.status === 'reading')
    .sort((a, b) => (b.startedDate ?? '').localeCompare(a.startedDate ?? '') || a.id.localeCompare(b.id))
}

export function getUpcomingReads(books: BookMeta[]): BookMeta[] {
  return books.filter(b => b.status === 'upcoming')
    .sort((a, b) => ((a.order ?? Infinity) - (b.order ?? Infinity)) || a.id.localeCompare(b.id))
    .slice(0, 4)
}

export function getCompletedBooks(books: BookMeta[]): BookMeta[] {
  return books.filter(b => b.status === 'completed')
    .sort((a, b) => (b.finishedDate ?? '').localeCompare(a.finishedDate ?? '') || a.id.localeCompare(b.id))
}

export function getFavoriteQuote(books: BookMeta[]): FavoriteQuote | null {
  // If several rows have a quote, prefer the most recently finished book,
  // then stable page ID. Clearing the field removes a quote from consideration.
  const book = [...books].sort((a, b) =>
    (b.finishedDate ?? '').localeCompare(a.finishedDate ?? '') || a.id.localeCompare(b.id)
  ).find(b => b.favoriteQuote)
  return book ? { text: book.favoriteQuote!, book: book.title, author: book.author, speaker: book.quoteSpeaker } : null
}

export function getYearlyBookStats(books: BookMeta[], year: number): YearlyBookStats {
  const completed = books.filter(b => b.status === 'completed' && isInYear(b.finishedDate, year))
  const booksPerMonth = Array<number>(12).fill(0)
  let totalPages = 0
  for (const book of completed) {
    booksPerMonth[Number(book.finishedDate!.slice(5, 7)) - 1] += 1
    if (typeof book.pages === 'number') totalPages += book.pages
  }
  return { year, completedCount: completed.length, booksPerMonth, totalPages }
}

export function getReadingGoal(books: BookMeta[], year: number) {
  const last = getCompletedBooks(books).find(b => b.finishedDate)
  return {
    progress: getYearlyBookStats(books, year).completedCount,
    lastFinishedBook: last ? { title: last.title, author: last.author, finishedDate: last.finishedDate! } : null,
  }
}
