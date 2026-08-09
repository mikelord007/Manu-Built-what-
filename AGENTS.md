<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SEO / social cards

Every route's `metadata` (or `generateMetadata`) export MUST be built with `buildMetadata()` from `src/lib/seo.ts`, not a hand-written object. A page that skips this silently inherits the generic root-layout OpenGraph/Twitter card instead of one reflecting that page, which is a bug, not a fallback to rely on.

- Pass a real `image` (a static png/jpg/svg) when the page/content has one — never a video path (`.mp4`/`.webm`) as `image`; Twitter/OG can't render a video as a card preview.
- Only the homepage passes `isHome: true`.
- See `src/app/books/page.tsx` or `src/app/projects/[slug]/page.tsx` for reference usage.
