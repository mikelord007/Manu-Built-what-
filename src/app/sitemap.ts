import type { MetadataRoute } from 'next'
import { getAllProjects } from '@/lib/projects'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const projects = getAllProjects()

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...projects.map(project => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: project.date ? new Date(project.date) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
