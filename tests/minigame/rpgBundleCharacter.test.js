import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const assetFiles = readdirSync("public/rpg/assets");
const bundleFile = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js"));
assert.ok(bundleFile, "RPG bundle JS file not found in public/rpg/assets");

const bundle = readFileSync(`public/rpg/assets/${bundleFile}`, "utf8");

// Character atlas: URL param read and per-character PNG strings
assert.match(bundle, /get\(.character.\)/);
assert.match(bundle, /atlas-shipper\.png/);
assert.match(bundle, /atlas-student\.png/);
assert.match(bundle, /atlas-entrepreneur\.png/);
assert.match(bundle, /atlas-seller\.png/);

// Character color tint applied to other player sprites
assert.match(bundle, /\.setTint\(\w+\(\w+\.color\)\)/);

// Atlas PNG files must exist on disk
for (const character of ["shipper", "student", "entrepreneur", "seller"]) {
  assert.ok(
    existsSync(`public/rpg/assets/atlas-${character}.png`),
    `missing RPG atlas for ${character}`
  );
}

// Economy-typed objects (2026-06-28 upgrade)
assert.match(bundle, /NHAT_SACH/);
assert.match(bundle, /DINH_BAY/);
assert.match(bundle, /opportunity/);

console.log("rpg bundle character tests passed");
