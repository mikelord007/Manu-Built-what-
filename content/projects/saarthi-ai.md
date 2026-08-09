---
title: "Saarthi AI"
description: "a voice-first Android agent for Indian languages that narrates any screen and can take over multi-step tasks — Claude-powered tool calls over the accessibility tree, streaming Sarvam STT and Maya TTS across 10 languages, and a dedicated guard that hands control back before anything irreversible"
date: 2026-08-08
image: "/images/saarthi-ai.png"
githubUrl: "https://github.com/mikelord007/Saarthi-AI"
---

Saarthi ("charioteer, guide" in Hindi) is the next iteration of the same idea behind an earlier hackathon project of mine — a voice-first Android accessibility agent for people who find a phone screen hard to parse — rebuilt from scratch with a real agent loop and a native-Claude reasoning core, in Indian languages, on-device speech throughout.

35 commits landed in the first two days.

---

## The agent loop

`ChatRouter` decides whether a spoken turn is a question, a short confirmation ("yes" answering something said earlier), or a task. Tasks go to `AgentLoop`, which runs on **Claude Haiku 4.5 at `effort: high` with adaptive thinking**: perceive the screen → pick a tool call → execute → narrate the step → re-perceive → repeat.

`ChatRouter` also carries real self-knowledge of what the agent can and can't do, so it can answer "can you do X?" honestly instead of just attempting X and failing.

## Perception and the safety guard

`ScreenPerception` reads the current screen through `SaarthiAccessibilityService` — no vision model, no screenshots, same grounding approach as Handrail. `ActionExecutor` carries out the chosen tool call, and `IrreversibleActionGuard` sits in front of every tap, checking the target node before it fires and handing back to the user instead of completing anything that looks irreversible.

`LoginWallDetector` catches a specific failure mode directly: the agent tapping a web-search result *about* an app instead of opening the app itself.

## Speech

- **`SarvamStreamingStt`** — streaming speech-to-text with VAD auto-stop, so recording ends on its own instead of waiting for a fixed timeout
- **`MayaTts`** — streaming text-to-speech for narration, switched over from an earlier Sarvam-TTS integration once Maya's streaming endpoint held up better in practice
- The app is localized into **10 languages**, with real voice samples wired into the onboarding voice picker so you hear the actual voice before picking it

## Interface

A translucent assist overlay (long-press home — a real `ASSIST` intent handler, same as Handrail) plus a full app shell: onboarding, home, conversation history and threads, settings, and a dedicated hand-back screen for when the guard stops a task.

---

## Stack

- **Kotlin**, native Android, Jetpack Compose
- **AccessibilityService** perception layer — no vision, no screenshots
- **Claude Haiku 4.5** (`ClaudeClient`) for routing and the agent loop
- **Sarvam** streaming STT, **Maya** streaming TTS
- Local on-device chat history store, no backend
