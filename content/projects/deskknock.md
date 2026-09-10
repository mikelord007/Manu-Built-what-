---
title: "DeskKnock"
description: "a Windows tray app that turns knocks on your desk into keyboard shortcuts using the accelerometer already inside the laptop: it ranks every sensor Windows exposes, calibrates your knock against your own desk's background noise, and maps one, two, or three knocks to actions"
date: 2026-09-09
category: general
image: "/images/deskknock.png"
liveUrl: "https://deskknock.vercel.app/"
githubUrl: "https://github.com/mikelord007/DeskKnock"
---

Knock on your desk and your Windows laptop does something. One knock pauses the music, two pastes, three runs whatever you map it to. Nothing gets plugged in and no microphone is involved: your laptop already contains an accelerometer, the chip that knows which way up it's being held, and a knock on the desk travels through the surface into that sensor as a very small, very sharp bump.

Reading the sensor is the easy part. The actual problem is being confident a bump was a deliberate knock and not you typing, the desk wobbling, or the lid shifting.

---

## Finding a sensor worth using

Laptops expose wildly different motion hardware, and the specs they advertise are often optimistic. So DeskKnock doesn't trust them: it enumerates every standard accelerometer Windows exposes (`Accelerometer.GetDeviceSelector`, `DeviceInformation.FindAllAsync`, `Accelerometer.FromIdAsync`), opens each one for a 2.5-second measurement, and ranks them on the delivery rate and quality it actually observes rather than the interval the driver claims.

The result gets reported honestly rather than papered over:

- **no accessible accelerometer**: says so plainly, and never substitutes keyboard input or invents knocks to look functional
- **under 50 Hz**: still runs, with a "slow sensor, knocks may be missed" warning
- **50 to 199 Hz**: a real candidate, once calibrated
- **200 Hz and up**: a high-rate candidate, still subject to physical validation

There's no raw-HID reverse engineering and no administrator-only fallback, only public Windows sensor APIs. On the Galaxy Book5 Pro 360 it was built against, that yields 100.20 Hz delivery with zero duplicate or reversed timestamps and zero queue overflows across a 15-second probe.

## Calibrating against your own desk

Rather than shipping a fixed threshold and hoping, setup measures both sides of the problem on your actual desk. Eight seconds of the background you want ignored (typing, bumps, ordinary vibration), then eight seconds of five deliberate knocks.

It compares those in 150 ms peak blocks: the threshold has to clear the loudest unwanted vibration by 30%, at least three knock blocks must land above it, and the two populations need another 25% of separation. If the signals overlap, calibration refuses to pick a number and leaves your existing setting alone instead of shipping a threshold it can't justify. A live graph shows the trace while you do it, keeping short peaks that would otherwise vanish between screen refreshes.

## The detector

Every stage works from elapsed time rather than a fixed sample count, so the same code holds up across sensors running at different rates: gravity tracking on a 350 ms time constant, a 45 ms magnitude envelope, and a 2-second noise floor feeding an adaptive threshold.

An impulse has to be at most 120 ms wide, with a 70 ms refractory interval after it, and knocks group into gestures inside a 320 ms window. A triple resolves the moment its third knock lands, while singles and doubles wait out the window so they don't fire ahead of a triple that's still arriving. Sustained movement has to fall back below threshold before the detector rearms, and a timestamp discontinuity or channel overflow throws away whatever gesture was mid-flight.

The regression suite runs synthetic signals at 50, 100, 200, and 800 Hz through all of it: stationary gravity, one/two/three impulses, refractory ringing, slow tilt, long movement, and typing recovery. 79 tests, on a deliberately dependency-free runner.

## What it won't do

A lot of the design is restraint, given a sensor this cheap can be talked into saying almost anything:

- **No direction mapping.** MacTap, the Mac app this borrows architecture ideas from, reads roughly 800 Hz and can infer which side was tapped. At a measured 100 Hz that inference isn't supported, so `SideClassifier` explicitly abstains instead of guessing.
- **Typing suppression without a keylogger.** It checks whether typing keys are currently down via `GetAsyncKeyState`. No keyboard hook is installed and no text is recorded.
- **A narrow action surface.** Shortcuts are parsed and validated, `OpenApplication` needs a full path to a real `.exe` with no arguments, and `OpenUrl` takes HTTP/HTTPS only. Arbitrary shell strings, batch files, and PowerShell commands are rejected outright. Every mapping starts as `None`, so calibrating can't accidentally fire anything.
- **No telemetry and no network service.** Settings and recordings stay in `%LOCALAPPDATA%`, and executing a gesture never steals focus from the window you're working in.

## Shipping it

The installer puts the app under `%LOCALAPPDATA%\Programs\DeskKnock` for the current user only, so there's no administrator elevation prompt, and upgrades and uninstalls both leave your calibration and mappings untouched. Its Inno Setup compiler is pinned and verified by SHA-256 and publisher signature before it's allowed to run.

Release automation builds the installer and a portable ZIP on a disposable Windows runner and then actually exercises them: fresh install, upgrade over an existing copy, launching the installed app, uninstall, and settings preservation, publishing SHA-256 checksums alongside both downloads. The build is still unsigned, so SmartScreen can warn on it, which the README says outright rather than burying.

---

## Stack

- **C# / .NET 8**, WPF, targeting `net8.0-windows10.0.19041.0`
- **Windows sensor APIs**: `Windows.Devices.Sensors.Accelerometer`, `DeviceInformation` enumeration, `ReportInterval` management
- `SendInput` and `GetAsyncKeyState` for action dispatch and typing suppression, `NotifyIcon` for the tray
- A standalone **probe** console app that records every accessible sensor to CSV at once
- **Inno Setup** installer plus GitHub Actions release automation on a Windows runner
- **Next.js** marketing site on Vercel
