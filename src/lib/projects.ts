import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const projectsDir = path.join(process.cwd(), 'content/projects')

export interface ProjectMeta {
  slug: string
  title: string
  description: string
  date: string
  image?: string
  detailMedia?: string
  liveUrl?: string
  githubUrl?: string
}

export interface Project extends ProjectMeta {
  contentHtml: string
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
          date: data.date ? String(data.date) : '',
          ...(data.image ? { image: data.image } : {}),
          ...(data.detailMedia ? { detailMedia: data.detailMedia } : {}),
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

export async function getProjectBySlug(slug: string): Promise<Project> {
  const fullPath = path.join(projectsDir, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  const processed = await remark().use(html).process(content)
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? '',
    date: data.date ? String(data.date) : '',
    image: data.image,
    detailMedia: data.detailMedia,
    liveUrl: data.liveUrl,
    githubUrl: data.githubUrl,
    contentHtml: processed.toString(),
  }
}
