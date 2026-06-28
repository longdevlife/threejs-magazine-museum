import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mainSource = readFileSync(
  resolve(process.cwd(), "phaser-rpg/src/scenes/Main.tsx"),
  "utf8"
);

assert.match(mainSource, /container\.setData\('trapType',\s*trap\.type/);
assert.match(mainSource, /container\.setData\('motionPhase'/);
assert.match(mainSource, /localTrap\.setData\('anchorX',\s*trap\.x/);
assert.match(mainSource, /localTrap\.setData\('anchorY',\s*trap\.y/);
assert.match(mainSource, /private isAnimalTrapType\(/);
assert.match(mainSource, /private updateAnimalTrapMotion\(time: number\)/);
assert.match(mainSource, /this\.updateAnimalTrapMotion\(time\)/);
assert.match(mainSource, /const animalContainers: Phaser\.GameObjects\.Container\[\] = \[\]/);
assert.match(mainSource, /const roamX = Math\.sin\(\(time \+ phase\) \/ 420\) \* 56/);
assert.match(mainSource, /const roamY = Math\.cos\(\(time \+ phase\) \/ 360\) \* 40/);
assert.match(mainSource, /container\.setPosition\(\s*anchorX \+ roamX,\s*anchorY \+ roamY,/s);
assert.match(mainSource, /active\.setPosition\(0,\s*footBounce\)/);
assert.match(mainSource, /active\.setScale\(\s*facing,/s);
assert.match(mainSource, /private spreadAnimalTrapContainers\(/);
assert.match(mainSource, /const minDistance = 44/);
assert.match(mainSource, /for \(let pass = 0; pass < 3; pass\+\+\)/);
assert.match(mainSource, /this\.spreadAnimalTrapContainers\(animalContainers\)/);

assert.match(mainSource, /window\.parent\.postMessage\(\s*\{\s*type: 'DINH_BAY'/s);
