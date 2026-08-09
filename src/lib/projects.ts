import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { cacheLife } from 'next/cache'

const projectsDir = path.join(process.cwd(), 'content/projects')
const NEW_PROJECT_WINDOW_DAYS = 30

export interface ProjectMeta {
  slug: string
  title: string
  description: string
  date: string
  image?: string
  imageAspect?: string
  detailMedia?: string
  detailAspect?: string
  liveUrl?: string
  githubUrl?: string
}

export interface Project extends ProjectMeta {
  contentHtml: string
}

// gray-matter's YAML parser turns a bare `date: 2026-08-08` into a JS Date
// object rather than a string, so a plain `String(data.date)` produces a
// locale string ("Sat Aug 08 2026 ...") instead of an ISO date — breaking
// any lexicographic date comparison (sort order, the recent-project cutoff).
function normalizeDate(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
}

export function getAllProjects(): ProjectMeta[] {
  if (!fs.existsSync(projectsDir)) return []
  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'))
  const projects = files
    .map<ProjectMeta | null>(filename => {
      const slug = filename.replace(/\.md$/, '')
      const fullPath = path.join(projectsDir, filename)
      try {
        const { data } = matter(fs.readFileSync(fullPath, 'utf8'))
        return {
          slug,
          title: data.title ?? slug,
          description: data.description ?? '',
          date: normalizeDate(data.date),
          ...(data.image ? { image: data.image } : {}),
          ...(data.imageAspect ? { imageAspect: data.imageAspect } : {}),
          ...(data.detailMedia ? { detailMedia: data.detailMedia } : {}),
          ...(data.detailAspect ? { detailAspect: data.detailAspect } : {}),
          ...(data.liveUrl ? { liveUrl: data.liveUrl } : {}),
          ...(data.githubUrl ? { githubUrl: data.githubUrl } : {}),
        }
      } catch (error) {
        console.warn(`Skipping invalid project file: ${filename}`, error)
        return null
      }
    })
    .filter((project): project is ProjectMeta => project !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return projects
}

// `new Date()` can't be read directly in a prerendered Server Component
// (it'd freeze at build time), so the cutoff is computed behind a cached
// function, same pattern as `getCurrentYear` in lib/books.ts.
export async function getRecentProjectCutoff(): Promise<string> {
  'use cache'
  cacheLife('hours')
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - NEW_PROJECT_WINDOW_DAYS)
  return cutoff.toISOString().slice(0, 10)
}

export function isRecentProject(date: string, cutoff: string): boolean {
  return date >= cutoff
}

export async function getProjectBySlug(slug: string): Promise<Project> {
  const fullPath = path.join(projectsDir, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  const processed = await remark().use(html).process(content)
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    date: normalizeDate(data.date),
    image: data.image,
    imageAspect: data.imageAspect,
    detailMedia: data.detailMedia,
    detailAspect: data.detailAspect,
    liveUrl: data.liveUrl,
    githubUrl: data.githubUrl,
    contentHtml: processed.toString(),
  }
}
