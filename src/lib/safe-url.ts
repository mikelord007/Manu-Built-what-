export function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u0020\u007f\\]/.test(value)) return
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return
    return url.href
  } catch {
    return
  }
}

// Keep optimization for the existing providers. Other valid manual cover URLs
// load directly in the browser instead of widening Next's server fetch allowlist.
export function needsUnoptimizedCover(cover: string): boolean {
  if (cover.startsWith('/') && !cover.startsWith('//')) return false
  const url = safeHttpUrl(cover)
  return !url || new URL(url).protocol !== 'https:' ||
    !['books.google.com', 'covers.openlibrary.org', 'i.ytimg.com'].includes(new URL(url).hostname)
}
