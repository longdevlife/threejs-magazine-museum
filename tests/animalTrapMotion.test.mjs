import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mainSource = readFileSync(
  resolve(process.cwd(), "phaser-rpg/src/scenes/Main.tsx"),
  "utf8"
);

assert.match(mainSource, /container\.setData\('trapType',\s*trap\.type/);
assert.match(mainSource, /localTrap\.setPosition\(trap\.x,\s*trap\.y\)/);
assert.doesNotMatch(mainSource, /container\.setData\('motionPhase'/);
assert.doesNotMatch(mainSource, /anchorX/);
assert.doesNotMatch(mainSource, /anchorY/);
assert.doesNotMatch(mainSource, /private updateAnimalTrapMotion/);
assert.doesNotMatch(mainSource, /this\.updateAnimalTrapMotion/);
assert.doesNotMatch(mainSource, /private spreadAnimalTrapContainers/);
assert.doesNotMatch(mainSource, /roamX|roamY|footBounce/);

assert.match(mainSource, /window\.parent\.postMessage\(\s*\{\s*type: 'DINH_BAY'/s);
