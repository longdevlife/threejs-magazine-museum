# Minigame Phase Gates NPC Escape Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement hard phase 1 order/review qualification, phase 2 hidden loyal-customer NPC with a 60-second elimination timer, and phase 3 exit-gate race.

**Architecture:** React HostView controls phase transitions and gate evaluation through Firebase. Phaser host remains world authority for NPC/gate spawning and writes `npcs`/`gates` state to Firebase. Player Phaser iframe detects collision with NPC/gate and posts messages to React, which performs Firebase transactions.

**Tech Stack:** React, Firebase Realtime Database, Phaser 3 Arcade Physics, Vite, Node test runner.

---

## File Map

- `src/minigame/gameStateUtils.js`: pure qualification helpers for phase 1, phase 2, escape ranking.
- `src/minigame/gameStateUtils.test.js`: unit tests for qualification helpers.
- `src/minigame/situations.js`: React-visible phase mission copy and progress goals.
- `src/minigame/HostView.jsx`: host buttons, countdown displays, phase gate application.
- `src/minigame/RpgGamePlay.jsx`: handle `FOUND_LOYAL_CUSTOMER` and `ESCAPED_GATE` messages from Phaser.
- `src/minigame/PlayerView.jsx`: eliminated/escaped player screens.
- `phaser-rpg/src/economy/config.mjs`: Phaser-visible phase config, market event config, and NPC/gate constants.
- `phaser-rpg/src/economy/config.test.mjs`: config tests.
- `phaser-rpg/src/world/HostWorld.ts`: spawn and maintain phase 2 NPC and phase 3 gate.
- `phaser-rpg/src/scenes/Main.tsx`: render NPC/gate, collision detection, post messages to parent.
- `public/rpg/**`: generated Phaser bundle after `phaser-rpg npm run build`.

---

### Task 1: Add Qualification Helper Tests

**Files:**
- Modify: `src/minigame/gameStateUtils.test.js`

- [ ] **Step 1: Add phase 1 hard gate tests**

Add tests:

```js
test("applyPhaseOneGate eliminates players missing reviews even with enough orders", () => {
  const player = {
    name: "An",
    score: 100,
    capital: 10_000_000,
    progress: { phase_1: { order: 5, review: 1 } },
    isBankrupt: false,
  };

  assert.equal(applyPhaseOneGate(player).isBankrupt, true);
  assert.equal(applyPhaseOneGate(player).eliminatedReason, "Không đạt 5 đơn hàng và 2 review ở Phase 1");
});

test("applyPhaseOneGate qualifies players with 5 orders and 2 reviews", () => {
  const player = {
    name: "Binh",
    score: 120,
    capital: 12_000_000,
    progress: { phase_1: { order: 5, review: 2 } },
    isBankrupt: false,
  };

  const result = applyPhaseOneGate(player);
  assert.equal(result.isBankrupt, false);
  assert.equal(result.phaseOneQualified, true);
});
```

- [ ] **Step 2: Add phase 2 gate tests**

Add tests for a new helper `applyPhaseTwoGate(player)`:

```js
test("applyPhaseTwoGate eliminates players who do not find the loyal customer", () => {
  const player = {
    name: "Chi",
    score: 80,
    capital: 8_000_000,
    progress: { phase_2: {} },
    isBankrupt: false,
  };

  const result = applyPhaseTwoGate(player);
  assert.equal(result.isBankrupt, true);
  assert.equal(result.eliminatedReason, "Không tìm được khách ruột trong 60 giây");
  assert.equal(result.phaseTwoQualified, false);
});

test("applyPhaseTwoGate qualifies players who find the loyal customer", () => {
  const player = {
    name: "Dung",
    score: 90,
    capital: 9_000_000,
    progress: { phase_2: { loyal_customer_found: 1 } },
    isBankrupt: false,
  };

  const result = applyPhaseTwoGate(player);
  assert.equal(result.isBankrupt, false);
  assert.equal(result.phaseTwoQualified, true);
});
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
node --test src/minigame/gameStateUtils.test.js
```

Expected: tests fail because `applyPhaseTwoGate` does not exist and phase 1 still only gates by orders.

### Task 2: Implement Qualification Helpers

**Files:**
- Modify: `src/minigame/gameStateUtils.js`

- [ ] **Step 1: Update phase 1 helper**

Change `applyPhaseOneGate` to require:

```js
const orders = Number(player.progress?.phase_1?.order) || 0;
const reviews = Number(player.progress?.phase_1?.review) || 0;
const qualified = orders >= 5 && reviews >= 2;
```

If not qualified, return:

