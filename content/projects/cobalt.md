---
title: "Cobalt"
description: "a platform for running app logic inside an AWS Nitro Enclave with the output cryptographically verified on Monad — a multi-tenant on-chain registry, a reusable secp256k1/EIP-712 enclave server template, and a deploy CLI that takes an app from source to a live, attested endpoint in one command"
date: 2026-08-17
category: web3
image: "/images/cobalt.png"
githubUrl: "https://github.com/mikelord007/Cobalt"
liveUrl: "https://cobalt-alpha-five.vercel.app/"
---

Cobalt is TEE-as-a-service: a hosted way to run app backends inside a **Trusted Execution Environment** instead of a black box you just have to trust. App logic runs inside an **AWS Nitro Enclave**, a hardware-sealed environment, and Monad only accepts a result after AWS's own hardware has proven, via a signed attestation, exactly which code produced it. Not even root access to the host machine can see inside the enclave or forge its output.

Built as a platform first, not a single app — the on-chain registry and the enclave server template don't know anything about the specific app running inside them, so `cobalt deploy <app-dir>` is a single command for the rest of the project's life, whatever you point it at.

---

## The chain: attest → register → verify

`P384Verifier` → `CertManager` → `NitroValidator` → `EnclaveRegistry` vendors a "hinted" on-chain Nitro attestation verifier — the expensive modular-inversion math is computed off-chain and submitted as a hint the contract only *checks*, not *computes*, bringing full attestation verification down from infeasible gas to a handful of transactions. `EnclaveRegistry` is multi-tenant from the start: any number of apps register against the same deployed registry, keyed by `appId`, with a full PCR set binding, signer TTLs, explicit rejection of all-zero (debug-mode) measurements, and config-version invalidation that can atomically cut off every existing signer and allowed image at once.

Every enclave-signed message goes through **EIP-712**, not a hand-rolled intent scheme — mandatory deadline and nonce on every message type, `chainId`/`verifyingContract` binding for replay protection, and wallet-displayable typed data for free.

## The enclave: secp256k1, attestation-gated secrets, no network by default

`enclave-server/` is a reusable Rust template: a fresh secp256k1 keypair every boot (so on-chain verification is a plain `ecrecover`, not hand-rolled Ed25519), an outbound-network allowlist, a health-check endpoint, and attestation-gated KMS secrets — a secret is only ever decrypted from inside an enclave presenting a matching attestation, never visible in transit or to whoever holds the cloud credentials. Apps are drop-in modules under `examples/<name>/`, wired in by a one-line include — app code never lives inside the server template itself.

## The CLI: `cobalt deploy`

`tools/cobalt.js` runs the full sequence against the live registry, end to end: **attest** (build or reuse a cached enclave image, boot it, pull a real hardware attestation) → **createApp** → **setAllowedImage** → **registerEnclave** → **verify** (`isValidSigner` read-back). The first deploy of a given app is a genuine uncached build; every deploy after that hits an S3 artifact cache and just downloads and boots — image *building* is decoupled from image *launching*, which turned the single biggest time cost (a cold hermetic cross-compile, 20–70+ minutes) into a seconds-to-low-minutes operation.

`examples/ping` proves the pipeline (send a message, get an EIP-712-signed reply back, verified by `PingConsumer.sol`); `examples/dice` is a hardware-attested random number an operator can't rig.

---

## Live on Monad testnet

All five contracts — `P384Verifier`, `CertManager`, `NitroValidator`, `EnclaveRegistry`, and the `PingConsumer` example — are deployed and source-verified on MonadVision (Sourcify-backed). A read-only dashboard shows registered apps, allowed images, and signer state straight from that live registry; it doesn't deploy anything itself, `cobalt deploy` does.

---

## Stack

- **Solidity** (Foundry) — the on-chain attestation registry, EIP-712 consumer SDK, vendored Nitro validator
- **Rust** — the enclave server template, secp256k1/EIP-712 signing, NSM attestation
- **Node.js** — the `cobalt` deploy/status CLI
- **AWS Nitro Enclaves**, KMS attestation-gated decrypt
- **Monad** testnet (EVM)
