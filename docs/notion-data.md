# Books and hackathon wins

Notion is the only editable source for the book catalogue and hackathon win log.
`content/books/` is a historical backup and is never read by the website. Annual
targets, descriptions, ordering, and unrelated manual goals remain in
`content/goals/index.md`. WHOOP is unchanged. Project listings, articles, and
assets still use `content/projects/` and have no Notion dependency.

## Server configuration

Set these in the production hosting environment and redeploy once:

| Variable | Value to configure |
| --- | --- |
| `NOTION_TOKEN` | The existing integration token; private, server only |
| `NOTION_BOOKS_DATABASE_ID` | `3d6e6651-99ed-81c1-8016-fbc9426302ed` |
| `NOTION_HACKATHONS_DATABASE_ID` | `3d6e6651-99ed-8169-8dcf-d22beba64774` |

Local `.env.local` is configured and ignored by Git. `.env.example` contains only
variable names. Do not add a `NEXT_PUBLIC_` prefix or put the token in Next config.
Preserve existing Google Books, WHOOP, Redis, analytics, and SEO settings.

The integration must retain read access to both existing private databases.
The runtime uses supported Notion API version `2025-09-03`: retrieve a database,
resolve its data sources, validate schemas, then query the single matching source.
It does not assume a database ID is a data-source ID. See the official
[Notion upgrade guide](https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03).
The website never creates/edits Notion pages or schemas at runtime.

## Editing books

Edit the existing Books database. Titles/authors and review text are rendered as
plain text, joining every rich-text segment. Notion formatting does not become HTML.

| Property | Editing behavior |
| --- | --- |
| Title / Author | Book title and author; quote attribution also uses these |
| Status (select) | `Upcoming`, `Currently Reading`, or `Completed` |
| Finish Date | Set when completed; required for annual counts and monthly stats |
| Rating | Optional number from 0 to 5, including half stars such as 4.5 |
| Cover Url | Optional absolute HTTP(S) image URL; omit to use metadata lookups |
| Slug | Keep existing slugs; a blank slug falls back to the stable Notion page ID |
| Order | Upcoming priority, smallest first; only four are displayed |
| Favorite Quote / Quote Speaker | Optional quote and character; attribution falls back to author |
| Summary | Optional short review/summary (rich text) |
| What Changed For Me | Optional personal takeaway (rich text) |
| Start Date | Optional start date |
| Pages | Optional positive whole-number page-count override |
| Link | Optional absolute HTTP(S) information link |

The five optional properties Summary, What Changed For Me, Start Date, Pages,
and Link were added as blank columns. No book rows were overwritten or duplicated.
Blank optional values stay absent. Existing Google Books/Open Library lookups and
their long-lived caching fill missing covers/page counts. An unknown page count
adds nothing to the total; no rating, review, or date is inferred.

If several books have Favorite Quote filled, the most recently finished dated
book wins, with stable page ID as a tie breaker. Clear that field to remove it.
Books with a blank Title or Status are unpublished drafts. Archived/deleted rows
are excluded. Unexpected nonblank statuses or changed property types fail the
read rather than silently lowering progress. Invalid optional URLs/numbers/dates
are omitted; invalid dates cannot contribute to annual counts.

Both reading views use the same normalized snapshot and counting function:
only Completed books with Finish Date in the current calendar year count.
Date-only values never shift with server/browser timezone. For a date with a
time, the calendar date written in Notion is used, not its UTC-converted day.
The current year follows Asia/Kolkata and refreshes on the same five-minute cadence.
The goals page also shows the latest dated completed book, even from another year.

## Editing wins

Each row in the existing Hackathons database represents **one win**. Set Name and
Date, plus optional Project Url and Social Url. Only named wins with a valid date
in the current calendar year count; undated rows are drafts. Project Url supplies
the Project link and Social Url supplies the Tweet link. Use absolute HTTP(S) URLs;
unsafe/blank links are omitted without discarding a dated win. Links open with
`noopener noreferrer`. The target remains 3 and the progress label remains Won.

Keep full project content and assets in the repository. Notion only stores the
win name, date, and links. Cobalt's approved win date remains August 17, 2026.

## Refresh and outages

The complete validated Notion snapshot is cached using Next 16 Cache Components
(`use cache`), with a 300-second revalidation interval, 30-second client stale time,
and 24-hour route expiry. Individual Notion HTTP requests use `no-store` inside
that boundary, avoiding a second HTTP cache that could extend the delay.

Changes normally appear on subsequent visits after about five minutes. Refresh
is traffic-driven: the first visit after the interval may receive the previous
rendered page while Next regenerates it in the background. A subsequent visit
after regeneration sees the update; navigation can additionally reuse a client
entry for about 30 seconds. An already-open page does not poll. Idle sites refresh
when visited, and the first cold/expired request may wait for Notion. No per-edit
build or deployment is required.

A last-good snapshot in each server process preserves usable data during failed
refreshes, with a stale notice. Failure/unconfigured results retry after 30 seconds
(on subsequent requests). A successful empty database is a legitimate empty list
and replaces the previous snapshot; API/schema/pagination failures never do.
With no usable snapshot, the UI displays unavailable progress instead of zero;
missing/incomplete configuration is separately represented by the data layer.
There is no fallback to YAML.

Next's default function cache and the last-good snapshots are process-local.
They can be lost on restart or a cold serverless instance. Platform route caching
may still serve the previous page, but a persistent outage fallback across cold
instances is not guaranteed. This implementation adds no Redis dependency or
changes to WHOOP's existing Redis storage.

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. Serve the production build
with `npm start` and inspect `/books`, `/goals`, the project listing at `/`, and
`/projects/cobalt`.
The tests cover normalization, optional properties, half-star/review rendering,
sorting/limits, timezone/year boundaries, shared counts, win links, pagination,
empty/error/configuration distinctions, stale recovery, and unsafe text/URLs.
No deployment or commit is performed by this setup.
