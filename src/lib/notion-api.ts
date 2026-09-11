// Transport is injected for isolated tests; credentials are only read by the
// server-only entry point in notion.ts. Runtime access is strictly read-only.
import { matchesSchema, object, type NotionKind } from './notion-model'

export const NOTION_VERSION = '2025-09-03'

export interface NotionConfig { token: string; databaseId: string }
export type NotionConfiguration = { status: 'configured'; config: NotionConfig } | { status: 'unconfigured' | 'misconfigured' }

export function notionConfiguration(env: Record<string, string | undefined>, kind: NotionKind): NotionConfiguration {
  const token = env.NOTION_TOKEN?.trim()
  const databaseId = env[kind === 'books' ? 'NOTION_BOOKS_DATABASE_ID' : 'NOTION_HACKATHONS_DATABASE_ID']?.trim()
  if (!token && !databaseId) return { status: 'unconfigured' }
  if (!token || !databaseId || !/^(?:[a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test(databaseId)) return { status: 'misconfigured' }
  return { status: 'configured', config: { token, databaseId } }
}

export async function queryNotionDatabase(config: NotionConfig, kind: NotionKind, transport: typeof fetch = fetch): Promise<unknown[]> {
  async function request(path: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> {
    let response: Response
    try {
      response = await transport(`https://api.notion.com/v1/${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${config.token}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: 'no-store', // One cache around the complete validated snapshot.
        signal: AbortSignal.timeout(15_000),
        redirect: 'error',
      })
    } catch { throw new Error('Notion request failed') }
    // Never include response bodies, request headers, or credentials in errors.
    if (!response.ok) throw new Error(`Notion HTTP ${response.status}`)
    try { return object(await response.json()) } catch { throw new Error('Invalid Notion JSON') }
  }

  async function list(getPage: (cursor?: string) => Promise<Record<string, unknown>>): Promise<unknown[]> {
    const results: unknown[] = []
    const seen = new Set<string>()
    let cursor: string | undefined
    do {
      const data = await getPage(cursor)
      if (!Array.isArray(data.results) || typeof data.has_more !== 'boolean') throw new Error('Invalid Notion pagination')
      results.push(...data.results)
      if (!data.has_more) return results
      if (typeof data.next_cursor !== 'string' || !data.next_cursor || seen.has(data.next_cursor)) throw new Error('Invalid Notion cursor')
      cursor = data.next_cursor
      seen.add(cursor)
    } while (cursor)
    return results
  }

  const database = await request(`databases/${encodeURIComponent(config.databaseId)}`)
  if (!Array.isArray(database.data_sources) || !database.data_sources.length) throw new Error('Notion database has no data sources')
  const matches: string[] = []
  for (const source of database.data_sources) {
    const id = object(source).id
    if (typeof id !== 'string') throw new Error('Invalid Notion data source')
    const schema = await request(`data_sources/${encodeURIComponent(id)}`)
    if (matchesSchema(schema.properties, kind)) matches.push(id)
  }
  if (matches.length !== 1) throw new Error('Notion database must have exactly one matching data source')
  const rows = await list(cursor => request(`data_sources/${encodeURIComponent(matches[0])}/query`, {
    page_size: 100, ...(cursor ? { start_cursor: cursor } : {}),
  }))

  // Notion can truncate title/rich-text properties containing many mentions.
  // Retrieve all property items when a value reaches the inline limit.
  for (const value of rows) {
    const row = object(value)
    if (row.object !== 'page' || typeof row.id !== 'string') throw new Error('Invalid Notion page')
    for (const propValue of Object.values(object(row.properties))) {
      const prop = object(propValue)
      if (prop.type !== 'title' && prop.type !== 'rich_text') continue
      const inline = prop[prop.type]
      if (!Array.isArray(inline) || inline.length < 25) continue
      if (typeof prop.id !== 'string') throw new Error('Invalid Notion property ID')
      const propertyId = encodeURIComponent(decodeURIComponent(prop.id))
      const items = await list(cursor => request(`pages/${encodeURIComponent(row.id as string)}/properties/${propertyId}?${new URLSearchParams({ page_size: '100', ...(cursor ? { start_cursor: cursor } : {}) })}`))
      prop[prop.type] = items.map(item => object(item)[prop.type as string])
    }
  }
  // Page IDs remain stable even if titles/slugs change. De-duplicate if rows
  // shift between pages while an editor is working in Notion.
  return [...new Map(rows.map(row => [object(row).id, row])).values()]
}