```js
{
  ...player,
  capital: 0,
  isBankrupt: true,
  eliminatedReason: "Không đạt 5 đơn hàng và 2 review ở Phase 1",
  phaseOneQualified: false,
}
```

- [ ] **Step 2: Add phase 2 helper**

Add:

```js
export const applyPhaseTwoGate = (player) => {
  if (!player) return player;
  const found = Number(player.progress?.phase_2?.loyal_customer_found) || 0;

  if (found < 1) {
    return {
      ...player,
      capital: 0,
      isBankrupt: true,
      eliminatedReason: "Không tìm được khách ruột trong 60 giây",
      phaseTwoQualified: false,
    };
  }

  return {
    ...player,
    isBankrupt: Boolean(player.isBankrupt),
    phaseTwoQualified: true,
  };
};
```

- [ ] **Step 3: Run helper tests**

Run:

```bash
node --test src/minigame/gameStateUtils.test.js
```

Expected: pass.

### Task 3: Update Phase Copy And Progress Goals

**Files:**
- Modify: `src/minigame/situations.js`
- Modify: `phaser-rpg/src/economy/config.mjs`
- Modify: `phaser-rpg/src/economy/config.test.mjs`

- [ ] **Step 1: Update phase 1 copy**

Use mission:

```js
"Kiếm đủ 5 đơn hàng và 2 review. Thiếu một trong hai sẽ bị loại."
```

Progress goals remain:

```js
[
  { type: "order", target: 5, label: "Don hang" },
  { type: "review", target: 2, label: "Review" },
]
```

- [ ] **Step 2: Update phase 2 copy**

Use mission:

```js
"Tìm Khách Ruột đang ẩn trên bản đồ trong 60 giây."
```

Progress goals:

```js
[
  { type: "loyal_customer_found", target: 1, label: "Khach ruot" },
]
```

- [ ] **Step 3: Update phase 3 copy**

Use mission:

```js
"Chạy tới Cổng Thoát để rời khỏi sự phụ thuộc nền tảng."
```

Progress goals:

```js
[
  { type: "escaped_gate", target: 1, label: "Cong thoat" },
]
```

- [ ] **Step 4: Update config tests**

Change config tests to expect the new phase 2 and phase 3 progress goals.

- [ ] **Step 5: Run config tests**

Run:

```bash
node --test phaser-rpg/src/economy/config.test.mjs
```

Expected: pass.

### Task 4: Host Phase Controls And Gate Application

**Files:**
- Modify: `src/minigame/HostView.jsx`

- [ ] **Step 1: Import phase 2 helper**

Change import:

```js
import { applyPhaseOneGate, applyPhaseTwoGate, applyPlayerDelta } from "./gameStateUtils";
```

- [ ] **Step 2: Phase 1 close applies order/review gate**

Keep current phase 1 close flow, but ensure `applyPhaseOneGate` now gates by both order and review.

- [ ] **Step 3: Add phase 2 timer ending behavior**

When phase 2 starts, `gameState.phaseEndsAt` should be set to `Date.now() + 60_000`.

When host clicks the phase 2 close button:

```js
playerList.forEach((p) => {
  const { id, ...playerData } = p;
  updates[`players/${id}`] = applyPhaseTwoGate(playerData);
});
```

If no players are qualified after this, set:

```js
updates["gameState/wipeoutReason"] = "Không ai tìm được khách ruột trong 60 giây";
```

- [ ] **Step 4: Add host buttons**

Add buttons during phase 2:

- `Spawn Khách Ruột`: writes `{ type: "spawn_loyal_customer_npc", phase: "phase_2", createdAt }` to `marketEvents`.
- `Thả Manh Mối`: writes `{ type: "loyal_customer_hint", phase: "phase_2", createdAt }` to `marketEvents`.

- [ ] **Step 5: Clear NPC/gate state**

On reset and phase 1 restart, remove:

```js
await remove(ref(db, "npcs"));
await remove(ref(db, "gates"));
```

### Task 5: Player React Message Handling

**Files:**
- Modify: `src/minigame/RpgGamePlay.jsx`
- Modify: `src/minigame/PlayerView.jsx`

- [ ] **Step 1: Handle loyal customer found**

In `RpgGamePlay.jsx`, add message handler for:

```js
if (e.data.type === "FOUND_LOYAL_CUSTOMER") {
  await incrementProgress("loyal_customer_found");
  await runTransaction(
    ref(db, `players/${playerId}/progress/${gameState.status}/loyal_customer_found_at`),
    (current) => current || Date.now(),
    { applyLocally: false }
  );
  addFloatingText("Đã giữ được khách ruột", "#00897b");
}
```

