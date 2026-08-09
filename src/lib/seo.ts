import type { Metadata } from 'next'

export const SITE_NAME = 'manu built what?'
export const TWITTER_HANDLE = '@topagentmike007'

const DEFAULT_IMAGE = '/images/og-default.svg'

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
