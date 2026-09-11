import 'server-only'
import { cacheLife } from 'next/cache'
import type { BookMeta } from './book-model'
export * from './book-model'
export { getBookData } from './notion'

interface BookProviderMeta {
  cover?: string
  pages?: number
}

// Once a book is fully catalogued (cover + page count both resolved), that
// data essentially never changes, so lock it in for a long time. But a book
// with nothing (or only partial data) yet — e.g. an upcoming title Google
// Books hasn't fully listed — is retried every few days instead, so a
// cover that shows up later doesn't stay hidden for a month.
function cacheLifeForResult(meta: BookProviderMeta) {
  if (meta.cover && typeof meta.pages === 'number') {
    cacheLife('max')
  } else {
    cacheLife('days')
  }
}

async function fetchGoogleBooksMeta(title: string, author: string): Promise<BookProviderMeta> {
  'use cache'
  try {
    const q = `intitle:"${title}" inauthor:"${author}"`
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY
    const url = `https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({
      q,
      maxResults: '1',
      ...(apiKey ? { key: apiKey } : {}),
    })}`
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) {
      cacheLife('days')
      return {}
    }
    const data = await res.json()
    const item = data?.items?.[0]
    const info = item?.volumeInfo
    if (!info) {
      cacheLife('days')
      return {}
    }
    // The `thumbnail`/`smallThumbnail` fields Google returns default to
    // zoom=1 (a ~130px preview) with a page-curl graphic baked into the
    // bottom-right corner. Rebuilding the URL with zoom=0 and edge=none
    // gets the full-resolution cover with no curl artifact.
    const hasCover = Boolean(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail)
    const meta: BookProviderMeta = {
      cover: hasCover && item.id
        ? `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=0&edge=none&source=gbs_api`
        : undefined,
      pages: typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : undefined,
    }
    cacheLifeForResult(meta)
    return meta
  } catch (error) {
    cacheLife('days')
    console.warn(`Failed to fetch Google Books metadata for "${title}"`, error)
    return {}
  }
}

async function fetchOpenLibraryMeta(title: string, author: string): Promise<BookProviderMeta> {
  'use cache'
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
    if (!res.ok) {
      cacheLife('days')
      return {}
    }
    const data = await res.json()
    const doc = data?.docs?.[0]
    if (!doc) {
      cacheLife('days')
      return {}
    }
    const meta: BookProviderMeta = {
      cover: typeof doc.cover_i === 'number' ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
      pages: typeof doc.number_of_pages_median === 'number' ? doc.number_of_pages_median : undefined,
    }
    cacheLifeForResult(meta)
    return meta
  } catch (error) {
    cacheLife('days')
    console.warn(`Failed to fetch Open Library metadata for "${title}"`, error)
    return {}
  }
}

// Covers and page counts are fetched automatically so books only need
// title/author/status in Notion. Google Books is tried first (better
// coverage of newer releases); Open Library fills in whatever's still
// missing. A manually set `cover` or `pages` value in Notion always
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

// The portfolio uses the owner's calendar year. A short cache lets both
// reading views roll over together shortly after midnight in India.
export async function getCurrentYear(): Promise<number> {
  'use cache'
  cacheLife({ stale: 30, revalidate: 300, expire: 86400 })
  return Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date()))
}
