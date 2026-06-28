import {
  onValue,
  ref,
  remove,
  set,
  update as fbUpdate,
} from 'firebase/database';
import Phaser from 'phaser';

import {
  getHazardDefinition,
  getOpportunityDefinition,
  MARKET_EVENTS,
  PHASE_ECONOMY_MIX,
  scaleDelta,
} from '../economy/config.mjs';
import { pickSpawnPoint, pickWeighted } from '../economy/spawn.mjs';
import { db } from '../utils/firebase';

const PHASES = ['phase_1', 'phase_2', 'phase_3'];
const TRAP_PATTERNS = ['chase', 'diagonal', 'patrol'];
const SPEED_SCALE = 60; // config speed (px/khung cũ) → px/giây cho Arcade
const CHASE_SPEED_CAP = 144; // < player 175 px/s ⇒ người chơi luôn thoát chase
const SYNC_MS = 80; // nhịp ghi vị trí bẫy lên Firebase
const BOOK_MS = 400; // nhịp kiểm tra/bù sách
const TRAP_TELEGRAPH_MS = 1200;
const TRAP_HITBOX_SCALE = 0.65;
const TRAP_IMMUNITY_MS = 5500;
const GATE_ACTIVATION_DELAY = 3000;

const HINT_MESSAGES = [
  'Khách quen đang ở sau dãy shop nhỏ phía bên trái',
  'Có ai đó đang đợi bạn ở góc dưới bên phải bản đồ',
  'Có bóng dáng ai đó ở góc khuất trung tâm thương mại',
];

// ponytail: narrow casts so tsc can index PHASE_ECONOMY_MIX by string key without `any`.
type PhaseMix = (typeof PHASE_ECONOMY_MIX)[keyof typeof PHASE_ECONOMY_MIX];
const phaseMixMap = PHASE_ECONOMY_MIX as Record<string, PhaseMix | undefined>;

// ponytail: pickSpawnPoint is plain JS — inferred param type lacks preferredZones/isWalkable.
type SpawnOpts = {
  preferredZones?: string[];
  radius?: number;
  isWalkable?: (x: number, y: number, r?: number) => boolean;
  random?: () => number;
  maxAttempts?: number;
};
type SpawnResult = { x: number; y: number; zone?: string };
const spawnAt = pickSpawnPoint as (opts: SpawnOpts) => SpawnResult;

interface SimTrap {
  go: Phaser.GameObjects.Rectangle;
  data: Record<string, unknown> & { id: string };
  pattern: string;
}

interface PlayerInfo {
  x?: number;
  y?: number;
  isBankrupt?: boolean;
}

interface MarketEvent {
  type?: string;
  phase?: string;
  createdAt?: number;
}

interface BookInfo {
  expiresAt?: number;
}

export class HostWorld {
  private scene: Phaser.Scene;
  private worldLayer: Phaser.Tilemaps.TilemapLayer;
  private status = 'waiting';
  private traps: SimTrap[] = [];
  private players: Record<string, PlayerInfo> = {};
  private books: Record<string, BookInfo> = {};
  private handledMarketEvents = new Set<string>();
  private lastSync = 0;
  private lastBook = 0;

  constructor(scene: Phaser.Scene, worldLayer: Phaser.Tilemaps.TilemapLayer) {
    this.scene = scene;
    this.worldLayer = worldLayer;

    onValue(ref(db, 'players'), (snap) => {
      this.players = snap.val() || {};
    });
    onValue(ref(db, 'books'), (snap) => {
      this.books = snap.val() || {};
    });
    onValue(ref(db, 'marketEvents'), (snap) => {
      const events = (snap.val() || {}) as Record<string, MarketEvent>;
      Object.entries(events).forEach(([id, event]) => {
        if (this.handledMarketEvents.has(id)) return;
        this.handledMarketEvents.add(id);
        this.handleMarketEvent(id, event);
      });
    });
    onValue(ref(db, 'gameState/status'), (snap) => {
      const next = snap.val() || 'waiting';
      if (next === this.status) return;
      this.status = next;
      void this.onStatusChange(next);
    });
  }

