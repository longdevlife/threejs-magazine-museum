import { checkMapCollisions } from "./rpgEngine.js";

// Vùng spawn — toạ độ pixel trên bản đồ Phaser thật (1280x1280).
// Mỗi vùng nằm trong khu đi được; pickSpawnPoint vẫn validate từng điểm nên
// vài ô tường lọt vào rect chỉ khiến thử lại, không sao.
export const SPAWN_ZONES = {
  central_market_path: { x: 96, y: 548, width: 1088, height: 80 },  // đại lộ trung tâm
  shop_row_left: { x: 96, y: 296, width: 640, height: 120 },        // dãy shop trái-trên
  platform_gate: { x: 976, y: 160, width: 200, height: 230 },       // cổng nền tảng phải-trên
  mall_shadow: { x: 96, y: 840, width: 620, height: 150 },          // bóng Mall dưới-trái
  niche_corner: { x: 840, y: 840, width: 230, height: 130 },        // góc ngách dưới-phải
};

// Điểm chắc chắn đi được (tâm đại lộ) — fallback khi mọi lần thử đều trúng tường.
const FALLBACK_POINT = { x: 620, y: 592, zone: "central_market_path" };

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
  radius = 20,
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
  return { ...FALLBACK_POINT };
};
