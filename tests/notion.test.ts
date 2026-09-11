import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calendarDate, formatCalendarDate, isInYear } from '../src/lib/calendar'
import { getCurrentlyReading, getUpcomingReads, getYearlyBookStats, getReadingGoal, getFavoriteQuote } from '../src/lib/book-model'
import { normalizeBooks, normalizeHackathons, getYearlyWins, requiredSchemas, richText, matchesSchema, type JsonObject } from '../src/lib/notion-model'
import { queryNotionDatabase, notionConfiguration, NOTION_VERSION } from '../src/lib/notion-api'
import { createLastGoodReader } from '../src/lib/last-good'
import { safeHttpUrl, needsUnoptimizedCover } from '../src/lib/safe-url'

export const rt = (...segments: string[]) => segments.map(plain_text => ({ type: 'text', plain_text }))
export const prop = (type: string, value: unknown) => ({ type, [type]: value })
export function book(id = 'book-id', extra: JsonObject = {}) {
  return { object: 'page', id, properties: {
    Title: prop('title', rt('Project ', 'Hail Mary')), Author: prop('rich_text', rt('Andy ', 'Weir')),
    Status: prop('select', { name: 'Completed' }), 'Finish Date': prop('date', { start: '2026-08-09' }),
    Slug: prop('rich_text', rt('project-hail-mary')), ...extra,
  } }
}

test('all statuses, joined rich text, half stars, reviews, and blank optional fields', () => {
  const books = normalizeBooks([
    book('done', { Rating: prop('number', 4.5), Summary: prop('rich_text', rt('First ', 'second\nthird')),
      'What Changed For Me': prop('rich_text', rt('I ', 'changed.')), Pages: prop('number', 496),
      'Favorite Quote': prop('rich_text', rt('Hello ', 'world')), 'Quote Speaker': prop('rich_text', rt('Ryland ', 'Grace')) }),
    book('reading', { Status: prop('select', { name: 'Currently Reading' }), Rating: prop('number', null),
      'Start Date': prop('date', null), Summary: prop('rich_text', []), Link: prop('url', null) }),
    book('upcoming', { Status: prop('select', { name: 'Upcoming' }) }),
  ])
  assert.deepEqual(books.map(b => b.status), ['completed', 'reading', 'upcoming'])
  assert.equal(books[0].title, 'Project Hail Mary')
  assert.equal(books[0].author, 'Andy Weir')
  assert.equal(books[0].rating, 4.5)
  assert.equal(books[0].summary, 'First second\nthird')
  assert.equal(books[0].whatChangedForMe, 'I changed.')
  assert.equal(books[0].pages, 496)
  assert.equal(books[1].rating, undefined)
  assert.equal(books[1].startedDate, undefined)
  assert.equal(books[1].summary, undefined)
  assert.equal(books[1].link, undefined)
  assert.deepEqual(getFavoriteQuote(books), { text: 'Hello world', book: 'Project Hail Mary', author: 'Andy Weir', speaker: 'Ryland Grace' })
  assert.equal(getCurrentlyReading(books).length, 1)
  assert.equal(richText([{ text: { content: 'fallback' } }, ...rt(' tail')]), 'fallback tail')
})

test('upcoming order keeps four, missing order sorts last, stable keys survive title edits', () => {
  const books = normalizeBooks([5, 3, 1, 4, 2, null].map((order, i) => book(`id-${i}`, {
    Status: prop('select', { name: 'Upcoming' }), Order: prop('number', order), Slug: prop('rich_text', []),
  })))
  assert.deepEqual(getUpcomingReads(books).map(b => b.order), [1, 2, 3, 4])
  assert.equal(books[0].slug, 'id-0')
  const renamed = normalizeBooks([book('id-0', { Title: prop('title', rt('New title')), Slug: prop('rich_text', []) })])[0]
  assert.equal(renamed.id, books[0].id)
  assert.equal(renamed.slug, books[0].slug)
})

test('calendar year and month boundaries are independent of the process timezone', () => {
  const originalTZ = process.env.TZ
  try {
    for (const tz of ['America/Los_Angeles', 'Asia/Kolkata', 'Pacific/Kiritimati']) {
      process.env.TZ = tz
      assert.equal(calendarDate('2026-01-01'), '2026-01-01')
      assert.equal(calendarDate('2026-01-01T00:01:00+14:00'), '2026-01-01')
      assert.equal(calendarDate('2025-12-31T23:59:59-08:00'), '2025-12-31')
      assert.equal(isInYear('2026-12-31', 2026), true)
      assert.equal(isInYear('2027-01-01', 2026), false)
      assert.equal(formatCalendarDate('2026-01-01'), '01/01/2026')
    }
  } finally { if (originalTZ === undefined) delete process.env.TZ; else process.env.TZ = originalTZ }
  for (const date of ['2026-02-29', '2026-13-01', '2026-01-32', '2026-01-01Tbad', '', null]) assert.equal(calendarDate(date), undefined)
  assert.equal(calendarDate('2024-02-29'), '2024-02-29')
})

