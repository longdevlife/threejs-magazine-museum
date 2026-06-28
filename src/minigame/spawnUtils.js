import { checkMapCollisions } from "./rpgEngine.js";

export const SPAWN_ZONES = {
  central_market_path: { x: 610, y: 420, width: 380, height: 340 },
  shop_row_left: { x: 500, y: 460, width: 180, height: 260 },
  platform_gate: { x: 930, y: 360, width: 230, height: 260 },
  mall_shadow: { x: 910, y: 680, width: 280, height: 220 },
  niche_corner: { x: 1080, y: 850, width: 260, height: 150 },
};

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

export const pickSpawnPoint = ({
  preferredZones,
  radius = 24,
  random = Math.random,
  maxAttempts = 40,
} = {}) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const selected = pickZone(preferredZones || [], random);
    const x = Math.round(selected.zone.x + random() * selected.zone.width);
    const y = Math.round(selected.zone.y + random() * selected.zone.height);
    if (!checkMapCollisions(x, y, radius)) {
      return { x, y, zone: selected.name };
    }
  }
  return { x: 760, y: 610, zone: "central_market_path" };
};
