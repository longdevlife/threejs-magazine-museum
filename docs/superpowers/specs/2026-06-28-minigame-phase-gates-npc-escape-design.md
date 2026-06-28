# Minigame Phase Gates, Hidden Customer NPC, And Escape Gate Design

## Goal

Turn the RPG minigame into a clearer 3-act learning loop:

1. Phase 1 teaches that a shop must build early market traction and trust.
2. Phase 2 teaches that platform traffic is unstable, so the shop must find and keep loyal customers.
3. Phase 3 stops asking players to keep collecting items and becomes a short escape race through an exit gate, symbolizing leaving platform dependency.

The game should feel less like random books/traps and more like a sequence of understandable survival challenges.

## Current Problem

The current loop still leans too much on collecting spawned opportunities. Players can see items and traps, but the actions do not always feel connected to the lesson. Phase 3 especially risks becoming repetitive if it keeps asking players to collect more things after phase 1 and 2.

## Proposed Flow

### Phase 1: Open Market - Orders And Reviews

**Story:** The market is still open. Small shops can compete if they quickly build sales and reputation.

**Player objective:**

- Collect at least `5` orders.
- Collect at least `2` reviews.

**Host controls:**

- `Tung Flash Sale`: spawns an order burst.
- `Mo Review Wave`: spawns a review burst.

**Gate rule:**

- A player who has `order < 5` or `review < 2` when the host closes phase 1 is eliminated.
- A player who has `order >= 5` and `review >= 2` enters phase 2.
- A player who exceeds the target may receive a small bonus, but the main purpose is qualification.

**Learning meaning:** In competitive markets, early traction is not just money. Orders represent demand; reviews represent trust. Without both, the shop cannot survive when the platform later changes the rules.

### Phase 2: Algorithm Squeeze - Find The Loyal Customer

**Story:** The platform now controls visibility. Random traffic is weaker, fees and algorithmic pressure increase. The shop must find a loyal customer instead of depending only on platform traffic.

**Player objective:**

- Find and touch a hidden NPC called `Khach Ruot` within `60` seconds.

**NPC behavior:**

- The NPC is spawned by the Phaser host.
- The NPC appears in one of several valid walkable map zones.
- The NPC should not look like a collectible book. It should look like a small customer/person marker with a subtle idle animation.
- The NPC may be partly hidden behind map structure or placed off the obvious central path, but must remain reachable.

**Hint behavior:**

- Host can trigger `Tha Manh Moi`.
- A hint appears on player HUD and host screen, for example:
  - `Khach ruot dang o gan khu cho trung tam`
  - `Co nguoi tim shop ban gan cong nen tang`
  - `Khach quen dang o sau day shop nho`

**Timer rule:**

- Each player has the same phase 2 timer window.
- A player who does not find the loyal customer within `60` seconds is eliminated.
- A player who finds the loyal customer enters phase 3.
- If no player finds the NPC within `60` seconds, the host screen shows `Ca lop bi nen tang cat traffic`. The host can either finish the game immediately or restart phase 2.

**Learning meaning:** A shop that only depends on platform traffic is fragile. Loyal customers and direct relationships are survival assets when algorithms change.

### Phase 3: Escape Platform Dependency

**Story:** The platform monopoly becomes too hostile: mall copy, monopoly pricing, traffic squeeze. The winning move is not to collect more; it is to escape dependency.

**Player objective:**

- Run to an `Exit Gate` before capital reaches zero or time runs out.

**Important rule:** Phase 3 is not limited to exactly 3 players. Every player who survives phase 2 enters phase 3. The first three players through the gate are highlighted as top finishers, but later finishers can still be marked as survivors.

**Gate behavior:**

- The Phaser host spawns one clearly visible gate on a valid walkable edge or destination zone.
- The gate is inactive for the first `3` seconds of phase 3 to let players orient.
- After activation, touching the gate marks the player as `escaped`.
- Escaped players stop taking trap/platform damage.
- The host leaderboard sorts escaped players by `escapedAt`, then score/capital.

