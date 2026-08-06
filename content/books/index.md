---
# The master list of every book on the /books page, in one place.
#
# - status: "reading" | "upcoming" | "completed" — move a book between
#   these as it progresses. Only the first 4 "upcoming" books (by order)
#   are shown on the site — the rest just wait in the queue.
# - order: controls sequence within "upcoming" (lower = sooner). Not used
#   for "reading" (sorted by startedDate) or "completed" (sorted by
#   finishedDate, newest first) — both of those live in the details file.
#
# Extra details for a book (rating, one-sentence summary, what changed for
# me, dates, etc.) go in their own file: content/books/details/<slug>.md
# — copy content/books/details/TEMPLATE.md to get the format.

books:
  - slug: project-hail-mary
    title: "Project Hail Mary"
    author: "Andy Weir"
    status: reading

  - slug: how-to-try-again
    title: "How to Try Again"
    author: "Steve Kamb"
    status: reading

  - slug: the-founder-within
    title: "The Founder Within"
    author: "Indraveer Singh"
    status: upcoming
    order: 1

  - slug: mastery
    title: "Mastery"
    author: "Robert Greene"
    status: upcoming
    order: 2

  - slug: mythos
    title: "Mythos"
    author: "Stephen Fry"
    status: upcoming
    order: 3

  - slug: the-48-laws-of-power
    title: "The 48 Laws of Power"
    author: "Robert Greene"
    status: upcoming
    order: 4

  - slug: the-da-vinci-code
    title: "The Da Vinci Code"
    author: "Dan Brown"
    status: upcoming
    order: 5
---
