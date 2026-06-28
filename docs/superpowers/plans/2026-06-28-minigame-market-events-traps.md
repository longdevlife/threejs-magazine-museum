# Minigame Market Events And Trap Telegraph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make RPG gameplay clearer and more fun by letting the host trigger opportunity waves, making traps telegraph before activation, preventing freeze chaining, and adding a phase 1 gate.

**Architecture:** React host writes market event commands and phase gate decisions to Firebase. Phaser host remains the world authority: it listens for event commands, spawns opportunity bursts, publishes telegraphed trap state, and enforces trap activation/immunity locally. Shared pure helpers hold market event definitions and phase 1 gate rules so they can be tested.

**Tech Stack:** React, Firebase Realtime Database, Phaser 3 Arcade Physics, Node test runner, Vite.

---

### Task 1: Test Market Event And Gate Contracts

**Files:**
- Modify: `phaser-rpg/src/economy/config.test.mjs`
- Modify: `src/minigame/gameStateUtils.test.js`

- [ ] **Step 1: Write failing tests**

Add tests that require:
- `MARKET_EVENTS.flash_sale`, `MARKET_EVENTS.review_wave`, and `MARKET_EVENTS.loyal_customer_drop`.
- Each market event has an opportunity type, count, ttl, label, and host label.
- `applyPhaseOneGate` eliminates players with fewer than 3 phase 1 orders, keeps 3-4 orders alive without bonus, and gives 5+ orders a bonus.

- [ ] **Step 2: Run tests and verify they fail**

Run:
`node --test phaser-rpg/src/economy/config.test.mjs src/minigame/gameStateUtils.test.js`

Expected: fail because `MARKET_EVENTS` and `applyPhaseOneGate` do not exist yet.

### Task 2: Implement Shared Contracts

**Files:**
- Modify: `phaser-rpg/src/economy/config.mjs`
- Modify: `src/minigame/gameStateUtils.js`

- [ ] **Step 1: Add `MARKET_EVENTS`**

Define three events:
- `flash_sale`: opportunity `order`, count `8`, ttl `12000`.
- `review_wave`: opportunity `review`, count `6`, ttl `12000`.
- `loyal_customer_drop`: opportunity `loyal_customer`, count `5`, ttl `12000`.

- [ ] **Step 2: Add trap tuning**

Reduce direct punishment and size, and keep phase 2/3 hazard speeds below player speed:
- phase 1 speed `2.0`, phase 2 speed `2.2`, phase 3 speed `2.6`.
- hazard sizes lowered by roughly 20%.
- direct capital penalties lowered for heavy hazards.

- [ ] **Step 3: Add `applyPhaseOneGate`**

Return updated player objects:
- `< 3` orders: `isBankrupt: true`, `capital: 0`, `eliminatedReason`.
- `3-4` orders: alive, no bonus.
- `>= 5` orders: alive, add `score +50`, `capital +1_000_000`, `phaseOneQualified: true`.

- [ ] **Step 4: Run tests and verify green**

Run:
`node --test phaser-rpg/src/economy/config.test.mjs src/minigame/gameStateUtils.test.js`

Expected: pass.

### Task 3: Add Host Event Controls And Phase Gate

**Files:**
- Modify: `src/minigame/HostView.jsx`

- [ ] **Step 1: Write market event commands**

Add host buttons inside RPG phase controls:
- `Tung Flash Sale`
- `Mở Review Wave`
- `Thả Khách Quen`

Each button writes to `marketEvents/<timestamp>_<eventType>` with `{ type, phase, createdAt }`.

- [ ] **Step 2: Gate phase 1 before situation 1**

When host clicks the phase 1 close button, apply `applyPhaseOneGate` to players first, then move to `situation_1`.

- [ ] **Step 3: Clear event commands**

Remove `marketEvents` on reset and when starting phase 1.

### Task 4: Implement Phaser Burst Spawns And Telegraph Traps

**Files:**
- Modify: `phaser-rpg/src/world/HostWorld.ts`
- Modify: `phaser-rpg/src/scenes/Main.tsx`

- [ ] **Step 1: Listen for market events**

`HostWorld` listens to `marketEvents`, ignores already handled ids, and spawns the configured opportunity count as a burst.

- [ ] **Step 2: Add opportunity expiry**

Event-spawned opportunities get `expiresAt`. Phaser removes expired opportunities from Firebase on host update.

- [ ] **Step 3: Add trap telegraph fields**

Each trap gets `activeAt = Date.now() + 1200`, `warningLabel`, `hitboxScale = 0.65`, and `immunityMs = 5500`.

- [ ] **Step 4: Render warning then active state**

Player scene shows a faint warning ring before `activeAt`, then active graphics after it. Collision ignores traps before `activeAt`.

- [ ] **Step 5: Prevent chain freeze**

Player scene uses a global trap immunity timestamp so a newly unfrozen player cannot immediately be hit again.

### Task 5: Rebuild And Verify

**Files:**
- Modify generated: `public/rpg/**`

- [ ] **Step 1: Run tests**

Run:
`node --test src/minigame/gameStateUtils.test.js phaser-rpg/src/economy/config.test.mjs phaser-rpg/src/economy/spawn.test.mjs`

- [ ] **Step 2: Typecheck Phaser**

Run:
`npm run lint:tsc` in `phaser-rpg`.

- [ ] **Step 3: Build Phaser bundle**

Run:
`npm run build` in `phaser-rpg`.

- [ ] **Step 4: Build React**

Run:
`npm run build` in the root repo.

- [ ] **Step 5: Smoke test minigame**

Confirm host buttons render, player HUD still renders, and iframe points to `/rpg/index.html`.
