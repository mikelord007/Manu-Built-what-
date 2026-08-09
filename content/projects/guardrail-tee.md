---
title: "GuardRail TEE"
description: "an AWS Nitro Enclave server, built on Sui's Nautilus framework, that loads a language model, runs it through a safety-scoring test suite, and produces a signed PDF report — so an AI safety evaluation is cryptographically attestable on-chain instead of taken on faith"
date: 2025-11-23
image: "/images/guardrail-tee.png"
githubUrl: "https://github.com/mikelord007/GuardRail-TEE"
---

"The model passed our safety eval" is usually a claim you have to trust. GuardRail runs the eval inside a **Trusted Execution Environment** instead, so the result comes with proof that the exact published code — unmodified — is what actually produced it.

It's built on **Nautilus**, Sui's framework for verifiable off-chain computation: a server runs inside an AWS Nitro Enclave, its attestation document (containing the enclave's Platform Configuration Registers) gets verified and registered on-chain via a Sui Move contract, and every response the enclave signs afterward is checkable against that registration without re-running the expensive on-chain attestation check each time.

---

## What GuardRail does with that

On top of the Nautilus template, the `guardrail` module:

- loads a Hugging Face causal LM (evaluated against **distilgpt2**) inside the enclave
- runs it through `test_suite.json` against a `scoring_schema.json` rubric
- renders a signed **PDF report** of the results (via ReportLab) as the artifact you'd hand to a counterparty

Because the code path runs inside the enclave, the PCR values in the attestation prove that report came from the published source and nothing else — a third party can rebuild the same server, compare PCRs, and confirm it matches before trusting a single score in the report.

## Trust model

- The Nitro attestation document chains back to **AWS as root CA**, confirming the enclave is running exactly the registered, unmodified build
- **Reproducible builds** mean anyone can build the same source and compare the resulting PCRs — any code change produces different PCRs, so tampering is detectable, not just "trusted"
- On-chain attestation verification is deliberately a one-time cost (at enclave registration); after that, the enclave's own signing key verifies responses cheaply

## Enclave lifecycle

`configure_enclave.sh` / `register_enclave.sh` / `expose_enclave.sh` cover building the Nitro image, registering its PCRs and attestation via the Move contract in `move/enclave/`, and exposing the running enclave through a traffic-forwarding proxy — with a small **Rust** helper (`nsm-attestation-helper`) talking to the Nitro Secure Module directly for attestation documents.

---

## Stack

- **AWS Nitro Enclaves** running a reproducible build (Nautilus framework)
- **Python** (Flask) server, **Hugging Face Transformers** + PyTorch for model loading and scoring
- **Rust** NSM attestation helper
- **Sui Move** contract for on-chain enclave/PCR registration