**Trap behavior:**

- Phase 3 traps remain telegraphed, not instantly punishing.
- Traps represent `Mall dang copy`, `Gia doc quyen`, and `Bop reach`.
- The goal is pressure and drama, not unavoidable failure.

**Result categories:**

- `Top Escape`: first three players through the gate.
- `Escaped`: passed the gate after top three.
- `Stuck On Platform`: survived phase 2 but did not reach the gate.
- `Eliminated`: failed phase 1, failed phase 2, or went bankrupt.

**Learning meaning:** In a monopoly platform environment, endlessly chasing platform rewards is not a sustainable strategy. The exit gate represents building channels, customers, and capabilities outside the platform.

## Data Model

### Player Fields

Add or reuse:

- `progress.phase_1.order`
- `progress.phase_1.review`
- `progress.phase_2.loyal_customer_found`
- `progress.phase_2.loyal_customer_found_at`
- `isBankrupt`
- `eliminatedReason`
- `escaped`
- `escapedAt`
- `phaseOneQualified`
- `phaseTwoQualified`

### Game State Fields

Add:

- `phaseStartedAt`
- `phaseEndsAt`
- `phase2NpcId`
- `phase2Hint`
- `phase3GateId`
- `phase3GateActiveAt`

### Firebase Collections

Add:

- `npcs/{npcId}` for phase 2 loyal customer NPC.
- `gates/{gateId}` for phase 3 exit gate.
- Continue using `marketEvents/{eventId}` for host-triggered bursts and hints.

## Host UX

### Phase 1 Host Panel

Show:

- Progress summary: how many players have `5/5 orders` and `2/2 reviews`.
- Buttons: `Tung Flash Sale`, `Mo Review Wave`.
- Close button: `Chot Phase 1`.

When closing:

- Apply hard gate.
- Show eliminated count and qualified count before moving to situation 1 or phase 2.

### Phase 2 Host Panel

Show:

- Countdown `60s`.
- Button: `An Khach Ruot` or `Spawn Khach Ruot`.
- Button: `Tha Manh Moi`.
- Live count: found vs not found.

When timer ends:

- Apply phase 2 gate.
- If at least one player found the NPC, continue.
- If zero players found the NPC, show wipeout message and offer restart/finish controls.

### Phase 3 Host Panel

Show:

- Gate status: `Opening in 3s`, then `Gate Open`.
- Escape count.
- Top 3 escape order.
- Button: `Ket thuc va vinh danh`.

## Player UX

### Phase 1 HUD

Show:

- Mission: `Kiem 5 don hang va 2 review`.
- Progress: `Don hang: x/5 | Review: y/2`.
- Warning copy: `Khong du ca hai muc tieu se bi loai khi MC chot phase`.

### Phase 2 HUD

Show:

- Mission: `Tim Khach Ruot trong 60 giay`.
- Countdown.
- Hint area, initially hidden or showing `Cho MC tha manh moi`.
- Found state: `Da giu duoc khach rieng`.

### Phase 3 HUD

Show:

- Mission: `Chay den Cong Thoat`.
- Gate status.
- Escape rank after touching gate.

## Acceptance Criteria

- Phase 1 eliminates any player missing either `5 orders` or `2 reviews`.
- Phase 2 has a hidden NPC and a 60-second timer.
- Phase 2 eliminates players who do not find the loyal customer in time.
- Phase 2 has a zero-finder case with host-visible wipeout messaging.
- Phase 3 spawns an exit gate instead of requiring more item collection.
- Phase 3 allows all phase 2 survivors to race; top 3 are highlighted without excluding others.
- Escaped players are protected from further trap/platform damage.
- Host and player UIs explain each phase objective clearly.

## Non-Goals

- Do not redesign the entire map in this iteration.
- Do not add pathfinding AI for the NPC.
- Do not add player combat.
- Do not require external assets beyond simple Phaser-drawn NPC/gate markers unless assets already exist.
