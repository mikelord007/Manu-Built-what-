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
#
# favoriteQuote: your favorite line/sentence read so far, shown as its own
# pull-quote section on the page. book/author are optional attribution;
# set speaker if it's dialogue you'd rather credit to the character who
# says it (speaker takes priority over author for the on-page byline).
# Omit the whole key to hide the section. Use a `|-` block for text so you
# can write it across multiple lines without escaping quotes/apostrophes.
favoriteQuote:
  text: |-
    Humanity isn't alone in the universe. And I've just met our neighbours.
    "Holy fucking shit!"
  book: "Project Hail Mary"
  author: "Andy Weir"
  speaker: "Ryland Grace"

books:
  - slug: project-hail-mary
    title: "Project Hail Mary"
    author: "Andy Weir"
    status: completed

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
