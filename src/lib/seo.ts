import type { Metadata } from 'next'

export const SITE_NAME = 'manu built what?'
export const TWITTER_HANDLE = '@topagentmike007'

// The canonical absolute origin for this deployment. Always resolves to a
// real https:// URL when actually deployed on Vercel — VERCEL_PROJECT_PRODUCTION_URL
// (the assigned production domain, custom domain if set) and VERCEL_URL
// (this deployment's own domain) are both auto-injected by Vercel, no
// dashboard config required. NEXT_PUBLIC_SITE_URL still wins if set
// explicitly. Only bare `npm run dev` with none of this set falls back to
// localhost — that's the *only* case this should ever resolve to http.
// Twitter/X's card crawler can't reach localhost or fetch http images, so
// getting this wrong silently breaks every social card in production.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  'http://localhost:3000'

// Must be a raster format (png/jpg/webp/gif) — Twitter's card crawler does
// not support SVG for twitter:image, so this can't be og-default.svg.
const DEFAULT_IMAGE = '/images/og-default.png'

interface BuildMetadataInput {
  title: string
  description: string
  path: string
  image?: string
  imageAlt?: string
  type?: 'website' | 'article'
  // The homepage's <title> should render as the bare site name, not
  // "manu built what? | manu built what?" — every other page gets the
  // root layout's "%s | manu built what?" template applied automatically.
  isHome?: boolean
  // For pages that shouldn't be indexed (e.g. 404) but should still get a
  // correct, page-specific Twitter/OG card if someone shares the URL anyway.
  noIndex?: boolean
}

// Every page's `metadata` (or `generateMetadata`) should be built with this,
// so every route gets its own accurate OpenGraph + Twitter
// (summary_large_image) card instead of silently inheriting the generic
// root layout defaults when it doesn't set openGraph/twitter itself.
export function buildMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = 'website',
  isHome = false,
  noIndex = false,
}: BuildMetadataInput): Metadata {
  const socialTitle = isHome ? title : `${title} | ${SITE_NAME}`
  // Twitter/OG images must be a static image — never pass a video path
  // (e.g. a project's detailMedia) here, only a real image field.
  const resolvedImage = image || DEFAULT_IMAGE
  const resolvedAlt = imageAlt ?? title

  return {
    title: isHome ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: path,
      images: [{ url: resolvedImage, alt: resolvedAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: socialTitle,
      description,
      images: [resolvedImage],
    },
  }
}
