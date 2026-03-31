import { getAllProjects, getProjectBySlug } from '@/lib/projects'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type SectionHeading = {
  id: string
  title: string
}

function formatProjectDate(dateString: string) {
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return dateString

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function toHeadingId(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/&amp;/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

function addHeadingAnchors(contentHtml: string): { htmlWithIds: string; headings: SectionHeading[] } {
  const usedIds = new Map<string, number>()
  const headings: SectionHeading[] = []

  const htmlWithIds = contentHtml.replace(/<h2>(.*?)<\/h2>/g, (_match, innerHtml: string) => {
    const plainText = innerHtml.replace(/<[^>]*>/g, '').trim()
    if (!plainText) return `<h2>${innerHtml}</h2>`

    const baseId = toHeadingId(plainText) || 'section'
    const count = usedIds.get(baseId) ?? 0
    usedIds.set(baseId, count + 1)
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`

    headings.push({ id, title: plainText })
    return `<h2 id="${id}">${innerHtml}</h2>`
  })

  return { htmlWithIds, headings }
}

export async function generateStaticParams() {
  return getAllProjects().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const project = await getProjectBySlug(slug)
    const title = project.title
    const description = project.description || `Project details for ${project.title}.`
    const media = project.detailMedia ?? project.image

    return {
      title,
      description,
      alternates: {
        canonical: `/projects/${project.slug}`,
      },
      openGraph: {
        type: 'article',
        title,
        description,
        url: `/projects/${project.slug}`,
        ...(media ? { images: [{ url: media, alt: project.title }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(media ? { images: [media] } : {}),
      },
    }
  } catch {
    return {
      title: 'Project not found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let project
  try {
    project = await getProjectBySlug(slug)
  } catch {
    notFound()
  }

  const { htmlWithIds, headings } = addHeadingAnchors(project.contentHtml)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description || undefined,
    datePublished: project.date || undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/projects/${project.slug}`,
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full max-w-7xl px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_240px] gap-12 items-start">
          <article className="w-full max-w-3xl mx-auto lg:col-start-2">
            <Link
              href="/"
              className="font-mono text-xs tracking-widest uppercase underline mb-10 block text-(--muted) hover:text-(--fg)"
            >
              ← back
            </Link>

            <h1 className="font-mono font-black text-4xl md:text-5xl leading-tight mb-8">
              {project.title}
            </h1>

            {(() => {
              const mediaSrc = project.detailMedia ?? project.image
              if (!mediaSrc) return null
              const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaSrc)
              return isVideo ? (
                <video
                  src={mediaSrc}
                  className="w-full aspect-video mb-3 border border-(--border) object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <div className="relative w-full aspect-video mb-3 border border-(--border)">
                  <Image
                    src={mediaSrc}
                    alt={project.title}
                    fill
                    className="object-cover grayscale"
                    priority
                  />
                </div>
              )
            })()}

            {project.date && (
              <p className="font-mono text-xs tracking-widest uppercase text-(--muted) mb-10">
                Built: {formatProjectDate(project.date)}
              </p>
            )}

            {(project.liveUrl || project.githubUrl) && (
              <div className="flex flex-wrap gap-6 border-t border-b border-(--border) py-4 mb-10">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm underline hover:no-underline"
                  >
                    [ Live Site ↗ ]
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm underline hover:no-underline"
                  >
                    [ GitHub ↗ ]
                  </a>
                )}
              </div>
            )}

            <div
              className="font-mono text-sm leading-7 space-y-4 [&_h2]:font-bold [&_h2]:text-base [&_h2]:tracking-widest [&_h2]:uppercase [&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:scroll-mt-24 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1 [&_li]:leading-7 [&_hr]:border-(--border) [&_hr]:my-8 [&_strong]:font-bold [&_code]:bg-(--code-bg) [&_code]:px-1 [&_code]:rounded-sm"
              dangerouslySetInnerHTML={{ __html: htmlWithIds }}
            />
          </article>

          {headings.length > 0 && (
            <aside className="hidden lg:block sticky top-8 lg:col-start-3">
              <p className="font-mono text-xs tracking-widest uppercase text-(--muted) mb-3">On this page</p>
              <nav className="border-l border-(--border-soft) pl-4">
                <ul className="space-y-2">
                  {headings.map(heading => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="font-mono text-xs tracking-wide uppercase text-(--muted-strong) hover:text-(--fg)"
                      >
                        {heading.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>
      </div>
    </main>
  )
}
