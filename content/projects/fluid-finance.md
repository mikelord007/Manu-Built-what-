---
title: "Fluid Finance"
description: "a lending/borrowing and options-based liquidity-mining protocol pair written in Cadence for Flow, where every position is an owned resource: collateral buckets check under-collateralization before every borrow or withdrawal, and staking rewards mint as redeemable, time-limited option tokens instead of a plain emission"
date: 2023-10-07
category: web3
image: "/images/fluid-finance.png"
githubUrl: "https://github.com/mikelord007/fluid-finance"
winner: true
---

Fluid Finance is a pair of DeFi protocols on Flow: a lending & borrowing market where you deposit crypto as collateral and borrow against it, and a staking system where rewards pay out as redeemable option tokens instead of a plain drip of coins. Both lean on something most chains don't have: Cadence, Flow's smart contract language, treats your position as a first-class **resource** instead of a row in someone else's ledger, something that lives in your own account storage and can't be copied, only moved.

---

## Lending & Borrowing (L&B)

Each user's collateral is a `liquidityBucket` **resource**, tracked by UUID rather than an address-keyed balance. Every `supplyTokens` / `borrowTokens` / `unSupplyTokens` call runs `checkIfBucketIsUnderCollateralized` against that specific bucket before it's allowed to complete: under-collateralized borrows and under-collateralized withdrawals both revert, not just get flagged.

An `Administrator` resource controls the global `borrowLimitPerBucket` plus a per-token `supplyTokensLimit` / `borrowTokensLimit` map, so which assets can be supplied or borrowed, and how much of the pool they can consume, is configurable per token rather than hardcoded.

## Option Liquidity Mining (OLM)

Instead of emitting a plain reward token, staking here mints **option tokens** (a separate `OptionToken.Minter` resource issues them at a configurable `rewardRate`) that expire after `timeToExpireOtokens` and are redeemable for a distinct payout token via a `PayoutToken` vault. A `stakeAccountingKey` resource (handed to the staker) is what makes a given stake claimable or unstakable at all: lose it and you lose the claim, same resource-ownership model as the L&B buckets.

## Sample flows

The README doubles as a runnable walkthrough: `flow transactions send` / `flow scripts execute` commands for both protocols end to end: create a bucket → supply → borrow → repay → unsupply for L&B, and stake → claim oTokens → redeem for payout → unstake for OLM.

---

## Stack

- **Cadence** smart contracts on **Flow**
- Custom `FungibleToken`/`NonFungibleToken`/`MetadataViews` standard implementations under `cadence/contracts/standards`
- **Flow CLI** (`flow emulator`, `flow dev`) for local development against the emulator
