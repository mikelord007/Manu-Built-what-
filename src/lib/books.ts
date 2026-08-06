import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const booksDir = path.join(process.cwd(), 'content/books')

export type BookStatus = 'completed' | 'reading' | 'upcoming'

export interface BookMeta {
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
}

export interface YearlyBookStats {
  year: number
  completedCount: number
  booksPerMonth: number[]
  totalPages: number
  averageRating: number | null
}

interface OpenLibraryMeta {
  cover?: string
  pages?: number
}

async function fetchOpenLibraryMeta(title: string, author: string): Promise<OpenLibraryMeta> {
  try {
    const q = `title:"${title}" author:"${author}"`
    const url = `https://openlibrary.org/search.json?${new URLSearchParams({
      q,
      fields: 'cover_i,number_of_pages_median',
      limit: '1',
    })}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'manu-built-what-portfolio/1.0 (manujasan23@gmail.com)' },
      cache: 'force-cache',
    })
    if (!res.ok) return {}
    const data = await res.json()
    const doc = data?.docs?.[0]
    if (!doc) return {}
    return {
      cover: typeof doc.cover_i === 'number' ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
      pages: typeof doc.number_of_pages_median === 'number' ? doc.number_of_pages_median : undefined,
    }
  } catch (error) {
    console.warn(`Failed to fetch Open Library metadata for "${title}"`, error)
    return {}
  }
}

// Covers and page counts are fetched automatically from Open Library so books
// only need title/author/status in frontmatter. A manually set `cover` or
// `pages` value in frontmatter always wins over the fetched one.
export async function withResolvedMetadata(books: BookMeta[]): Promise<BookMeta[]> {
  return Promise.all(
    books.map(async book => {
      if (book.cover && typeof book.pages === 'number') return book
      const meta = await fetchOpenLibraryMeta(book.title, book.author)
      return {
        ...book,
        cover: book.cover ?? meta.cover,
        pages: book.pages ?? meta.pages,
      }
    })
  )
}

export function getAllBooks(): BookMeta[] {
  if (!fs.existsSync(booksDir)) return []
  const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.md'))
  return files
    .map<BookMeta | null>(filename => {
      const slug = filename.replace(/\.md$/, '')
      const fullPath = path.join(booksDir, filename)
      try {
        const { data } = matter(fs.readFileSync(fullPath, 'utf8'))
        const status: BookStatus = ['completed', 'reading', 'upcoming'].includes(data.status)
          ? data.status
          : 'upcoming'
        return {
          slug,
          title: data.title ?? slug,
          author: data.author ?? '',
          status,
          ...(data.cover ? { cover: data.cover } : {}),
          ...(data.startedDate ? { startedDate: String(data.startedDate) } : {}),
          ...(data.finishedDate ? { finishedDate: String(data.finishedDate) } : {}),
          ...(typeof data.pages === 'number' ? { pages: data.pages } : {}),
          ...(typeof data.rating === 'number' ? { rating: data.rating } : {}),
          ...(data.summary ? { summary: data.summary } : {}),
          ...(data.whatChangedForMe ? { whatChangedForMe: data.whatChangedForMe } : {}),
          ...(data.link ? { link: data.link } : {}),
          ...(typeof data.order === 'number' ? { order: data.order } : {}),
        }
      } catch (error) {
        console.warn(`Skipping invalid book file: ${filename}`, error)
        return null
      }
    })
    .filter((book): book is BookMeta => book !== null)
}

export function getCurrentlyReading(books: BookMeta[]): BookMeta[] {
  return books
    .filter(b => b.status === 'reading')
    .sort((a, b) => (a.startedDate ?? '') < (b.startedDate ?? '') ? 1 : -1)
}

export function getUpcomingReads(books: BookMeta[]): BookMeta[] {
  return books
    .filter(b => b.status === 'upcoming')
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
}

export function getCompletedBooks(books: BookMeta[]): BookMeta[] {
  return books
    .filter(b => b.status === 'completed')
    .sort((a, b) => (a.finishedDate ?? '') < (b.finishedDate ?? '') ? 1 : -1)
}

export function getYearlyBookStats(books: BookMeta[], year: number): YearlyBookStats {
  const completedThisYear = books.filter(
    b => b.status === 'completed' && b.finishedDate && new Date(b.finishedDate).getFullYear() === year
  )

  const booksPerMonth = Array(12).fill(0)
  let totalPages = 0
  let ratingSum = 0
  let ratingCount = 0

  for (const book of completedThisYear) {
    const month = new Date(book.finishedDate as string).getMonth()
    booksPerMonth[month] += 1
    if (typeof book.pages === 'number') totalPages += book.pages
    if (typeof book.rating === 'number') {
      ratingSum += book.rating
      ratingCount += 1
    }
  }

  return {
    year,
    completedCount: completedThisYear.length,
    booksPerMonth,
    totalPages,
    averageRating: ratingCount > 0 ? ratingSum / ratingCount : null,
  }
}
