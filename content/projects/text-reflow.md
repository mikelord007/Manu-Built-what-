---
title: "Text ReFlow"
description: "two interactive text reflow demos powered by @chenglou/pretext — a playable ping pong game where text wraps around the ball, and a webcam mode where your face and hands become live obstacles"
date: 2026-03-30
image: "/images/text-reflow.png"
detailMedia: "/videos/text-reflow.mp4"
liveUrl: "https://text-reflow.vercel.app/"
githubUrl: "https://github.com/mikelord007/text-reflow"
---

It started with one question: what if text weren't a static block, but a material that **moved around things** — the way water finds its way around a stone?

**`@chenglou/pretext`** is a layout engine built around exactly that idea. Instead of flowing text into a fixed rectangle, it exposes two primitives:

- **`prepareWithSegments`** — pre-segments a string for fast line-breaking
- **`layoutNextLine`** — given a cursor and a slot width, returns the next line that fits

No opinion about what the slot is, or why it's shaped that way. **The obstacle could be anything.**

I built two demos on top of that, each pushing on a different kind of obstacle.

---

## Demo 1 — Spin & Prose

**A pong game where the text reflows around the ball in real time, every frame.**

**Physics**

- Ball radius: **12px**, initial speed: ~**250px/s** horizontal
- Paddles: **14 × 82px**, moving at **420px/s**
- Ball **accelerates 2% on every paddle hit** (`vx *= 1.02`)
- Angle kick based on **where the ball hits relative to the paddle midpoint** — so aim matters

**Controls**

- Left player: **W / S** keys
- Right player: **↑ / ↓ arrow keys**
- Mobile: **both paddles are draggable**

**The reflow trick — `carveSlots`**

Every frame, before asking pretext for the next line:

- Compute which horizontal intervals the ball **overlaps on each text row** (circle-to-band chord geometry)
- Subtract blocked intervals from the full line width → **remaining gaps are the slots**
- Drop any slot **narrower than 46px** — nothing readable fits below that
- Each surviving slot gets its own **`layoutNextLine` call**

Result: text flows in **two segments around the ball** if it's mid-line, or one if it's near an edge. **60 times a second.**

**Sound — all synthesized, no audio files**

- Paddle hit: **square-wave chirp** (540Hz → 370Hz)
- Wall bounce: **triangle wave** (320Hz → 260Hz)
- Score: **two ascending sine tones** (440→660Hz, then 660→880Hz)
- All built with `OscillatorNode` + `GainNode` from the **Web Audio API**

**Typography:** 17px Georgia, 30px line height — the combination that makes reflow feel like you're reading, not watching a benchmark.

---

## Demo 2 — Matrix & Prose

**Your webcam feed becomes the obstacle. Face, hands, and body silhouette — the text wraps around your shape in real time.**

**ML pipeline — three MediaPipe models running concurrently**

- **`FaceDetector`** — BlazeFace short-range
- **`HandLandmarker`** — hand keypoints
- **`PoseLandmarker`** — full body silhouette (lite model)

All from **`@mediapipe/tasks-vision`**, loaded via CDN WASM.

**Performance tradeoff**

- ML inference is **throttled to once every 90ms** (~11Hz) — running all three models every 16ms dropped layout rate on mid-range hardware
- The **video feed and ASCII overlay keep running at full framerate**; only the obstacle map updates at 11Hz
- At that cadence, **the lag is unnoticeable**

**The ASCII overlay**

- Webcam frames are sampled onto an **off-screen canvas**
- Pixel brightness maps through a **15-character ramp: `' .,:;i1tfLCG08@'`**
- "Falling code" columns animate independently with **random per-column speeds**
- Five tunable sliders: **density, speed, contrast, brightness, sharpness** — all hot, no re-initialization

**How your shape becomes a text obstacle**

- MediaPipe detections build a **smoothed binary mask** (exponential decay to kill flicker)
- Mask is expanded into a **contour-per-row structure** — one blocked interval per detected body row
- Each row's contours feed into `carveSlots`, **exactly like the ball in Demo 1**

---

## Stack

- **`@chenglou/pretext`** — the reflow engine
- **`@mediapipe/tasks-vision`** — face, hand, pose detection
- **Vite** — zero-config build
- **TypeScript** throughout, no framework
- **Web Audio API** — synthesized sounds, zero audio files
- Everything else: **DOM APIs**, `requestAnimationFrame`, `PointerEvent`
