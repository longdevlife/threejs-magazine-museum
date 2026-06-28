import test from "node:test";
import assert from "node:assert/strict";

import { pickWeighted, pickSpawnPoint, SPAWN_ZONES } from "./spawnUtils.js";
import { checkMapCollisions } from "./rpgEngine.js";

test("pickWeighted uses injected random values deterministically", () => {
  const entries = [
    { type: "a", weight: 1 },
    { type: "b", weight: 3 },
    { type: "c", weight: 1 },
  ];

  assert.equal(pickWeighted(entries, () => 0).type, "a");
  assert.equal(pickWeighted(entries, () => 0.25).type, "b");
  assert.equal(pickWeighted(entries, () => 0.99).type, "c");
});

test("spawn zones are named and have positive dimensions", () => {
  for (const [name, zone] of Object.entries(SPAWN_ZONES)) {
    assert.ok(name.length > 3);
    assert.ok(zone.width > 0);
    assert.ok(zone.height > 0);
  }
});

test("pickSpawnPoint returns a walkable point from preferred zones", () => {
  // platform_gate center (0.5,0.5) → (1045, 490) — clear of all obstacles
  const point = pickSpawnPoint({
    preferredZones: ["platform_gate"],
    radius: 24,
    random: () => 0.5,
  });

  assert.equal(point.zone, "platform_gate");
  assert.equal(checkMapCollisions(point.x, point.y, 24), false);
});
