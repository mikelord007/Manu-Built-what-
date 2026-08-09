---
title: "deepwork.ai"
description: "a data-driven AI focus coach — it logs your Pomodoro sessions, distractions, and where you work, then a tool-calling LLM agent mines your real data to tell you when and where you actually focus best"
date: 2026-07-18
category: ai
image: "/images/deepwork.png"
liveUrl: "https://deepwork-ai.vercel.app/"
githubUrl: "https://github.com/mikelord007/deepwork_ai"
---

Most focus apps impose the same system on everyone: 25 minutes on, 5 minutes off, repeat. **deepwork.ai** starts from a different premise — your focus patterns are yours, and a coach should learn them from your actual behavior instead of prescribing a generic ritual.

So it logs real session data, and puts an LLM agent on top that's only allowed to talk about what the data actually shows.

---

## The focus timer

A Pomodoro-style timer that records more than start/stop:

- **Distractions** — what pulled you out, and when
- **Pauses** and completion state for every session
- **Location** — Home / Office / Cafe / Other, captured via a Leaflet map + geocoding

All of it lands in Supabase tables (`focus_sessions`, `session_events`, `distractions`) that become the raw material the coach reasons over.

## The coach that can't make things up

The AI coach never sees a raw database dump. It's a **tool-calling agent** (OpenRouter → **Gemini 2.5 Flash**) that has to go fetch grounded facts before it's allowed to say anything specific about you:

- `get_focus_trends`, `get_best_focus_windows`, `get_distraction_patterns`
- `get_focus_by_location`, `get_distractions_by_location`
- `get_recent_changes`
- `log_coach_insight` — the one write tool, for saving what it learns

Each chat turn runs a **tool loop of up to 10 iterations**: the model picks tools, the server executes them against Supabase RPC functions, results feed back in, and only then does it answer. The system prompt explicitly forbids fabricating metrics — the coach can push you toward small, testable experiments, but it can't invent a claim about your data it hasn't actually queried for.

Three selectable personalities sit on top of the same grounded core: strict **Alex**, data-focused **Morgan**, encouraging **Sam**.

## Proactive, not just reactive

Beyond the chat, an autonomous agent layer runs in the background — surfacing insights, suggesting sessions, and generating **weekly reports** without being asked. A daily Vercel cron job refreshes derived analytics tables (`daily_focus_stats`, `weekly_focus_patterns`, `focus_anomalies`, `coach_memory`) so the coach is always reasoning over up-to-date aggregates rather than recomputing from scratch on every request.

## Built to be measured

Built for the **Opik (Comet) hackathon**, so every LLM call is traced end-to-end, backed by eval datasets and a before/after experiment comparing an early regression prompt against the tuned production one — the kind of evidence that's usually missing from "the AI got better" claims.

---

## Stack

- **Next.js 15** (App Router), **React 18**, **TypeScript**
- **Supabase** — Postgres, auth, RLS, RPC functions as agent tools
- **OpenRouter → Gemini 2.5 Flash** for the coach
- **Opik** — LLM tracing and evaluation
- **react-leaflet** — location capture and maps
- **Vercel** — hosting + daily cron for analytics refresh
