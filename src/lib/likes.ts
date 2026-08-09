import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const indexPath = path.join(process.cwd(), 'content/worth-your-time/index.md')

export type LikeType = 'essay' | 'video' | 'podcast'

export interface LikeItem {
  title: string
  url: string
  type: LikeType
  author?: string
  thumbnail?: string
  note?: string
}

export function getAllLikes(): LikeItem[] {
  if (!fs.existsSync(indexPath)) return []
  const { data } = matter(fs.readFileSync(indexPath, 'utf8'))
  const items = Array.isArray(data.items) ? data.items : []
  return items
    .filter((item: unknown): item is Record<string, unknown> =>
      !!item && typeof item === 'object' && typeof (item as Record<string, unknown>).url === 'string'
    )
    .map(item => ({
      title: (item.title as string) ?? (item.url as string),
      url: item.url as string,
      type: ['essay', 'video', 'podcast'].includes(item.type as string) ? (item.type as LikeType) : 'essay',
      ...(typeof item.author === 'string' && item.author ? { author: item.author } : {}),
      ...(typeof item.thumbnail === 'string' && item.thumbnail ? { thumbnail: item.thumbnail } : {}),
      ...(typeof item.note === 'string' && item.note ? { note: item.note } : {}),
    }))
}
