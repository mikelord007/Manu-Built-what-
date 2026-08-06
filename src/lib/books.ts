import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const booksDir = path.join(process.cwd(), 'content/books')
const indexPath = path.join(booksDir, 'index.md')
const detailsDir = path.join(booksDir, 'details')

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
}

export interface FavoriteQuote {
  text: string
  book?: string
  author?: string
  // The in-book character who says the line, if it's dialogue you want
  // credited to them rather than the author (e.g. "Ryland Grace" instead
  // of "Andy Weir" for a Project Hail Mary quote).
  speaker?: string
}

interface BookProviderMeta {
  cover?: string
  pages?: number
}

async function fetchGoogleBooksMeta(title: string, author: string): Promise<BookProviderMeta> {
  try {
    const q = `intitle:"${title}" inauthor:"${author}"`
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY
    const url = `https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({
      q,
      maxResults: '1',
      ...(apiKey ? { key: apiKey } : {}),
    })}`
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) return {}
    const data = await res.json()
    const item = data?.items?.[0]
    const info = item?.volumeInfo
    if (!info) return {}
    // The `thumbnail`/`smallThumbnail` fields Google returns default to
    // zoom=1 (a ~130px preview) with a page-curl graphic baked into the
    // bottom-right corner. Rebuilding the URL with zoom=0 and edge=none
    // gets the full-resolution cover with no curl artifact.
    const hasCover = Boolean(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail)
    const cover = hasCover && item.id
      ? `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=0&edge=none&source=gbs_api`
      : undefined
    return {
      cover,
      pages: typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : undefined,
    }
  } catch (error) {
    console.warn(`Failed to fetch Google Books metadata for "${title}"`, error)
    return {}
  }
}

async function fetchOpenLibraryMeta(title: string, author: string): Promise<BookProviderMeta> {
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

// Covers and page counts are fetched automatically so books only need
// title/author/status in frontmatter. Google Books is tried first (better
// coverage of newer releases); Open Library fills in whatever's still
// missing. A manually set `cover` or `pages` value in frontmatter always
// wins over any fetched value.
export async function withResolvedMetadata(books: BookMeta[]): Promise<BookMeta[]> {
  return Promise.all(
    books.map(async book => {
      if (book.cover && typeof book.pages === 'number') return book
      const google = await fetchGoogleBooksMeta(book.title, book.author)
      let cover = book.cover ?? google.cover
      let pages = book.pages ?? google.pages
      if (!cover || typeof pages !== 'number') {
        const openLibrary = await fetchOpenLibraryMeta(book.title, book.author)
        cover = cover ?? openLibrary.cover
        pages = pages ?? openLibrary.pages
      }
      return { ...book, cover, pages }
    })
  )
}

interface BookIndexEntry {
  slug: string
  title: string
  author: string
  status: BookStatus
  order?: number
}

function readBookIndex(): BookIndexEntry[] {
  if (!fs.existsSync(indexPath)) return []
  const { data } = matter(fs.readFileSync(indexPath, 'utf8'))
  const entries = Array.isArray(data.books) ? data.books : []
  return entries
    .filter((entry: unknown): entry is Record<string, unknown> =>
      !!entry && typeof entry === 'object' && typeof (entry as Record<string, unknown>).slug === 'string'
    )
    .map(entry => ({
      slug: entry.slug as string,
      title: (entry.title as string) ?? (entry.slug as string),
      author: (entry.author as string) ?? '',
      status: ['completed', 'reading', 'upcoming'].includes(entry.status as string)
        ? (entry.status as BookStatus)
        : 'upcoming',
      ...(typeof entry.order === 'number' ? { order: entry.order } : {}),
    }))
}

export function getFavoriteQuote(): FavoriteQuote | null {
  if (!fs.existsSync(indexPath)) return null
  const { data } = matter(fs.readFileSync(indexPath, 'utf8'))
  const quote = data.favoriteQuote
  if (!quote || typeof quote !== 'object' || typeof quote.text !== 'string' || !quote.text.trim()) return null
  return {
    text: quote.text,
    ...(typeof quote.book === 'string' && quote.book ? { book: quote.book } : {}),
    ...(typeof quote.author === 'string' && quote.author ? { author: quote.author } : {}),
    ...(typeof quote.speaker === 'string' && quote.speaker ? { speaker: quote.speaker } : {}),
  }
}

function readBookDetails(slug: string): Partial<BookMeta> {
  const fullPath = path.join(detailsDir, `${slug}.md`)
  if (!fs.existsSync(fullPath)) return {}
  try {
    const { data } = matter(fs.readFileSync(fullPath, 'utf8'))
    return {
      ...(data.cover ? { cover: data.cover } : {}),
      ...(data.startedDate ? { startedDate: String(data.startedDate) } : {}),
      ...(data.finishedDate ? { finishedDate: String(data.finishedDate) } : {}),
      ...(typeof data.pages === 'number' ? { pages: data.pages } : {}),
      ...(typeof data.rating === 'number' ? { rating: data.rating } : {}),
      ...(data.summary ? { summary: data.summary } : {}),
      ...(data.whatChangedForMe ? { whatChangedForMe: data.whatChangedForMe } : {}),
      ...(data.link ? { link: data.link } : {}),
    }
  } catch (error) {
    console.warn(`Skipping invalid book details file: ${slug}.md`, error)
    return {}
  }
}

export function getAllBooks(): BookMeta[] {
  return readBookIndex().map(entry => ({
    ...entry,
    ...readBookDetails(entry.slug),
  }))
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
    .slice(0, 4)
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

  for (const book of completedThisYear) {
    const month = new Date(book.finishedDate as string).getMonth()
    booksPerMonth[month] += 1
    if (typeof book.pages === 'number') totalPages += book.pages
  }

  return {
    year,
    completedCount: completedThisYear.length,
    booksPerMonth,
    totalPages,
  }
}
