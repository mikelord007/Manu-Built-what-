import { getAllProjects } from '@/lib/projects'
import ProjectCard from '@/components/ProjectCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'manu built what?' },
  description: 'A collection of projects, experiments, and shipped builds by Manu.',
}

export default function Home() {
  const projects = getAllProjects()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'manu built what?',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    description: 'A collection of projects, experiments, and shipped builds by Manu.',
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full max-w-5xl px-4 sm:px-8 pt-16 pb-24">
        <header className="mb-16">
          <h1 className="font-mono font-black text-center text-5xl sm:text-6xl md:text-7xl tracking-tight leading-none">
            Manu Built What? 😱
          </h1>
          <p className="font-mono text-xs mt-4 tracking-widest uppercase text-(--muted)">2026</p>
        </header>

        {projects.length === 0 ? (
          <p className="font-mono text-sm text-(--muted)">nothing yet.</p>
        ) : (
          <div className="border-t border-(--border) pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(p => (
                <div key={p.slug} className="border border-(--border)">
                  <ProjectCard project={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
