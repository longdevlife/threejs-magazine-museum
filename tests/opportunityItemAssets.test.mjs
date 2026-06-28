import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const bootSource = readFileSync(resolve(root, "phaser-rpg/src/scenes/Boot.ts"), "utf8");
const mainSource = readFileSync(resolve(root, "phaser-rpg/src/scenes/Main.tsx"), "utf8");
const keySource = readFileSync(resolve(root, "phaser-rpg/src/constants/key.ts"), "utf8");

[
  "review.png",
  "order.png",
  "loyal-customer.png",
  "ai-skill.png",
  "niche.png",
].forEach((fileName) => {
  assert.equal(
    existsSync(resolve(root, "phaser-rpg/public/opportunity-items", fileName)),
    true,
    `${fileName} should exist as a transparent opportunity item asset`
  );
});

assert.match(keySource, /opportunityReview:\s*'opportunity-review'/);
assert.match(keySource, /opportunityOrder:\s*'opportunity-order'/);
assert.match(keySource, /opportunityLoyalCustomer:\s*'opportunity-loyal-customer'/);
assert.match(keySource, /opportunityAiSkill:\s*'opportunity-ai-skill'/);
assert.match(keySource, /opportunityNiche:\s*'opportunity-niche'/);
assert.match(bootSource, /this\.load\.image\(\s*key\.image\.opportunityReview,\s*'\.\/opportunity-items\/review\.png'/);
assert.match(bootSource, /this\.load\.image\(\s*key\.image\.opportunityOrder,\s*'\.\/opportunity-items\/order\.png'/);
assert.match(bootSource, /this\.load\.image\(\s*key\.image\.opportunityLoyalCustomer,\s*'\.\/opportunity-items\/loyal-customer\.png'/);
assert.match(bootSource, /this\.load\.image\(\s*key\.image\.opportunityAiSkill,\s*'\.\/opportunity-items\/ai-skill\.png'/);
assert.match(bootSource, /this\.load\.image\(\s*key\.image\.opportunityNiche,\s*'\.\/opportunity-items\/niche\.png'/);
assert.match(mainSource, /private getOpportunityTextureKey\(/);
assert.match(mainSource, /const textureKey = this\.getOpportunityTextureKey\(book\.type\)/);
assert.match(mainSource, /this\.add\.image\(0,\s*0,\s*textureKey\)/);
assert.match(mainSource, /window\.parent\.postMessage\(\s*\{\s*type: 'NHAT_SACH'/s);
