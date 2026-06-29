import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "src/ai-usage/AIUsagePage.jsx"),
  "utf8"
);

assert.doesNotMatch(source, /Minh Ch.{0,8}ng S.{0,8} D.{0,8}ng Prompt/i);
assert.doesNotMatch(source, /Prompt:/);
assert.doesNotMatch(source, /cosolythuyet\.jpg|lienhethuctien\.jpg|giatrivandung\.jpg/);

[
  "cosolythuyet.jpg",
  "lienhethuctien.jpg",
  "giatrivandung.jpg",
  "prompt1.jpg",
  "prompt2.png",
  "prompt3.png",
].forEach((fileName) => {
  assert.equal(
    existsSync(resolve(process.cwd(), "public/images", fileName)),
    false,
    `${fileName} should be removed`
  );
});
