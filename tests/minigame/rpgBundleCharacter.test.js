import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const bundle = readFileSync("public/rpg/assets/index-qSsGcAgU.js", "utf8");

assert.match(bundle, /mu\.get\(`color`\)/);
assert.match(bundle, /setTint\(characterTint\(n\.color\)\)/);
assert.match(bundle, /mu\.get\(`character`\)/);
assert.match(bundle, /characterAtlasAssets/);
assert.match(bundle, /selectedCharacterId=mu\.get\(`character`\)\|\|`default`/);
assert.match(bundle, /this\.load\.atlas\(_\.atlas\.player,characterAtlasAssets\[selectedCharacterId\]\|\|f,d\)/);
for (const character of ["shipper", "student", "entrepreneur", "seller"]) {
  assert.ok(
    existsSync(`public/rpg/assets/atlas-${character}.png`),
    `missing RPG atlas for ${character}`
  );
  assert.match(bundle, new RegExp(`${character}:`));
  assert.match(bundle, new RegExp(`atlas-${character}\\.png`));
}
assert.doesNotMatch(bundle, /this\.player\.setTint\(characterTint\(wu\)\)/);

console.log("rpg bundle character tests passed");
