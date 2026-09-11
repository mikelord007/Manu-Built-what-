import 'server-only'
import { cacheLife } from 'next/cache'
import { notionConfiguration, queryNotionDatabase } from './notion-api'
import { normalizeBooks, normalizeHackathons, type HackathonWin } from './notion-model'
import { createLastGoodReader, type DataResult } from './last-good'
import type { BookMeta } from './book-model'

const readBooks = createLastGoodReader<BookMeta[]>()
const readWins = createLastGoodReader<HackathonWin[]>()

function cacheResult<T>(result: DataResult<T>): DataResult<T> {
  // Keep expire >= 5 minutes even on failure so Next can prerender the
  // unavailable state. revalidate, not expire, controls the short retry interval.
  cacheLife(result.status === 'ready'
    ? { stale: 30, revalidate: 300, expire: 86400 }
    : { stale: 30, revalidate: 30, expire: 86400 })
  return result
}

export async function getBookData(): Promise<DataResult<BookMeta[]>> {
  'use cache'
  const configuration = notionConfiguration(process.env, 'books')
  if (configuration.status !== 'configured') return cacheResult<BookMeta[]>({ status: configuration.status, data: null })
  const config = configuration.config
  return cacheResult(await readBooks(config.databaseId, async () => normalizeBooks(await queryNotionDatabase(config, 'books'))))
}

export async function getHackathonData(): Promise<DataResult<HackathonWin[]>> {
  'use cache'
  const configuration = notionConfiguration(process.env, 'hackathons')
  if (configuration.status !== 'configured') return cacheResult<HackathonWin[]>({ status: configuration.status, data: null })
  const config = configuration.config
  return cacheResult(await readWins(config.databaseId, async () => normalizeHackathons(await queryNotionDatabase(config, 'hackathons'))))
}
