import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ECONOMY_HAZARDS,
  ECONOMY_OPPORTUNITIES,
  getHazardDefinition,
  getOpportunityDefinition,
  MARKET_EVENTS,
  PHASE_ECONOMY_MIX,
  scaleDelta,
} from './config.mjs';

test('opportunity catalog contains presentation concepts', () => {
  for (const type of [
    'order',
    'review',
    'loyal_customer',
    'ai_skill',
    'niche_market',
  ]) {
    const item = getOpportunityDefinition(type);
    assert.equal(item.type, type);
    assert.ok(item.label.length > 3);
    assert.ok(Number.isFinite(item.score));
    assert.ok(Number.isFinite(item.capital));
  }
});

test('hazard catalog contains digital monopoly concepts', () => {
  for (const type of [
    'platform_fee',
    'visibility_squeeze',
    'voucher_pressure',
    'mall_copy',
    'monopoly_price',
  ]) {
    const hazard = getHazardDefinition(type);
    assert.equal(hazard.type, type);
    assert.ok(Number.isFinite(hazard.score));
    assert.ok(Number.isFinite(hazard.capital));
  }
});

test('every phase mix references valid types', () => {
  for (const [phase, mix] of Object.entries(PHASE_ECONOMY_MIX)) {
    assert.match(phase, /^phase_[123]$/);
    assert.ok(mix.maxOpportunities > 0);
    assert.ok(mix.hazardCount > 0);
    for (const entry of mix.opportunities) {
      assert.ok(ECONOMY_OPPORTUNITIES[entry.type]);
      assert.ok(entry.weight > 0);
    }
    for (const entry of mix.hazards) {
      assert.ok(ECONOMY_HAZARDS[entry.type]);
      assert.ok(entry.weight > 0);
    }
  }
});

test('scaleDelta rounds scaled value', () => {
  assert.equal(scaleDelta(100, 1.25), 125);
  assert.equal(scaleDelta(-1_000_000, 1.1), -1_100_000);
});

test('every phase has mission and recap learning copy', () => {
  for (const [phase, mix] of Object.entries(PHASE_ECONOMY_MIX)) {
    assert.match(phase, /^phase_[123]$/);
    assert.equal(typeof mix.mission, 'string');
    assert.ok(mix.mission.length > 20);
    assert.equal(typeof mix.learningMeaning, 'string');
    assert.ok(mix.learningMeaning.length > 20);
    assert.equal(typeof mix.recap, 'string');
    assert.ok(mix.recap.length > 20);
  }
});

test('phase progress goals are explicit and readable', () => {
  assert.deepEqual(PHASE_ECONOMY_MIX.phase_1.progressGoals, [
    { type: 'order', target: 5, label: 'Don hang' },
    { type: 'review', target: 2, label: 'Review' },
  ]);
  assert.deepEqual(PHASE_ECONOMY_MIX.phase_2.progressGoals, [
    { type: 'survive_seconds', target: 60, label: 'Song sot' },
    { type: 'loyal_customer', target: 3, label: 'Khach quen' },
  ]);
  assert.deepEqual(PHASE_ECONOMY_MIX.phase_3.progressGoals, [
    { type: 'niche_market', target: 2, label: 'Ngach' },
    { type: 'loyal_customer', target: 3, label: 'Khach rieng' },
  ]);
});

test('host market events map to readable opportunity bursts', () => {
  assert.deepEqual(Object.keys(MARKET_EVENTS), [
    'flash_sale',
    'review_wave',
    'loyal_customer_drop',
  ]);

  assert.equal(MARKET_EVENTS.flash_sale.opportunityType, 'order');
  assert.equal(MARKET_EVENTS.flash_sale.count, 8);
  assert.equal(MARKET_EVENTS.flash_sale.ttlMs, 12_000);

  assert.equal(MARKET_EVENTS.review_wave.opportunityType, 'review');
  assert.equal(MARKET_EVENTS.review_wave.count, 6);
  assert.equal(MARKET_EVENTS.review_wave.ttlMs, 12_000);

  assert.equal(
    MARKET_EVENTS.loyal_customer_drop.opportunityType,
    'loyal_customer',
  );
  assert.equal(MARKET_EVENTS.loyal_customer_drop.count, 5);
  assert.equal(MARKET_EVENTS.loyal_customer_drop.ttlMs, 12_000);

  for (const event of Object.values(MARKET_EVENTS)) {
    assert.ok(ECONOMY_OPPORTUNITIES[event.opportunityType]);
    assert.ok(event.hostLabel.length >= 8);
    assert.ok(event.mapLabel.length >= 4);
  }
});

test('hazard tuning keeps moving traps readable and avoids oversized hitboxes', () => {
  assert.ok(PHASE_ECONOMY_MIX.phase_2.hazardSpeed < 3);
  assert.ok(PHASE_ECONOMY_MIX.phase_3.hazardSpeed < 3);
  assert.ok(ECONOMY_HAZARDS.mall_copy.size <= 44);
  assert.ok(ECONOMY_HAZARDS.platform_fee.capital >= -800_000);
});
