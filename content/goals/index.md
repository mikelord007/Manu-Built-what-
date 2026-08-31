---
# The master list of every 2026 goal on the /goals page, in one place.
#
# - source: how progress is computed.
#     "manual" — you hand-edit `progress` yourself.
#     "books"  — auto-counted from content/books (completed + finishedDate
#                in this calendar year). `progress`/`manualProgress` are
#                ignored for this source.
#     "whoop"  — auto-fetched from WHOOP (longest run in the trailing 28
#                days, against `target` km). If the WHOOP fetch fails or
#                isn't configured yet, falls back to `manualProgress`.
# - why: a one-line reason this goal matters to you, shown under the title.
# - order: controls display order on the page (lower = first).

goals:
  - slug: half-marathon
    title: "Run a half marathon"
    why: "Never finished a long race — want proof I can commit to training."
    deadline: "2026-12-31"
    source: whoop
    target: 21.1
    unit: km
    manualProgress: 0
    order: 1

  - slug: read-books
    title: "Read 5 books"
    why: "I've never been a reader — trying to build the habit."
    deadline: "2026-12-31"
    source: books
    target: 5
    unit: books
    order: 2

  - slug: win-hackathons
    title: "Win 3 hackathons"
    why: "Placeholder reason — update me."
    deadline: "2026-12-31"
    source: manual
    target: 3
    progress: 1
    unit: hackathons
    order: 3
---
