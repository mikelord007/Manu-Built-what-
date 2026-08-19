"use client"

import { useState } from 'react'
import type { ProjectMeta, ProjectCategory } from '@/lib/projects'
import ProjectCard from './ProjectCard'

type Filter = 'all' | ProjectCategory

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ai', label: 'AI' },
  { key: 'web3', label: 'Web3' },
  { key: 'general', label: 'General' },
]

interface ProjectWithNew extends ProjectMeta {
  isNew: boolean
}

export default function ProjectsFilter({ projects }: { projects: ProjectWithNew[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            data-cuelume-toggle
            className={`font-mono text-xs tracking-widest uppercase border px-3 py-1 transition-colors ${
              filter === f.key
                ? 'bg-(--fg) text-(--bg) border-(--fg)'
                : 'bg-(--bg) text-(--fg) border-(--border) hover:bg-(--fg) hover:text-(--bg)'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="font-mono text-sm text-(--muted)">nothing here yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <div key={project.slug} className="border border-(--border)">
              <ProjectCard project={project} priority={i === 0} isNew={project.isNew} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
