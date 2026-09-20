---
title: "Fruit Fly Fruit Ninja"
description: "a 3D salad game where fruit flies learn which fruit to volunteer for and how to fly a shared knife, with two neural circuits, real fly connectome wiring, and a live brain inspector"
date: "2026-09-20"
category: ai
image: "/images/fruit-fly-fruit-ninja.png"
imageAspect: "2 / 1"
detailMedia: "/images/fruit-fly-fruit-ninja-gameplay.gif"
detailAspect: "8 / 5"
liveUrl: "https://fruit-fly-fruit-ninja.vercel.app/"
---

Eight tiny chefs wait on shelves, jars, and counter edges. Order a fruit salad and the flies that have learned to like its ingredients volunteer, fly over to a shared knife, and help you slice. Time the chop, fill the bowl, or race a 90-second rush.

Built for **Fruit Fly-athon**, the idea was to make simulated neural plasticity something you can play with: teaching changes who joins the crew, and a learned motor controller changes how they move. The Brain panel follows the active fly so you can watch both happen.

[View the hackathon submission on Devfolio](https://devfolio.co/projects/fruit-fly-fruit-ninja-7f09).

## Two circuits, two kinds of learning

The game uses a selected **MaleCNS connectome subset: 319 neurons and 2,117 directed connections**. The two circuits reuse that anatomical wiring, but have different jobs and different learned weights.

The **smell circuit** decides which flies volunteer. Synthetic fruit odors enter through **124 projection neurons (PNs)** and pass through fixed anatomical connections to **192 Kenyon cells (KCs)**, the mushroom body's feature neurons. An **APL** feedback unit helps keep activity sparse. Plastic KC-to-**MBON11** connections turn the odor response into a preference score. A PPL101 neuron is retained in the anatomical subset but is inactive in this snack-learning rule.

Each fly has its own smell weights. In **Smell school**, pairing a fruit with a snack strengthens the active KC-to-MBON connections using an engineered reward-paired associative rule. Kiwi starts with no volunteers: teach two chefs kiwi, and they join the waiting order. Sniffing shows activity without changing the weights.

## Learning to fly the knife

The **motor circuit** receives 13 engineered observations: target offset, velocity, orientation error, angular velocity, and load. A fixed encoder maps these into PN activity, which flows through the anatomical PN-to-KC wiring. A learned readout turns the KC features into six controls: **fx, fy, fz** for force and **tx, ty, tz** for torque. These are engineered control outputs, not identified biological motor neurons.

Training uses **supervised imitation with ridge regression**. An autopilot supplies target actions for 1,800 simulated states; the browser fits 1,152 output weights and copies the lesson to the eight flies. Only the readout learns. This small regression runs in a Web Worker, which is why the training button finishes quickly. It isn't reinforcement learning, and ordinary gameplay doesn't update the flight weights.

The learned controller steers flies from their perches to the knife and back, then moves the shared knife through three-dimensional physics. Waypoints choose destinations; force and torque determine movement. Attached carriers stay fixed to their grips as the knife moves.

## Make the learning visible

- **Teach kiwi** and watch previously uninterested chefs volunteer.
- **Erase and retrain flight** to see motor outputs disappear and return.
- **Switch between learned, autopilot, and untrained control** for a direct comparison.
- **Tap the wind icon** and watch the controller recover while the six live outputs change.
- **Inspect either circuit** in the rotatable Brain panel, or open the original physics lab for the earlier flight experiments.

The distinction matters: the connection topology comes from real fly anatomy; the odors, learning rules, motor encoder, waypoints, and simplified physics are engineered. The neural display shows model activity at schematic positions, not recorded spikes. The project demonstrates simulated plasticity, without claiming to reconstruct a complete fly brain or improve human neuroplasticity.

## Stack

- **JavaScript, Three.js, and WebGL** for the kitchen, flies, fruit, and brain inspector
- **Web Workers** for in-browser motor training
- Quaternion rigid-body motion and swept 3D blade contact for flight and slicing
- **Vercel** static hosting, with no backend or API key required to play
- Anatomical data under **CC BY 4.0**, attributed in the project's data provenance; code under **MIT**
