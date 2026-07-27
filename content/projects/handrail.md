---
title: "Handrail"
description: "a voice-first Android GUI agent for Indian languages — narrates any screen aloud in your language, or takes over a multi-step task and hard-stops before it pays, sends, or submits anything"
date: 2026-07-27
image: "/images/handrail.png"
githubUrl: "https://github.com/mikelord007/HandRail-Sarvam-Hack"
---

Built for the **Sarvam hackathon**, Handrail is a native Android accessibility agent aimed at anyone who finds a phone screen hard to parse — narrating what's on screen and, when asked, driving multi-step tasks through it — entirely in Indian languages, with no vision model in the loop.

There are two modes over one shared perception layer.

---

## Narration mode

Long-press home to invoke Handrail as the system assistant (a real `ASSIST` intent handler, not a floating-bubble hack). It grabs the current screen through Android's `AccessibilityService` node tree, sends a filtered summary to an LLM, and speaks the result back in the user's language via **Sarvam Bulbul** TTS. No screenshots, no OCR, no screen-capture APIs — Sarvam has no screen-grounding vision model, so grounding comes entirely from the accessibility tree.

## Takeover mode

Speak a task (captured via **Sarvam Saaras** STT) and Handrail runs an agent loop: perceive the screen → an LLM picks the next tool call (`tap`, `set_text`, `scroll`, `back`, `home`, `done`, `ask_user`, `blocked`) → execute it → narrate the step aloud → re-perceive → repeat, capped at a 12-step budget.

**The hard stop is the actual feature.** Before executing any tap, the target node's text is checked against a keyword list — pay, send, confirm, order, submit, transfer, and Hindi/Kannada equivalents — in code, not just prompt instructions. On a match, Handrail narrates what the button is about to do and hands the final tap back to the user instead of completing it.

## Perception, kept small

Raw accessibility trees blow past any reasonable context window, so every pass:

- keeps only nodes that are clickable, editable, scrollable, checkable, or carry text/content-description
- assigns each a short ref (`e1`, `e2`, …) and serializes it one line per node, e.g. `e4 Button "Pay now" clickable bounds=[540,1820]`
- caps output at ~150 nodes, preferring on-screen actionable elements
- re-resolves refs from the latest pass on every step — stale `AccessibilityNodeInfo` after a screen change is a real crash source, not a hypothetical one

Text entry gets the same honesty treatment: `ACTION_SET_TEXT` silently fails on WebViews and some custom fields, so every `set_text` re-reads the node afterward and falls back to clipboard + paste if it didn't take — and reports failure to the agent loop rather than pretending it worked.

The perception layer is adapted from [MobileClaw](https://github.com/ChenKuanSun/MobileClaw) (MIT).

---

## Stack

- **Kotlin**, native Android, `minSdk 26` — Jetpack Compose for UI
- **AccessibilityService + AccessibilityNodeInfo** tree for perception — no vision, no screenshots
- **Sarvam Saaras** (STT) and **Sarvam Bulbul** (TTS)
- Reasoning/tool-calls behind a single OpenAI-compatible chat-completions client (plain **OkHttp** + **kotlinx.serialization**), switchable between an OpenRouter dev config and the shipping Sarvam endpoint behind one flag
- **kotlinx-coroutines** for overlapping TTS narration with the next perception pass
