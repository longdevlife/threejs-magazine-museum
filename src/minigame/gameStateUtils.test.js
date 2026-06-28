import test from "node:test";
import assert from "node:assert/strict";

import {
  applyPhaseOneGate,
  applyPlayerDelta,
  isValidGameStatus,
  normalizeGameState,
} from "./gameStateUtils.js";

test("normalizeGameState resets legacy playing status to waiting", () => {
  assert.deepEqual(normalizeGameState({ status: "playing", currentQuestion: 0 }), {
    status: "waiting",
  });
});

test("isValidGameStatus accepts the current minigame flow only", () => {
  assert.equal(isValidGameStatus("phase_2"), true);
  assert.equal(isValidGameStatus("situation_1"), true);
  assert.equal(isValidGameStatus("playing"), false);
});

test("applyPlayerDelta applies score and capital atomically without going below zero", () => {
  const player = { name: "An", score: 30, capital: 400_000, isBankrupt: false };

  assert.deepEqual(applyPlayerDelta(player, { score: -75, capital: -500_000 }), {
    name: "An",
    score: 0,
    capital: 0,
    isBankrupt: true,
  });
});

test("applyPlayerDelta keeps bankruptcy sticky after later gains", () => {
  const player = { name: "Binh", score: 0, capital: 0, isBankrupt: true };

  assert.deepEqual(applyPlayerDelta(player, { score: 20, capital: 300_000 }), {
    name: "Binh",
    score: 20,
    capital: 300_000,
    isBankrupt: true,
  });
});

test("applyPhaseOneGate eliminates players below the phase 1 order floor", () => {
  const player = {
    name: "Chi",
    score: 80,
    capital: 12_000_000,
    progress: { phase_1: { order: 2 } },
    isBankrupt: false,
  };

  assert.deepEqual(applyPhaseOneGate(player), {
    name: "Chi",
    score: 80,
    capital: 0,
    progress: { phase_1: { order: 2 } },
    isBankrupt: true,
    eliminatedReason: "Không đạt tối thiểu 3 đơn hàng ở Phase 1",
    phaseOneQualified: false,
  });
});

test("applyPhaseOneGate keeps mid performers alive without a bonus", () => {
  const player = {
    name: "Dung",
    score: 100,
    capital: 14_000_000,
    progress: { phase_1: { order: 4 } },
    isBankrupt: false,
  };

  assert.deepEqual(applyPhaseOneGate(player), {
    name: "Dung",
    score: 100,
    capital: 14_000_000,
    progress: { phase_1: { order: 4 } },
    isBankrupt: false,
    phaseOneQualified: false,
  });
});

test("applyPhaseOneGate rewards players who reach 5 phase 1 orders", () => {
  const player = {
    name: "Hai",
    score: 125,
    capital: 16_000_000,
    progress: { phase_1: { order: 5 } },
    isBankrupt: false,
  };

  assert.deepEqual(applyPhaseOneGate(player), {
    name: "Hai",
    score: 175,
    capital: 17_000_000,
    progress: { phase_1: { order: 5 } },
    isBankrupt: false,
    phaseOneQualified: true,
    phaseOneBonusApplied: true,
  });
});
