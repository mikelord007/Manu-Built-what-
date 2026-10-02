---
title: "Wanderkin"
description: "photograph an everyday object and it gets rebuilt in 3D, then you shrink down and explore it: a desk becomes a cliff, a sofa a plateau, with a generated biome, a laid-out course, a grappling hook, and its own chiptune, all generated through Livepeer"
date: "2026-09-27"
category: ai
image: "/images/wanderkin.jpg"
detailMedia: "/images/wanderkin-gameplay.mp4"
detailAspect: "15 / 8"
liveUrl: "https://wanderkin-tau.vercel.app/"
githubUrl: "https://github.com/mikelord007/Wanderkin"
winner: true
---

Photograph something ordinary and Wanderkin rebuilds it in 3D, then shrinks you down until it towers over you. A desk becomes a cliff, a shoe a mountain, a sofa a plateau. You run, jump, climb, and swing a grappling hook across the thing you photographed, set in a biome you choose and scored by its own chiptune.

The landing page has four worlds already built in (a desk on a beach, a plane in the snow, a boot in the rain, a car in the dunes), so you can play without taking a photo.

Built for the **Livepeer x Embody hackathon**, where it won $1,000. [See the announcement on X](https://x.com/topagentmike007/status/2105518462626095286).

---

## From one photo to a world

Creating a world takes five steps:

1. **Photo.** Upload or take one photo. The background is removed and you confirm the cutout.
2. **Look.** Pick an art style (Cartoon, Hand-painted, or Watercolor) and an adventure mode, plus optional atmosphere words.
3. **Biome.** Pick what the object grows into: Monsoon Marsh, Tropical Island, Desert, Snowy Alpine, Autumn Forest, Volcanic Ember, or the original room from the photo. It locks once you continue.
4. **Preview.** A styled image of your object shows the visual direction before anything expensive runs.
5. **World.** The object is rebuilt in 3D, a course is laid out through it, and its music is generated. You can enter as soon as the course is ready.

Worlds are saved to your Google account, and finished ones can be shared as immutable, playable links.

## Generation on Livepeer

All generative work runs server-side through **Livepeer's Agent network (MCP)**, using four capabilities:

- **Background removal** with `bg-remove` (BiRefNet)
- **Styled preview** with `kontext-edit` (FLUX Kontext Pro)
- **Image to 3D** with `rodin-i3d` (Hyper3D Rodin v2.5)
- **Soundtrack** with `music` (MiniMax Music v2), always an upbeat Game Boy-style loop

A world costs roughly **$0.50**, almost all of it the 3D step. The server enforces per-request, per-world, daily, and global spend ceilings plus a retry limit. Jobs are durable: every submission carries an idempotency key that is also passed through to Livepeer, and uploads are content-addressed by SHA-256. A refresh, a crash mid-submit, or a return visit picks up the same job instead of paying for it twice.

## Walking on a reconstruction

A generated mesh isn't a level. Course preparation normalizes the GLB, adds a floor, extracts collision triangles, samples standable surfaces, checks capsule clearance, and lays out checkpoints only where the route is actually reachable.

The player is a kinematic capsule on **Rapier's** character controller, stepped at a fixed 60 Hz and interpolated for rendering. All level geometry is static, so the whole simulation is deterministic, and the test suite drives the same `GameSimulation` class headlessly that the browser does. Rapier's own grounding check flickered on triangle seams (6 to 12 false airborne steps per 300), so grounding is confirmed with an explicit downward probe, bringing that to zero.

Three modes sit on top:

- **Collect:** find the lost color fragments, and the world's color comes back as you do, then enter the portal.
- **Explore:** visit the marked destinations at your own pace, with no timer.
- **Race:** a countdown, ordered checkpoints, and a personal best per published world.

## Climbing the thing you photographed

- **Mantle:** press `E` to pull up onto ledges up to about 0.9 m, only when the whole path is clear.
- **Grappling hook:** hold right mouse or `F` and the camera eases to an over-the-shoulder view. Every anchor is classified as a standable top, a ledge lip, or a wall, and each route is swept with the capsule before the reticle offers it, which is what gets you round overhangs like a desk top over its drawers.
- **Solid scenery:** biome trees, cacti, rocks, and stumps get cheap primitive colliders, but placement keeps every footprint off the verified route, so props can never block the mission.

## Stack

- **React, Three.js, React Three Fiber, and Rapier** for the game and physics, built with **Vite**
- **Node and Express** API running as a container on a Google Compute Engine VM behind Caddy
- **Livepeer Agent MCP** for all generation, with **Supabase Auth** for Google sign-in
- **Vercel** for the static client, rewriting `/api/*` to the VM so the browser sees one origin
- **Vitest** for unit and headless gameplay simulation tests, **Playwright** for browser end-to-end tests