- [ ] **Step 2: Handle escape gate**

Add message handler:

```js
if (e.data.type === "ESCAPED_GATE") {
  await incrementProgress("escaped_gate");
  await runTransaction(
    ref(db, `players/${playerId}`),
    (player) => ({
      ...player,
      escaped: true,
      escapedAt: player?.escapedAt || Date.now(),
    }),
    { applyLocally: false }
  );
  addFloatingText("Đã thoát khỏi nền tảng", "#c9922a");
}
```

- [ ] **Step 3: Show escaped player state**

In `PlayerView.jsx`, if `playerInfo.escaped` and `gameState.status === "phase_3"`, show a success panel and do not render active `RpgGamePlay`.

### Task 6: Phaser HostWorld NPC And Gate

**Files:**
- Modify: `phaser-rpg/src/world/HostWorld.ts`

- [ ] **Step 1: Listen for NPC/gate market events**

Extend `handleMarketEvent`:

- `spawn_loyal_customer_npc`: create one NPC in Firebase under `npcs/loyal_customer`.
- `loyal_customer_hint`: write `gameState/phase2Hint`.
- On entering `phase_3`, create one gate under `gates/escape_gate`.

- [ ] **Step 2: NPC data shape**

Write:

```ts
{
  id: 'loyal_customer',
  type: 'loyal_customer',
  label: 'Khach Ruot',
  x,
  y,
  zone,
}
```

- [ ] **Step 3: Gate data shape**

Write:

```ts
{
  id: 'escape_gate',
  type: 'escape_gate',
  label: 'Cong Thoat',
  x,
  y,
  activeAt: Date.now() + 3000,
}
```

- [ ] **Step 4: Clear state on status change**

Remove `npcs` and `gates` whenever status changes away from their phase.

### Task 7: Phaser Scene Render And Collision

**Files:**
- Modify: `phaser-rpg/src/scenes/Main.tsx`

- [ ] **Step 1: Render NPC**

Listen to `npcs`, draw a small customer marker, and for player role add overlap:

```ts
window.parent.postMessage({ type: 'FOUND_LOYAL_CUSTOMER', npcId: id }, '*');
```

Ensure each player only posts once by using a local `collidedNpcs` set.

- [ ] **Step 2: Render gate**

Listen to `gates`, draw a portal/gate marker, and add overlap:

```ts
if (Date.now() >= gate.activeAt) {
  window.parent.postMessage({ type: 'ESCAPED_GATE', gateId: id }, '*');
}
```

Ensure each player only posts once by using a local `collidedGates` set.

- [ ] **Step 3: Gate inactive visual**

Before `activeAt`, label should show `Cong dang mo...`.
After `activeAt`, label should show `Chay ra!`.

### Task 8: Verification And Bundle Rebuild

**Files:**
- Generated: `public/rpg/**`

- [ ] **Step 1: Run unit tests**

Run:

```bash
node --test src/minigame/gameStateUtils.test.js phaser-rpg/src/economy/config.test.mjs phaser-rpg/src/economy/spawn.test.mjs
```

Expected: all pass.

- [ ] **Step 2: Typecheck Phaser**

Run inside `phaser-rpg`:

```bash
npm run lint:tsc
```

Expected: pass.

- [ ] **Step 3: Rebuild Phaser bundle**

Run inside `phaser-rpg`:

```bash
npm run build
```

Expected: `public/rpg/index.html` points to a new hashed JS bundle.

- [ ] **Step 4: Build React**

Run in repo root:

```bash
npm run build
```

Expected: pass with only existing Vite/Browserslist/chunk warnings.

- [ ] **Step 5: Smoke test**

Use localhost:

- Host phase 1 shows order/review objective.
- Phase 2 host can spawn `Khach Ruot`.
- Player can touch NPC and progress changes to `1/1`.
- Phase 3 renders gate and touching it marks player escaped.

### Task 9: Commit

**Files:**
- Commit nested `phaser-rpg` first.
- Then commit root repo with React changes, submodule pointer, plan/spec docs, and rebuilt `public/rpg`.

Commands:

```bash
cd phaser-rpg
git add src/economy/config.mjs src/economy/config.test.mjs src/world/HostWorld.ts src/scenes/Main.tsx
git commit -m "feat(minigame): add loyal customer npc and escape gate"

cd ..
git add phaser-rpg public/rpg src/minigame docs/superpowers/specs/2026-06-28-minigame-phase-gates-npc-escape-design.md docs/superpowers/plans/2026-06-28-minigame-phase-gates-npc-escape.md
git commit -m "feat(minigame): add phase gates npc objective and escape flow"
```
