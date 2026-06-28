import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mainSource = readFileSync(
  resolve(process.cwd(), "phaser-rpg/src/scenes/Main.tsx"),
  "utf8"
);

for (const species of ["cat", "dog", "fox", "rabbit", "bird"]) {
  assert.match(
    mainSource,
    new RegExp(`${species}:\\s*\\[`),
    `missing ${species} pixel animal grid`
  );
}

assert.match(mainSource, /private getAnimalTrapSpecies\(/);
assert.match(mainSource, /visibility_squeeze:\s*'cat'/);
assert.match(mainSource, /voucher_pressure:\s*'dog'/);
assert.match(mainSource, /mall_copy:\s*'fox'/);
assert.match(mainSource, /monopoly_price:\s*'rabbit'/);
assert.match(mainSource, /platform_fee:\s*'bird'/);
assert.match(mainSource, /Math\.sin\(\(time \+ phase\) \/ 420\) \* 56/);
assert.match(mainSource, /Math\.cos\(\(time \+ phase\) \/ 360\) \* 40/);
