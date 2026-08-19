import Link from 'next/link'
import Image from 'next/image'
import type { ProjectMeta } from '@/lib/projects'

function formatProjectDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('en-GB').format(parsed)
}

export default function ProjectCard({
  project,
  priority,
  isNew,
}: {
  project: ProjectMeta
  priority?: boolean
  isNew?: boolean
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex h-full flex-col transition-colors hover:bg-(--card-hover-bg) hover:text-(--card-hover-fg)"
      data-cuelume-hover="tick"
    >
      <div
        className={`relative w-full bg-(--fg) overflow-hidden shrink-0 ${project.imageAspect ? '' : 'aspect-video'}`}
        style={project.imageAspect ? { aspectRatio: project.imageAspect } : undefined}
      >
        {project.image ? (
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            priority={priority}
            className="object-cover grayscale group-hover:opacity-20 transition-opacity"
          />
        ) : (
          <div className="w-full h-full bg-(--fg) grid place-items-center">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-(--bg) opacity-40">
              No Preview
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-1 flex-col gap-1 bg-(--bg) transition-colors group-hover:bg-(--card-hover-bg)">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-mono font-bold text-sm leading-snug">{project.title}</h2>
          {isNew && (
            <span className="shrink-0 font-mono text-[10px] font-bold tracking-widest uppercase border border-(--border) px-1.5 py-0.5 text-(--muted) group-hover:text-(--card-hover-fg) group-hover:border-(--card-hover-fg)">
              New
            </span>
          )}
        </div>
        <p className="font-mono text-xs text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-70">{project.description}</p>
        {project.date && (
          <p className="mt-auto ml-auto font-mono text-[10px] text-(--muted) group-hover:text-(--card-hover-fg) group-hover:opacity-50">
            {formatProjectDate(project.date)}
          </p>
        )}
      </div>
    </Link>
  )
}
