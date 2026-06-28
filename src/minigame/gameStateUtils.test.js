import test from "node:test";
import assert from "node:assert/strict";

import {
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
