import assert from "node:assert/strict";
import { CHARACTER_OPTIONS, getCharacterOption } from "../../src/minigame/characterOptions.js";

assert.equal(CHARACTER_OPTIONS.length, 5);
assert.deepEqual(
  CHARACTER_OPTIONS.map((character) => character.id),
  ["default", "shipper", "student", "entrepreneur", "seller"]
);

assert.equal(getCharacterOption("shipper").label, "Shipper");
assert.equal(getCharacterOption("unknown").id, "default");
assert.ok(CHARACTER_OPTIONS.every((character) => character.spriteClass.startsWith("sprite-")));

console.log("characterOptions tests passed");
