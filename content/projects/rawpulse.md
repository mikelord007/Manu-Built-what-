---
title: "RawPulse"
description: "an Android app that reads a WHOOP band's Bluetooth heart-rate broadcast directly and pushes live BPM, HRV, and zone data to home-screen widgets roughly once a second — real-time data the official WHOOP app and API don't expose"
date: 2026-07-24
category: general
image: "/images/rawpulse-detail.jpg"
imageAspect: "718/897"
detailMedia: "/images/rawpulse.jpg"
detailAspect: "1072/1600"
githubUrl: "https://github.com/mikelord007/RawPulse"
---

WHOOP's own app shows recovery, strain, and sleep — but no live per-second heart rate. RawPulse fills that one gap: a home-screen widget that updates roughly once a second, plus a live HRV reading WHOOP doesn't surface at all.

It works by subscribing to the standard Bluetooth **Heart Rate broadcast** (`0x180D` / `0x2A37`) that a WHOOP 4.0/5.0 emits when HR Broadcast is enabled — the same signal Peloton, Zwift, and Garmin read. Nothing goes through WHOOP's servers, there's no login, and there's no per-user setup.

---

## Why not the WHOOP API

The official WHOOP Developer API is cycle-based — recovery, strain, sleep — and doesn't expose continuous heart rate at all. Per-second HR only exists locally, over Bluetooth, via the band's standard Heart Rate Service. `WhoopHrManager` subscribes to that stream directly instead of going anywhere near the cloud API.

## Widgets

Four square home-screen tiles, all live while streaming is on:

- **Live Heart Rate** — big BPM number, colour-coded by zone
- **Live HRV** — rolling RMSSD over the last ~60s, not shown live anywhere in WHOOP's own app
- **HR Session** — min / avg / max BPM and elapsed streaming time
- **HR Zone** — percent of max HR with a zone-coloured bar

## Architecture

Android's built-in widget refresh has a 30-minute floor, so real per-second updates have to be pushed, not pulled. A **foreground service** holds the BLE connection and pushes each new reading straight to the widgets, backed by a persistent notification with a Stop button. `HrRepository` is the shared source of truth that the service and every widget read from.

Trade-offs that come with that design: only one device can receive the WHOOP's broadcast at a time (so RawPulse and, say, Zwift can't both listen simultaneously), a persistent BLE connection costs noticeably more battery than idle, and losing range just freezes the widgets at their last value until the band reconnects.

## Distribution

No Play Store listing — releases ship as signed APKs tracked through **Obtainium**, so installs update in place without needing to uninstall first. Zero-setup was a deliberate constraint: no WHOOP developer credentials, no per-user OAuth, just Bluetooth.

---

## Stack

- **Kotlin**, native Android, `minSdk 31`
- **BLE Heart Rate Service** (`0x180D`) — no cloud API, no login
- **Foreground service + `AppWidgetProvider`s** for the four live tiles
- Signed release builds distributed via **GitHub Releases + Obtainium**
