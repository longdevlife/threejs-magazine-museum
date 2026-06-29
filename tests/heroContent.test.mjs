import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const heroSource = readFileSync(
  resolve(process.cwd(), "src/game/sections/Hero.jsx"),
  "utf8"
);

assert.match(heroSource, /GROUP 5/);
assert.doesNotMatch(heroSource, /GROUP 2/);
assert.match(heroSource, /src="\/hero-banner-group-5\.png"/);
