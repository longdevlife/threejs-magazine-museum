import test from "node:test";
import assert from "node:assert/strict";

import {
  ECONOMY_HAZARDS,
  ECONOMY_OPPORTUNITIES,
  PHASE_ECONOMY_MIX,
  getHazardDefinition,
  getOpportunityDefinition,
} from "./economyGameContent.js";

test("opportunity catalog contains presentation concepts", () => {
  for (const type of ["order", "review", "loyal_customer", "ai_skill", "niche_market"]) {
    const item = getOpportunityDefinition(type);
    assert.equal(item.type, type);
    assert.equal(typeof item.label, "string");
    assert.ok(item.label.length > 3);
    assert.equal(typeof item.message, "string");
    assert.ok(Number.isFinite(item.score));
    assert.ok(Number.isFinite(item.capital));
  }
});

test("hazard catalog contains digital monopoly concepts", () => {
  for (const type of ["platform_fee", "visibility_squeeze", "voucher_pressure", "mall_copy", "monopoly_price"]) {
    const hazard = getHazardDefinition(type);
    assert.equal(hazard.type, type);
    assert.equal(typeof hazard.label, "string");
    assert.ok(hazard.label.length > 3);
    assert.equal(typeof hazard.message, "string");
    assert.ok(Number.isFinite(hazard.score));
    assert.ok(Number.isFinite(hazard.capital));
  }
});

test("every phase mix references valid opportunity and hazard types", () => {
  for (const [phase, mix] of Object.entries(PHASE_ECONOMY_MIX)) {
    assert.match(phase, /^phase_[123]$/);
    assert.ok(mix.maxOpportunities > 0);
    assert.ok(mix.hazardCount > 0);
    for (const entry of mix.opportunities) {
      assert.ok(ECONOMY_OPPORTUNITIES[entry.type], `${phase} missing opportunity ${entry.type}`);
      assert.ok(entry.weight > 0);
    }
    for (const entry of mix.hazards) {
      assert.ok(ECONOMY_HAZARDS[entry.type], `${phase} missing hazard ${entry.type}`);
      assert.ok(entry.weight > 0);
    }
  }
});
