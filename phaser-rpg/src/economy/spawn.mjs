// Vùng spawn — toạ độ pixel trên bản đồ Phaser thật (1280x1280).
export const SPAWN_ZONES = {
  central_market_path: { x: 96, y: 548, width: 1088, height: 80 },
  shop_row_left: { x: 96, y: 296, width: 640, height: 120 },
  platform_gate: { x: 976, y: 160, width: 200, height: 230 },
  mall_shadow: { x: 96, y: 840, width: 620, height: 150 },
  niche_corner: { x: 840, y: 840, width: 230, height: 130 },
  // Vùng hẹp chắc chắn đi được — dành cho NPC ẩn
  behind_shops_left: { x: 96, y: 440, width: 400, height: 60 },
};

// Điểm chắc chắn đi được (tâm đại lộ) — fallback khi mọi lần thử trúng tường.
export const FALLBACK_POINT = { x: 620, y: 592, zone: 'central_market_path' };

export const pickWeighted = (entries, random = Math.random) => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = random() * total;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry;
  }
  return entries[entries.length - 1];
};

const pickZone = (preferredZones, random) => {
  const validNames = preferredZones.filter((name) => SPAWN_ZONES[name]);
  const names = validNames.length ? validNames : Object.keys(SPAWN_ZONES);
  const index = Math.min(names.length - 1, Math.floor(random() * names.length));
  return { name: names[index], zone: SPAWN_ZONES[names[index]] };
};

// isWalkable(x, y, radius) → true nếu đi được. Người gọi (Phaser host) bọc tilemap thật.
export const pickSpawnPoint = ({
  preferredZones,
  radius = 20,
  random = Math.random,
  isWalkable,
  maxAttempts = 40,
} = {}) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const selected = pickZone(preferredZones || [], random);
    const x = Math.round(selected.zone.x + random() * selected.zone.width);
    const y = Math.round(selected.zone.y + random() * selected.zone.height);
    if (isWalkable(x, y, radius)) {
      return { x, y, zone: selected.name };
    }
  }
  return { ...FALLBACK_POINT };
};
