import React from 'react'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import BookCard from '../src/components/BookCard'
import ReadingCard from '../src/components/ReadingCard'
import GoalCard from '../src/components/GoalCard'
import { normalizeBooks, normalizeHackathons } from '../src/lib/notion-model'
import type { GoalMeta } from '../src/lib/goals'

const rich = (plain_text: string) => [{ plain_text }]
const field = (type: string, value: unknown) => ({ type, [type]: value })
test('review/title text is escaped and half-star/date presentation survives', () => {
  const [book] = normalizeBooks([{ object: 'page', id: 'test', properties: {
    Title: field('title', rich('<script>alert(1)</script>')), Status: field('select', { name: 'Completed' }),
    Rating: field('number', 4.5), Summary: field('rich_text', rich('<img src=x onerror=alert(1)>')),
    'What Changed For Me': field('rich_text', rich('A & B')), 'Finish Date': field('date', { start: '2026-01-01' }),
    Link: field('url', 'javascript:alert(1)'),
  } }])
  const html = renderToStaticMarkup(<BookCard book={book} />)
  assert.match(html, /4.5 out of 5/)
  assert.match(html, /width:90%/)
  assert.match(html, /01\/01\/2026/)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /&lt;img/)
  assert.match(html, /What changed for me/)
  assert.doesNotMatch(html, /<script>|<img src="x"/)
  assert.doesNotMatch(renderToStaticMarkup(<ReadingCard book={book} />), /href=/)
})

const goal: GoalMeta = { slug: 'win-hackathons', title: 'Win 3 hackathons', why: '', deadline: '2026-12-31', target: 3, unit: 'hackathons', progress: 1, progressLabel: 'Won' }
test('winning projects retain their own URLs with safe external-link attributes', () => {
  const wins = normalizeHackathons([{ object: 'page', id: 'win', properties: {
    Name: field('title', rich('Different <project>')), Date: field('date', { start: '2026-08-17' }),
    'Project Url': field('url', 'https://example.org/my-project'), 'Social Url': field('url', 'https://x.com/me/status/123'),
  } }])
  const html = renderToStaticMarkup(<GoalCard goal={{ ...goal, wins }} index={2} />)
  assert.match(html, /Won: 1 out of 3 hackathons/)
  assert.match(html, /Different &lt;project&gt;/)
  assert.match(html, /href="https:\/\/example.org\/my-project" target="_blank" rel="noopener noreferrer"/)
  assert.match(html, /href="https:\/\/x.com\/me\/status\/123" target="_blank" rel="noopener noreferrer"/)
  assert.doesNotMatch(html, /projects\/cobalt/)
})

test('unavailable progress is distinct from a successful zero count', () => {
  const unavailable = renderToStaticMarkup(<GoalCard goal={{ ...goal, progress: null }} index={0} />)
  assert.match(unavailable, /Progress is currently unavailable/)
  assert.doesNotMatch(unavailable, /0 out of 3/)
  const empty = renderToStaticMarkup(<GoalCard goal={{ ...goal, progress: 0, wins: [] }} index={0} />)
  assert.match(empty, /Won: 0 out of 3 hackathons/)
  assert.doesNotMatch(empty, /unavailable/)
})