test('books and reading goal use identical yearly rules, preserving last finished', () => {
  const rows = ['2025-12-31', '2026-01-01', '2026-12-31', '2027-01-01', null].map((date, i) =>
    book(`b-${i}`, { 'Finish Date': prop('date', date ? { start: date } : null), Pages: prop('number', 100) }))
  rows.push(book('still-reading', { Status: prop('select', { name: 'Currently Reading' }) }))
  const books = normalizeBooks(rows)
  const stats = getYearlyBookStats(books, 2026)
  assert.equal(stats.completedCount, 2)
  assert.equal(stats.totalPages, 200)
  assert.deepEqual(stats.booksPerMonth, [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
  assert.equal(getReadingGoal(books, 2026).progress, stats.completedCount)
  assert.equal(getReadingGoal(books, 2026).lastFinishedBook?.finishedDate, '2027-01-01')
  assert.equal(getReadingGoal(normalizeBooks([book('old', { 'Finish Date': prop('date', { start: '2025-12-31' }) })]), 2026).progress, 0)
})

test('invalid optional values are omitted; drafts and archived pages stay unpublished', () => {
  const [mapped] = normalizeBooks([book('bad', { Rating: prop('number', 6), Pages: prop('number', -1),
    'Finish Date': prop('date', { start: '2026-02-30' }), 'Cover Url': prop('url', 'javascript:alert(1)') })])
  assert.equal(mapped.rating, undefined)
  assert.equal(mapped.pages, undefined)
  assert.equal(mapped.finishedDate, undefined)
  assert.equal(mapped.cover, undefined)
  assert.deepEqual(normalizeBooks([book('draft', { Status: prop('select', null) }), book('blank', { Title: prop('title', []) }), { ...book(), archived: true }]), [])
  assert.throws(() => normalizeBooks([book('unknown', { Status: prop('select', { name: 'Other' }) })]), /Unknown/)
  assert.throws(() => normalizeBooks([book('wrong-type', { Status: prop('status', { name: 'Completed' }) })]), /type/)
  assert.throws(() => normalizeBooks([{}]), /Invalid/)
})

test('hackathon win log counts any named dated win in year and uses supplied links', () => {
  const win = (id: string, name: string, date: string | null) => ({ object: 'page', id, properties: {
    Name: prop('title', rt(name)), Date: prop('date', date ? { start: date } : null),
    'Project Url': prop('url', `https://www.manubuiltwhat.live/projects/${id}`),
    'Social Url': prop('url', `https://x.com/example/status/${id}`),
  } })
  const wins = normalizeHackathons([win('cobalt', 'Cobalt', '2026-08-17'), win('another', 'Another project', '2026-12-31'),
    win('previous', 'Previous', '2025-12-31'), win('next', 'Next', '2027-01-01'), win('undated', 'Undated', null)])
  const yearly = getYearlyWins(wins, 2026)
  assert.equal(yearly.length, 2)
  assert.deepEqual(yearly.map(w => w.projectTitle), ['Another project', 'Cobalt'])
  assert.equal(yearly[1].projectUrl, 'https://www.manubuiltwhat.live/projects/cobalt')
  assert.equal(yearly[1].tweetUrl, 'https://x.com/example/status/cobalt')
})

test('URLs reject executable schemes, credentials, relative URLs and control characters', () => {
  for (const unsafe of ['javascript:alert(1)', 'data:text/html,bad', '//evil.com', '/local', 'file:///tmp/x', 'https://u:p@example.com', 'https://a.com\n', 'https:\\evil.com', null]) assert.equal(safeHttpUrl(unsafe), undefined)
  assert.equal(safeHttpUrl('https://example.com/book?q=1&b=2'), 'https://example.com/book?q=1&b=2')
  assert.equal(needsUnoptimizedCover('https://books.google.com/cover.jpg'), false)
  assert.equal(needsUnoptimizedCover('https://example.com/cover.jpg'), true)
  assert.equal(needsUnoptimizedCover('/images/books/local.jpg'), false)
})

const schema = Object.fromEntries(Object.entries(requiredSchemas.books).map(([name, type]) => [name, { type }]))
const config = { token: 'test-only-token', databaseId: '11111111-1111-1111-1111-111111111111' }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
function mockApi(query: (body: JsonObject) => Response, sources = [{ id: 'resolved-source' }]): typeof fetch {
  return async (url, init) => {
    const path = String(url)
    assert.equal(new Headers(init?.headers).get('Notion-Version'), NOTION_VERSION)
    assert.equal(init?.cache, 'no-store')
    if (path.includes('/databases/')) return json({ data_sources: sources })
    if (path.endsWith('/query')) return query(JSON.parse(String(init?.body)))
    return json({ properties: schema })
  }
}

test('database IDs resolve to data-source IDs; queries paginate and deduplicate', async () => {
  const cursors: unknown[] = []
  const result = await queryNotionDatabase(config, 'books', mockApi(body => {
    assert.equal(body.page_size, 100)
    cursors.push(body.start_cursor)
    return body.start_cursor ? json({ results: [book('one'), book('two')], has_more: false, next_cursor: null }) :
      json({ results: [book('one')], has_more: true, next_cursor: 'cursor-2' })
  }))
  assert.equal(result.length, 2)
  assert.deepEqual(cursors, [undefined, 'cursor-2'])
})

test('large rich-text properties retrieve every paginated property item', async () => {
  const row = book('long', { Summary: { ...prop('rich_text', rt(...Array<string>(25).fill('partial'))), id: 'rich%3Atext' } })
  const paths: string[] = []
  const base = mockApi(() => json({ results: [row], has_more: false }))
  const fetcher: typeof fetch = async (url, init) => {
    if (!String(url).includes('/properties/')) return base(url, init)
    paths.push(String(url))
    return String(url).includes('start_cursor') ? json({ results: [{ rich_text: { plain_text: 'end' } }], has_more: false }) :
      json({ results: [{ rich_text: { plain_text: 'beginning ' } }], has_more: true, next_cursor: 'more' })
  }
  const result = normalizeBooks(await queryNotionDatabase(config, 'books', fetcher))
  assert.equal(result[0].summary, 'beginning end')
  assert.equal(paths.length, 2)
  assert.match(paths[0], /rich%3Atext/)
  assert.doesNotMatch(paths[0], /%253A/)
})

test('successful empty database differs from missing configuration, API errors and broken schemas', async () => {
  assert.deepEqual(await queryNotionDatabase(config, 'books', mockApi(() => json({ results: [], has_more: false }))), [])
  assert.equal(notionConfiguration({}, 'books').status, 'unconfigured')
  assert.equal(notionConfiguration({ NOTION_TOKEN: 'present' }, 'books').status, 'misconfigured')
  assert.equal(notionConfiguration({ NOTION_TOKEN: 'present', NOTION_BOOKS_DATABASE_ID: config.databaseId }, 'books').status, 'configured')
  for (const status of [401, 403, 429, 500, 503]) await assert.rejects(queryNotionDatabase(config, 'books', async () => json({ secret: 'must-not-appear' }, status)), error => {
    assert.match(String(error), new RegExp(`HTTP ${status}`))
    assert.doesNotMatch(String(error), /must-not-appear|test-only-token/)
    return true
  })
  await assert.rejects(queryNotionDatabase(config, 'books', async () => { throw new Error('request containing test-only-token') }), /^Error: Notion request failed$/)
  await assert.rejects(queryNotionDatabase(config, 'books', mockApi(() => json({ results: [] }))), /pagination/)
  await assert.rejects(queryNotionDatabase(config, 'books', mockApi(() => json({ results: [], has_more: true, next_cursor: 'repeated' }))), /cursor/)
  await assert.rejects(queryNotionDatabase(config, 'books', mockApi(() => json({ results: [], has_more: false }), [{ id: 'one' }, { id: 'two' }])), /exactly one/)
  assert.equal(matchesSchema({ ...schema, Status: { type: 'status' } }, 'books'), false)
  assert.equal(matchesSchema({ ...schema, Summary: { type: 'number' } }, 'books'), false)
})

test('failed refresh preserves last good data, empty successes replace it, cold failures have no number', async () => {
  const read = createLastGoodReader<string[]>()
  const fail = async (): Promise<string[]> => { throw new Error('temporary failure') }
  assert.deepEqual(await read('cold', fail), { status: 'unavailable', data: null })
  const ready = await read('warm', async () => ['book'])
  const stale = await read('warm', fail)
  assert.equal(stale.status, 'stale')
  assert.deepEqual(stale.data, ['book'])
  assert.ok('updatedAt' in ready && 'updatedAt' in stale && ready.updatedAt === stale.updatedAt)
  assert.equal((await read('warm', async () => [])).status, 'ready')
  assert.deepEqual((await read('warm', fail)).data, [])
  assert.equal((await read('different-database', fail)).data, null)
})

test('concurrent cache misses share the same complete read', async () => {
  const read = createLastGoodReader<number>()
  let calls = 0
  const fetch = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 5)); return 7 }
  const results = await Promise.all([read('same', fetch), read('same', fetch)])
  assert.equal(calls, 1)
  assert.deepEqual(results[0], results[1])
})
