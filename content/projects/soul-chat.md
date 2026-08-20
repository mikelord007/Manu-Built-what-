---
title: "Soul Chat"
description: "a peer-to-peer video chat app where getting matched with strangers who share your interests earns ERC-20 'Soul' tokens and NFTs: WebRTC video over SvelteKit, wallet connect via Web3Modal on Polygon Mumbai"
date: 2023-02-02
category: web3
image: "/images/soul-chat.png"
liveUrl: "https://soul-chat-mikelord007.vercel.app/"
githubUrl: "https://github.com/mikelord007/Soul.chat"
winner: true
---

Omegle-style random video chat, but matching is steered by shared interests you type in up front, and the app itself has a stake in whether the conversation goes well: reward tokens for a good match, not just a video feed.

---

## Matching and rewards

You list your interests and land in a peer-to-peer video call. A **"Reap Soul"** flow lets you gift the person you're talking to **Soul tokens** (an ERC-20) and NFTs mid-chat, and the app surfaces mutual interests between you and your match to help the conversation actually go somewhere.

## Video

Calls run over **WebRTC** via `simple-peer`, with **Socket.IO** handling the signaling exchange between peers to establish the connection; no video ever passes through a central server once the call is live.

## Wallet and chain

Wallet connection goes through **Web3Modal**, targeting **Polygon Mumbai** testnet, with **ethers.js** handling the token/NFT contract calls behind the gift-and-reap flow.

---

## Stack

- **SvelteKit**, TypeScript, Tailwind
- **WebRTC** (`simple-peer`) for peer video, **Socket.IO** for signaling
- **ethers.js** + **Web3Modal** for wallet connect and on-chain token/NFT calls
- Deployed on **Vercel**
