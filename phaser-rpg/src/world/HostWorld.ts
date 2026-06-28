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
  'Khách ruột đang ở gần khu chợ trung tâm',
  'Có người tìm shop bạn gần cổng nền tảng',
  'Khách quen đang ở sau dãy shop nhỏ',
  'Có ai đó đang đợi bạn ở góc phải bản đồ',
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

  // Đi được nếu tâm + 4 điểm biên (±radius) đều không trúng ô có collides.
  private isWalkable = (x: number, y: number, radius = 16): boolean => {
    const pts: [number, number][] = [
      [x, y],
      [x - radius, y],
      [x + radius, y],
      [x, y - radius],
      [x, y + radius],
    ];
    return pts.every(([px, py]) => {
      const tile = this.worldLayer.getTileAtWorldXY(px, py);
      return !tile || !tile.collides;
    });
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

    void set(ref(db, `books/${id}`), {
      x: point.x,
      y: point.y,
      type: opportunity.type,
      label: opts.label || opportunity.shortLabel,
      message: opportunity.message,
      score: scaleDelta(opportunity.score, mix.opportunityScale),
      capital: scaleDelta(opportunity.capital, mix.opportunityScale),
      color: opportunity.color,
      zone: point.zone,
      expiresAt: opts.expiresAt,
    });
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
      this.spawnLoyalCustomerNpc();
      return;
    }

    // Phase 2: Hint for loyal customer
    if (event.type === 'loyal_customer_hint') {
      const hint = HINT_MESSAGES[Math.floor(Math.random() * HINT_MESSAGES.length)];
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

  private spawnLoyalCustomerNpc() {
    const point = spawnAt({
      preferredZones: ['central_market_path', 'shop_row_left'],
      radius: 16,
      isWalkable: this.isWalkable,
    });

    void set(ref(db, 'npcs/loyal_customer'), {
      id: 'loyal_customer',
      type: 'loyal_customer',
      label: 'Khách Ruột',
      x: point.x,
      y: point.y,
      zone: point.zone,
    });
  }

  private spawnEscapeGate() {
    const point = spawnAt({
      preferredZones: ['niche_corner', 'platform_gate'],
      radius: 24,
      isWalkable: this.isWalkable,
    });

    void set(ref(db, 'gates/escape_gate'), {
      id: 'escape_gate',
      type: 'escape_gate',
      label: 'Cổng Thoát',
      x: point.x,
      y: point.y,
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
