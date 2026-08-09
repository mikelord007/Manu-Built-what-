---
title: "twtr-cleaner"
description: "a CLI that deletes your entire X/Twitter history — tweets, replies, retweets, quotes, and likes — by driving a real Playwright browser against your downloaded data archive, with optional LLM content filtering and resumable, rate-limited runs"
date: 2026-07-12
image: "/images/twitter-cleaner.png"
githubUrl: "https://github.com/mikelord007/twitter-cleaner"
---

No API key, because there's no usable API for this: X doesn't offer a delete-everything endpoint, so `twtr-cleaner` reads your official data archive for the full list of tweet/like IDs, then drives a real browser through the delete flow for each one.

That's also the honest risk with it — it's browser automation against a Terms-of-Service boundary, not an official interface, so it ships with an explicit account-lockout disclaimer and defaults that lean cautious.

---

## How it works

1. You point it at your downloaded Twitter/X **data archive** (or let it scrape your live profile, capped at ~3,200 tweets by X's own limits).
2. It parses every tweet/reply/retweet/quote/like ID into a local **SQLite** queue.
3. A **Playwright**-controlled Chromium browser navigates to each item and deletes it.
4. Progress is saved after every single deletion — kill the process anytime, rerun the same command, and it resumes exactly where it left off.

## Filtering

`--type` scopes a run to specific categories (tweets, replies, quotes, retweets, likes). `--before` / `--after` scope by date. `--filter` hands the tweet text to an LLM — OpenAI, Anthropic, or OpenRouter — and only deletes what matches a natural-language description ("angry or political posts", "shitposts and low-effort jokes"), with `--debug-llm` printing exactly what the model decided and why before you commit to a real run.

## Staying safe to run

- **Dry runs** (`--dry-run`) navigate to every item without clicking delete
- **Stealth mode** is on by default: randomized 3–6s delays between deletions plus periodic longer pauses every ~50 actions
- **Edited-tweet handling**: an archive stores one entry per historical edit, but only the latest version is actually deletable on X — older versions are detected and skipped automatically rather than failing
- A full **pytest** suite covers the parser, date filters, all three LLM providers, the SQLite progress store, and the browser actions themselves via intercepted `x.com` network mocks

---

## Stack

- **Python**, **Click** CLI, published to PyPI as `twtr-cleaner`
- **Playwright** (Chromium) for all browser-driven deletion
- **SQLite** for the resumable deletion queue
- OpenAI / Anthropic / OpenRouter for optional LLM-based filtering
