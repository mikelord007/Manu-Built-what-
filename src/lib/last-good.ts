export type DataResult<T> =
  | { status: 'ready' | 'stale'; data: T; updatedAt: string }
  | { status: 'unconfigured' | 'misconfigured' | 'unavailable'; data: null }

// Complements Next's route/function cache during failed refreshes. Kept only
// in this server process; cold instances cannot promise an outage fallback.
export function createLastGoodReader<T>() {
  const snapshots = new Map<string, { data: T; updatedAt: string }>()
  const inFlight = new Map<string, Promise<DataResult<T>>>()
  return async (key: string, read: () => Promise<T>): Promise<DataResult<T>> => {
    const pending = inFlight.get(key)
    if (pending) return pending
    const request = (async (): Promise<DataResult<T>> => {
      try {
        const data = await read()
        const snapshot = { data, updatedAt: new Date().toISOString() }
        snapshots.set(key, snapshot)
        return { status: 'ready', ...snapshot }
      } catch {
        const snapshot = snapshots.get(key)
        return snapshot ? { status: 'stale', ...snapshot } : { status: 'unavailable', data: null }
      }
    })()
    inFlight.set(key, request)
    try { return await request } finally { inFlight.delete(key) }
  }
}
