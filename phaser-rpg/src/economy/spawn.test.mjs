import assert from 'node:assert/strict';
import test from 'node:test';

import { pickSpawnPoint, pickWeighted, SPAWN_ZONES } from './spawn.mjs';

test('pickWeighted dùng random tiêm vào, xác định', () => {
  const entries = [
    { type: 'a', weight: 1 },
    { type: 'b', weight: 3 },
    { type: 'c', weight: 1 },
  ];
  assert.equal(pickWeighted(entries, () => 0).type, 'a');
  assert.equal(pickWeighted(entries, () => 0.25).type, 'b');
  assert.equal(pickWeighted(entries, () => 0.99).type, 'c');
});

test('spawn zones có tên và kích thước dương', () => {
  for (const [name, zone] of Object.entries(SPAWN_ZONES)) {
    assert.ok(name.length > 3);
    assert.ok(zone.width > 0 && zone.height > 0);
  }
});

test('pickSpawnPoint trả điểm trong vùng ưu tiên khi mọi điểm đi được', () => {
  const point = pickSpawnPoint({
    preferredZones: ['central_market_path'],
    radius: 24,
    random: () => 0.5,
    isWalkable: () => true,
  });
  assert.equal(point.zone, 'central_market_path');
});

test('pickSpawnPoint trả fallback khi không điểm nào đi được', () => {
  const point = pickSpawnPoint({
    preferredZones: ['central_market_path'],
    radius: 24,
    random: () => 0.5,
    isWalkable: () => false,
  });
  assert.equal(point.zone, 'central_market_path');
  assert.equal(point.x, 620);
  assert.equal(point.y, 592);
});