  // Kiểm tra xem tọa độ mục tiêu có thể đi tới được từ Spawn Point của người chơi hay không (thuật toán BFS trên lưới tile)
  public isReachable(targetX: number, targetY: number): boolean {
    const scene = this.scene as Phaser.Scene & {
      tilemap?: Phaser.Tilemaps.Tilemap;
      player?: { x: number; y: number };
    };
    const tilemap = scene.tilemap;
    const player = scene.player;
    if (!tilemap) return true; // Fallback nếu không có tilemap

    // Điểm xuất phát của player (Host player luôn đứng yên ở Spawn Point)
    const startTx = player ? Math.floor(player.x / 32) : 4; // fallback x = 128px
    const startTy = player ? Math.floor(player.y / 32) : 18; // fallback y = 592px
    const targetTx = Math.floor(targetX / 32);
    const targetTy = Math.floor(targetY / 32);

    if (startTx === targetTx && startTy === targetTy) return true;

    const mapWidth = tilemap.width;
    const mapHeight = tilemap.height;

    const queue: [number, number][] = [[startTx, startTy]];
    const visited = new Set<string>();
    visited.add(`${startTx},${startTy}`);

    const dirs = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      if (cx === targetTx && cy === targetTy) return true;

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx},${ny}`;
        if (!visited.has(key)) {
          if (nx >= 0 && nx < mapWidth && ny >= 0 && ny < mapHeight) {
            const tile = this.worldLayer.getTileAt(nx, ny);
            const walkable = !tile || !tile.collides;
            if (walkable) {
              if (nx === targetTx && ny === targetTy) return true;
              visited.add(key);
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
    return false;
  }

  // Đi được nếu tâm + 4 điểm biên (±radius) không trúng ô collides VÀ có đường đi tới (Reachable) từ Spawn Point
  private isWalkable = (x: number, y: number, radius = 16): boolean => {
    const pts: [number, number][] = [
      [x, y],
      [x - radius, y],
      [x + radius, y],
      [x, y - radius],
      [x, y + radius],
    ];

    // 1. Kiểm tra va chạm vật lý
    const physicsWalkable = pts.every(([px, py]) => {
      const tile = this.worldLayer.getTileAtWorldXY(px, py);
      return !tile || !tile.collides;
    });

    if (!physicsWalkable) return false;

    // 2. Kiểm tra tính liên thông (Reachability) để tránh spawn trong rừng hoặc trong nhà kín
    return this.isReachable(x, y);
  };

  private async onStatusChange(status: string) {
    this.clearTraps();
    await remove(ref(db, 'traps'));
    await remove(ref(db, 'books'));
    await remove(ref(db, 'npcs'));
    await remove(ref(db, 'gates'));
    this.handledMarketEvents.clear();
    if (PHASES.includes(status)) {
      this.spawnTraps(status);
    }
    // Phase 3: Auto-spawn escape gate
    if (status === 'phase_3') {
      this.spawnEscapeGate();
    }
  }

  private clearTraps() {
    this.traps.forEach((t) => t.go.destroy());
    this.traps = [];
  }

  private spawnTraps(phaseKey: string) {
    const mix = phaseMixMap[phaseKey] ?? PHASE_ECONOMY_MIX.phase_1;
    const fbTraps: Record<string, unknown> = {};

    for (let i = 0; i < mix.hazardCount; i++) {
      const selected = pickWeighted(mix.hazards);
      const hazard = getHazardDefinition(selected.type);
      const pattern = TRAP_PATTERNS[i % TRAP_PATTERNS.length];
      const speed = mix.hazardSpeed * SPEED_SCALE;
      const size = hazard.size || 35;
      const point = spawnAt({
        preferredZones: mix.preferredZones,
        radius: size / 2,
        isWalkable: this.isWalkable,
      });

      // Body physics vô hình; phần nhìn do path render traps onValue trong Main vẽ từ Firebase.
      const go = this.scene.add.rectangle(point.x, point.y, size, size);
      go.setVisible(false);
      this.scene.physics.add.existing(go);
      const body = go.body as Phaser.Physics.Arcade.Body;
      body.setCircle(size / 2);
      body.setCollideWorldBounds(true);
      this.scene.physics.add.collider(go, this.worldLayer);

      if (pattern === 'diagonal') {
        const angle = (i / mix.hazardCount) * Math.PI * 2;
        body.setBounce(1, 1);
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      } else if (pattern === 'patrol') {
        const dir = i % 4 < 2 ? 1 : -1;
        body.setBounce(1, 1);
        if (i % 2 === 0) body.setVelocity(speed * dir, 0);
        else body.setVelocity(0, speed * dir);
      }
      // chase: bounce 0 mặc định, điều khiển bằng moveTo mỗi khung (Step update)

      const id = `trap_${i + 1}`;
      const warningLabel =
        hazard.type === 'visibility_squeeze'
          ? 'Sàn đổi thuật toán'
          : hazard.type === 'voucher_pressure'
            ? 'Voucher storm'
            : hazard.type === 'mall_copy'
              ? 'Mall đang copy'
              : hazard.type === 'monopoly_price'
                ? 'Giá độc quyền'
                : 'Phí sàn tăng';
      const data = {
        id,
        type: hazard.type,
        label: hazard.shortLabel,
        message: hazard.message,
        score: scaleDelta(hazard.score, mix.hazardScale),
        capital: scaleDelta(hazard.capital, mix.hazardScale),
        effect: hazard.effect,
        durationMs: hazard.durationMs,
        color: hazard.color,
        size,
        activeAt: Date.now() + TRAP_TELEGRAPH_MS,
        warningLabel,
        hitboxScale: TRAP_HITBOX_SCALE,
        immunityMs: TRAP_IMMUNITY_MS,
        x: point.x,
        y: point.y,
      };
      this.traps.push({ go, data, pattern });
      fbTraps[id] = data;
    }

    void fbUpdate(ref(db, 'traps'), fbTraps);
  }

  private nearestPlayer(
    tx: number,
    ty: number,
  ): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    Object.values(this.players).forEach((p) => {
      if (!p || p.isBankrupt) return;
      if (typeof p.x !== 'number' || typeof p.y !== 'number') return;
      const d = (p.x - tx) ** 2 + (p.y - ty) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = { x: p.x, y: p.y };
      }
    });
    return best;
  }

  private pickOpportunityPoint(mix: PhaseMix, anchor?: SpawnResult, index = 0) {
    if (!anchor) {
      return spawnAt({
        preferredZones: mix.preferredZones,
        radius: 24,
        isWalkable: this.isWalkable,
      });
    }

    const angle = index * 1.7;
    const distance = 36 + (index % 3) * 22;
    const x = Math.round(anchor.x + Math.cos(angle) * distance);
    const y = Math.round(anchor.y + Math.sin(angle) * distance);

    if (this.isWalkable(x, y, 24)) {
      return { x, y, zone: anchor.zone };
    }

    return spawnAt({
      preferredZones: mix.preferredZones,
      radius: 24,
      isWalkable: this.isWalkable,
    });
  }

  private spawnOpportunity(
    id: string,
    mix: PhaseMix,
    type?: string,
    opts: {
      anchor?: SpawnResult;
      index?: number;
      expiresAt?: number;
      label?: string;
    } = {},
  ) {
    const opportunity = getOpportunityDefinition(
      type || pickWeighted(mix.opportunities).type,
    );
    const point = this.pickOpportunityPoint(mix, opts.anchor, opts.index || 0);

    const data: Record<string, string | number> = {
      x: point.x,
      y: point.y,
      type: opportunity.type,
      label: opts.label || opportunity.shortLabel,
      message: opportunity.message,
      score: scaleDelta(opportunity.score, mix.opportunityScale),
      capital: scaleDelta(opportunity.capital, mix.opportunityScale),
      color: opportunity.color,
      zone: point.zone || '',
    };
    if (opts.expiresAt !== undefined) {
      data.expiresAt = opts.expiresAt;
    }

    void set(ref(db, `books/${id}`), data);
  }

  private maintainBooks(time: number) {
    const mix = phaseMixMap[this.status];
    if (!mix) return;
    if (Object.keys(this.books).length >= mix.maxOpportunities) return;

    this.spawnOpportunity(`opportunity_${Math.round(time)}`, mix);
  }

  private handleMarketEvent(id: string, event: MarketEvent) {
    if (!event || event.phase !== this.status) return;

    // Phase 2: Spawn loyal customer NPC
    if (event.type === 'spawn_loyal_customer_npc') {
      void this.spawnLoyalCustomerNpc();
      return;
    }

    // Phase 2: Hint for loyal customer
    if (event.type === 'loyal_customer_hint') {
      const hint =
        HINT_MESSAGES[Math.floor(Math.random() * HINT_MESSAGES.length)];
      void set(ref(db, 'gameState/phase2Hint'), hint);
      return;
    }

    const mix = phaseMixMap[this.status];
    const marketEvent = MARKET_EVENTS[event.type as keyof typeof MARKET_EVENTS];
    if (!mix || !marketEvent) return;

    const anchor = spawnAt({
      preferredZones: mix.preferredZones,
      radius: 24,
      isWalkable: this.isWalkable,
    });
    const expiresAt = Date.now() + marketEvent.ttlMs;

    for (let i = 0; i < marketEvent.count; i++) {
      this.spawnOpportunity(
        `${id}_${i + 1}`,
        mix,
        marketEvent.opportunityType,
        {
          anchor,
          index: i,
          expiresAt,
          label: marketEvent.mapLabel,
        },
      );
    }
  }

  // Tọa độ ẩn phía sau các tòa nhà — xác định thủ công trên tilemap và 100% đi tới được
  private static readonly NPC_HIDING_SPOTS: Array<{
    x: number;
    y: number;
    desc: string;
  }> = [
    { x: 112, y: 440, desc: 'Hẻm sau dãy shop trái (trên)' },
    { x: 320, y: 448, desc: 'Khoảng hẹp giữa hai shop trái' },
    { x: 560, y: 440, desc: 'Sau shop giữa' },
    { x: 156, y: 760, desc: 'Góc sau toà nhà dưới trái' },
    { x: 450, y: 770, desc: 'Sau cửa hàng thuốc' },
    { x: 700, y: 440, desc: 'Hẻm sau shop phải' },
  ];

  private async spawnLoyalCustomerNpc() {
    // 1. Xóa các NPC cũ trước để đảm bảo chỉ có tối đa 1 Khách Ruột trên map tại một thời điểm
    await remove(ref(db, 'npcs'));

    // 2. Shuffle hiding spots và chọn spot đầu tiên isWalkable (đã bao gồm reachability check)
    const shuffled = [...HostWorld.NPC_HIDING_SPOTS].sort(
      () => Math.random() - 0.5,
    );
    let chosen: { x: number; y: number; zone: string } | null = null;

    for (const spot of shuffled) {
      if (this.isWalkable(spot.x, spot.y, 14)) {
        chosen = { x: spot.x, y: spot.y, zone: spot.desc };
        break;
      }
    }

    // Fallback: nếu không spot nào walkable → dùng pickSpawnPoint cũ (loại bỏ tree_clearing)
    let finalChosen: { x: number; y: number; zone: string };
    if (chosen) {
      finalChosen = chosen;
    } else {
      const point = spawnAt({
        preferredZones: ['behind_shops_left', 'mall_shadow', 'niche_corner'],
        radius: 14,
        isWalkable: this.isWalkable,
        maxAttempts: 80,
      });
      finalChosen = {
        x: point.x,
        y: point.y,
        zone: point.zone || 'fallback',
      };
    }

    // Tạo ID động để các máy client xem đây là một NPC mới và có thể thu thập tiếp
    const npcId = `loyal_customer_${Date.now()}`;

    await set(ref(db, `npcs/${npcId}`), {
      id: npcId,
      type: 'loyal_customer',
      x: finalChosen.x,
      y: finalChosen.y,
      zone: finalChosen.zone,
    });
  }

  private spawnEscapeGate() {
    // Ưu tiên góc dưới bên trái của tòa nhà văn phòng lớn (x: 544, y: 416) đại diện cho việc thoát khỏi độc quyền
    const officeSpot = { x: 544, y: 416, zone: 'Góc tòa nhà văn phòng' };
    let finalChosen: { x: number; y: number; zone: string } = officeSpot;

    if (!this.isWalkable(officeSpot.x, officeSpot.y, 24)) {
      // Fallback nếu có vật cản
      const point = spawnAt({
        preferredZones: ['central_market_path', 'mall_shadow'],
        radius: 24,
        isWalkable: this.isWalkable,
        maxAttempts: 80,
      });
      finalChosen = {
        x: point.x,
        y: point.y,
        zone: point.zone || 'fallback',
      };
    }

    void set(ref(db, 'gates/escape_gate'), {
      id: 'escape_gate',
      type: 'escape_gate',
      label: 'Cổng Thoát',
      x: finalChosen.x,
      y: finalChosen.y,
      zone: finalChosen.zone,
      activeAt: Date.now() + GATE_ACTIVATION_DELAY,
    });
  }

  private expireBooks() {
    const now = Date.now();
    Object.entries(this.books).forEach(([id, book]) => {
      if (book.expiresAt && book.expiresAt < now) {
        void remove(ref(db, `books/${id}`));
      }
    });
  }

  update(time: number) {
    if (!PHASES.includes(this.status) || this.traps.length === 0) return;

    // Chase: homing mỗi khung, cap tốc độ để người chơi thoát được.
    this.traps.forEach((t) => {
      if (t.pattern !== 'chase') return;
      const body = t.go.body as Phaser.Physics.Arcade.Body;
      const target = this.nearestPlayer(t.go.x, t.go.y);
      if (target) {
        this.scene.physics.moveTo(t.go, target.x, target.y, CHASE_SPEED_CAP);
      } else {
        body.setVelocity(0, 0);
      }
    });

    if (time - this.lastSync > SYNC_MS) {
      this.lastSync = time;
      const fb: Record<string, unknown> = {};
      this.traps.forEach((t) => {
        fb[t.data.id] = {
          ...t.data,
          x: Math.round(t.go.x),
          y: Math.round(t.go.y),
        };
      });
      void fbUpdate(ref(db, 'traps'), fb);
    }

    if (time - this.lastBook > BOOK_MS) {
      this.lastBook = time;
      this.expireBooks();
      this.maintainBooks(time);
    }
  }
}
