// Sinh walkable mask cho src/minigame/rpgEngine.js từ tilemap Phaser thật.
// Chạy: node scripts/generate-rpg-map-mask.js
import { readFileSync } from "node:fs";

const map = JSON.parse(
  readFileSync("phaser-rpg/src/assets/tilemaps/tuxemon-town.json", "utf8")
);
const { width, height } = map;
const world = map.layers.find((l) => l.name === "World");
if (!world) throw new Error('Không tìm thấy layer "World" trong tilemap');

const lines = [];
for (let row = 0; row < height; row++) {
  let line = "";
  for (let col = 0; col < width; col++) {
    line += world.data[row * width + col] !== 0 ? "#" : ".";
  }
  lines.push(`  "${line}",`);
}

console.log(`// ${width}x${height} ô — dán vào WORLD_MASK của rpgEngine.js`);
console.log("export const WORLD_MASK = [");
console.log(lines.join("\n"));
console.log("];");
