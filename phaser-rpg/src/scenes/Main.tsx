import { onValue, ref, update } from 'firebase/database';
import Phaser from 'phaser';

import {
  Depth,
  key,
  TilemapLayer,
  TilemapObject,
  TILESET_NAME,
} from '../constants';
import { Player } from '../sprites';
import { db } from '../utils/firebase';
import { HostWorld } from '../world/HostWorld';

// Parse query params từ URL để nhận thông tin người chơi
const urlParams = new URLSearchParams(window.location.search);
const playerId = urlParams.get('id') || 'player_' + Date.now();
const playerName = urlParams.get('name') || 'Ẩn danh';
const playerRole = urlParams.get('role') || 'player';
const playerColor = urlParams.get('color') || '#ffe082';

const characterTint = (color: string | undefined): number => {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return 0xffe082;
  return Number.parseInt(color.slice(1), 16);
};

interface OtherPlayerData {
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
}

interface PlayerInfo {
  x?: number;
  y?: number;
  name?: string;
  direction?: string;
  color?: string;
}

interface BookInfo {
  x: number;
  y: number;
  type?: string;
  label?: string;
  message?: string;
  score?: number;
  capital?: number;
  color?: string;
}

interface TrapInfo {
  id?: string;
  x: number;
  y: number;
  type?: string;
  label?: string;
  message?: string;
  score?: number;
  capital?: number;
  effect?: string;
  durationMs?: number;
  color?: string;
  size?: number;
  activeAt?: number;
  warningLabel?: string;
  hitboxScale?: number;
  immunityMs?: number;
}

export class Main extends Phaser.Scene {
  private player!: Player;
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private worldLayer!: Phaser.Tilemaps.TilemapLayer;

  // Realtime Multiplayer states
  private otherPlayers: Map<string, OtherPlayerData> = new Map();
  private localBooks: Map<string, Phaser.GameObjects.Container> = new Map();
  private localTraps: Map<string, Phaser.GameObjects.Container> = new Map();

  private isFrozen = false;
  private lastSyncTime = 0;
  private collidedBooks: Set<string> = new Set();
  private collidedNpcs: Set<string> = new Set();
  private collidedGates: Set<string> = new Set();
  private trapCooldownUntil: Map<string, number> = new Map();
  private trapImmuneUntil = 0;
  private hostCursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private hostWorld?: HostWorld;
  private localNpcs: Map<string, Phaser.GameObjects.Container> = new Map();
  private localGates: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super(key.scene.main);
  }

  create() {
    this.tilemap = this.make.tilemap({
      key: key.tilemap.tuxemon,
    });

    const tileset = this.tilemap.addTilesetImage(
      TILESET_NAME,
      key.image.tuxemon,
    )!;

    this.tilemap.createLayer(TilemapLayer.BelowPlayer, tileset, 0, 0);
    this.worldLayer = this.tilemap.createLayer(
      TilemapLayer.World,
      tileset,
      0,
      0,
    )!;
    const aboveLayer = this.tilemap.createLayer(
      TilemapLayer.AbovePlayer,
      tileset,
      0,
      0,
    )!;

    this.worldLayer.setCollisionByProperty({ collides: true });
    this.physics.world.bounds.width = this.worldLayer.width;
    this.physics.world.bounds.height = this.worldLayer.height;

    aboveLayer.setDepth(Depth.AbovePlayer);

    // 1. Khởi tạo người chơi
    this.addPlayer();

    // 2. Thiết lập Camera tùy theo vai trò
    if (playerRole === 'host') {
      this.cameras.main.setZoom(
        0.7,
      ); /* Zoom 0.7 để chiều cao bản đồ 1280px khớp hoàn hảo với chiều cao viewport 900px */
      this.player.setVisible(false);
      this.player.body.enable = false;

      // Căn giữa camera vào tâm bản đồ 1280x1280 (tức là tọa độ x: 640, y: 640)
      this.cameras.main.centerOn(
        this.tilemap.widthInPixels / 2,
        this.tilemap.heightInPixels / 2,
      );

      this.hostCursors = this.input.keyboard!.createCursorKeys();
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown) {
          this.cameras.main.scrollX -=
            (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
          this.cameras.main.scrollY -=
            (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
        }
      });
      this.hostWorld = new HostWorld(this, this.worldLayer);
    } else {
      this.cameras.main.setBounds(
        0,
        0,
        this.tilemap.widthInPixels,
        this.tilemap.heightInPixels,
      );
      this.cameras.main.startFollow(this.player);
      this.cameras.main.setZoom(
        1.5,
      ); /* Điều chỉnh zoom Player về 1.5 theo ý kiến người dùng */
    }

    // Lắng nghe sự kiện từ React ngoài
    window.addEventListener('message', (e) => {
      if (!e.data || !e.data.type) return;

      if (e.data.type === 'FREEZE') {
        this.isFrozen = true;
        if (this.player && this.player.body) {
          this.player.body.setVelocity(0);
        }
      } else if (e.data.type === 'UNFREEZE') {
        this.isFrozen = false;
      } else if (e.data.type === 'DPAD_MOVE') {
        this.player.setDpadDirection(e.data.dir || 'stop');
      }
    });

    // 3. Tích hợp dữ liệu realtime Multiplayer
    this.setupMultiplayerSync();
  }

  private addPlayer() {
    const spawnPoint = this.tilemap.findObject(
      TilemapLayer.Objects,
      ({ name }) => name === TilemapObject.SpawnPoint,
    )!;

    this.player = new Player(this, spawnPoint.x!, spawnPoint.y!);

    const nameText = this.add.text(
      spawnPoint.x!,
      spawnPoint.y! - 30,
      `${playerName} (Tôi)`,
      {
        fontSize: '20px',
        fontFamily: 'VT323',
        color: '#ffd54f',
        fontStyle: 'bold',
        backgroundColor: 'rgba(0,0,0,0.65)',
        padding: { x: 6, y: 3 },
      },
    );
    nameText.setDepth(Depth.AbovePlayer);
    nameText.setOrigin(0.5, 0.5);

    this.events.on('update', () => {
      nameText.setPosition(this.player.x, this.player.y - 30);
    });

    this.physics.add.collider(this.player, this.worldLayer);
  }

  private parseHexColor(value: string | undefined, fallback: number) {
    if (!value || !/^#[0-9a-fA-F]{6}$/.test(value)) return fallback;
    return Number.parseInt(value.slice(1), 16);
  }

  private setupMultiplayerSync() {
    // A. Lắng nghe danh sách người chơi khác
    const playersRef = ref(db, 'players');
    onValue(playersRef, (snapshot) => {
      const playersData = snapshot.val() || {};

      Object.entries(playersData).forEach(([id, raw]) => {
        const pInfo = raw as PlayerInfo;
        if (id === playerId) return;
        if (pInfo.x === undefined || pInfo.y === undefined) return;

        let other = this.otherPlayers.get(id);
        if (!other) {
          const newSprite = this.add.sprite(
            pInfo.x,
            pInfo.y,
            key.atlas.player,
            'misa-front',
          );
          newSprite.setDepth(Depth.AbovePlayer);
          newSprite.setTint(characterTint(pInfo.color));

          const newLabel = this.add.text(
            pInfo.x,
            pInfo.y - 30,
            pInfo.name || 'Ẩn danh',
            {
              fontSize: '16px',
              fontFamily: 'VT323',
              color: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: { x: 5, y: 2 },
            },
          );
          newLabel.setDepth(Depth.AbovePlayer);
          newLabel.setOrigin(0.5, 0.5);

          other = { sprite: newSprite, label: newLabel };
          this.otherPlayers.set(id, other);
        }

        other.sprite.setPosition(pInfo.x, pInfo.y);
        other.label.setPosition(pInfo.x, pInfo.y - 30);

        if (pInfo.direction) {
          other.sprite.anims.play(`player_${pInfo.direction}`, true);
        } else {
          other.sprite.anims.stop();
        }
      });

      this.otherPlayers.forEach((val, id) => {
        if (!playersData[id]) {
          val.sprite.destroy();
          val.label.destroy();
          this.otherPlayers.delete(id);
        }
      });
    });

    // B. Lắng nghe và vẽ các cuốn Sách Tri Thức
    const booksRef = ref(db, 'books');
    onValue(booksRef, (snapshot) => {
      const booksData = snapshot.val() || {};

      Object.entries(booksData).forEach(([id, raw]) => {
        const book = raw as BookInfo;
        if (!this.localBooks.has(id)) {
          const container = this.add.container(book.x, book.y);

          const color = this.parseHexColor(book.color, 0xffd54f);
          const glow = this.add.graphics();
          glow.fillStyle(color, 0.24);
          glow.fillCircle(0, 0, 22);
          glow.lineStyle(2, color, 1);
          glow.strokeCircle(0, 0, 18);

          const icon = this.add.graphics();
          icon.fillStyle(color, 1);
          icon.fillRoundedRect(-12, -10, 24, 20, 5);
          icon.lineStyle(2, 0xffffff, 0.9);
          icon.strokeRoundedRect(-12, -10, 24, 20, 5);
          icon.fillStyle(0xffffff, 0.9);
          icon.fillCircle(0, 0, 4);

          const bookLabel = this.add.text(0, -30, book.label || 'Cơ hội', {
            fontSize: '16px',
            fontFamily: 'VT323',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: 'rgba(0,0,0,0.65)',
            padding: { x: 5, y: 2 },
          });
          bookLabel.setOrigin(0.5, 0.5);

          container.add([glow, icon, bookLabel]);
          container.setDepth(Depth.AbovePlayer);

          this.physics.world.enable(container);
          const body = container.body as Phaser.Physics.Arcade.Body;
          body.setCircle(10, -10, -10);

          if (playerRole !== 'host') {
            this.physics.add.overlap(this.player, container, async () => {
              if (this.collidedBooks.has(id)) return;
              this.collidedBooks.add(id);
              window.parent.postMessage(
                { type: 'NHAT_SACH', bookId: id, opportunity: book },
                '*',
              );
            });
          }

          this.localBooks.set(id, container);
        }
      });

      this.localBooks.forEach((val, id) => {
        if (!booksData[id]) {
          val.destroy();
          this.localBooks.delete(id);
          this.collidedBooks.delete(id);
        }
      });
    });

    // C. Lắng nghe và vẽ các Cạm bẫy Laser ⚡
    const trapsRef = ref(db, 'traps');
    onValue(trapsRef, (snapshot) => {
      const trapsData = snapshot.val() || {};

      Object.entries(trapsData).forEach(([id, raw]) => {
        const trap = raw as TrapInfo;
        let localTrap = this.localTraps.get(id);

        if (!localTrap) {
          const container = this.add.container(trap.x, trap.y);

          const trapColor = this.parseHexColor(trap.color, 0xd32f2f);
          const radius = Math.max(15, Math.round((trap.size || 35) / 2));
          const hitRadius = Math.max(
            8,
            Math.round(radius * (trap.hitboxScale || 0.65)),
          );
          const activeAt = trap.activeAt || Date.now();

          const warning = this.add.graphics();
          warning.fillStyle(trapColor, 0.07);
          warning.fillCircle(0, 0, radius + 14);
          warning.lineStyle(1, trapColor, 0.32);
          warning.strokeCircle(0, 0, radius + 14);

          const trapGraphics = this.add.graphics();
          this.drawTrapPixelArt(trapGraphics, trap.type);

          const trapLabel = this.add.text(
            0,
            -radius - 18,
            Date.now() < activeAt
              ? trap.warningLabel || 'Rủi ro đang tới'
              : trap.label || 'Rủi ro',
            {
              fontSize: '16px',
              fontFamily: 'VT323',
              color: '#ffffff',
              fontStyle: 'bold',
              backgroundColor: 'rgba(0,0,0,0.68)',
              padding: { x: 5, y: 2 },
            },
          );
          trapLabel.setOrigin(0.5, 0.5);
          trapLabel.setVisible(false); // Ẩn hoàn toàn bảng tên bẫy theo yêu cầu

          container.add([warning, trapGraphics, trapLabel]);
          container.setDepth(Depth.AbovePlayer);
          container.setData('warning', warning);
          container.setData('active', trapGraphics);
          container.setData('label', trapLabel);
          container.setData('activeAt', activeAt);
          container.setData(
            'warningLabel',
            trap.warningLabel || 'Rủi ro đang tới',
          );
          container.setData('activeLabel', trap.label || 'Rủi ro');
          container.setData('immunityMs', trap.immunityMs || 5500);

          this.physics.world.enable(container);
          const body = container.body as Phaser.Physics.Arcade.Body;
          body.setCircle(hitRadius, -hitRadius, -hitRadius);

          if (playerRole !== 'host') {
            this.physics.add.overlap(this.player, container, async () => {
              const now = Date.now();
              if (now < (container.getData('activeAt') || 0)) return;
              if (now < this.trapImmuneUntil) return;
              if ((this.trapCooldownUntil.get(id) || 0) > now) return;
              const immunityMs = container.getData('immunityMs') || 5500;
              this.trapImmuneUntil = now + immunityMs;
              this.trapCooldownUntil.set(id, now + immunityMs);
              window.parent.postMessage(
                { type: 'DINH_BAY', trapId: id, hazard: trap },
                '*',
              );
            });
          }

          localTrap = container;
          this.localTraps.set(id, localTrap);
        }

        localTrap.setData(
          'activeAt',
          trap.activeAt || localTrap.getData('activeAt') || Date.now(),
        );
        localTrap.setData(
          'warningLabel',
          trap.warningLabel ||
            localTrap.getData('warningLabel') ||
            'Rủi ro đang tới',
        );
        localTrap.setData(
          'activeLabel',
          trap.label || localTrap.getData('activeLabel') || 'Rủi ro',
        );
        localTrap.setData(
          'immunityMs',
          trap.immunityMs || localTrap.getData('immunityMs') || 5500,
        );
        localTrap.setPosition(trap.x, trap.y);
      });

      this.localTraps.forEach((val, id) => {
        if (!trapsData[id]) {
          val.destroy();
          this.localTraps.delete(id);
        }
      });
    });

    // D. Lắng nghe NPC (Khách Ruột - Phase 2) — dùng sprite nhân vật, KHÔNG có label
    const npcsRef = ref(db, 'npcs');
    onValue(npcsRef, (snapshot) => {
      const npcsData = (snapshot.val() || {}) as Record<
        string,
        { x: number; y: number; label?: string }
      >;

      Object.entries(npcsData).forEach(([id, npc]) => {
        if (!this.localNpcs.has(id)) {
          const container = this.add.container(npc.x, npc.y);

          // Dùng sprite nhân vật giống player — trông tự nhiên, khó phát hiện
          const npcSprite = this.add.sprite(
            0,
            0,
            key.atlas.player,
            'misa-front',
          );
          npcSprite.setTint(0x80cbc4); // Teal nhạt để phân biệt nhẹ nhưng không quá lộ

          container.add([npcSprite]);
          container.setDepth(Depth.AbovePlayer);

          this.physics.world.enable(container);
          const phBody = container.body as Phaser.Physics.Arcade.Body;
          phBody.setCircle(16, -16, -16);

          if (this.collidedNpcs.has(id)) {
            container.setVisible(false);
          }

          if (playerRole !== 'host') {
            this.physics.add.overlap(this.player, container, () => {
              if (this.collidedNpcs.has(id)) return;
              this.collidedNpcs.add(id);
              container.setVisible(false); // Ẩn ngay lập tức trên máy người chơi này
              window.parent.postMessage(
                { type: 'FOUND_LOYAL_CUSTOMER', npcId: id },
                '*',
              );
            });
          }

          this.localNpcs.set(id, container);
        } else {
          const container = this.localNpcs.get(id)!;
          container.setPosition(npc.x, npc.y);
          if (this.collidedNpcs.has(id)) {
            container.setVisible(false);
          }
        }
      });

      this.localNpcs.forEach((val, id) => {
        if (!npcsData[id]) {
          val.destroy();
          this.localNpcs.delete(id);
          this.collidedNpcs.delete(id);
        }
      });
    });

    // E. Lắng nghe Gate (Cổng Thoát - Phase 3)
    const gatesRef = ref(db, 'gates');
    onValue(gatesRef, (snapshot) => {
      const gatesData = (snapshot.val() || {}) as Record<
        string,
        { x: number; y: number; label?: string; activeAt?: number }
      >;

      Object.entries(gatesData).forEach(([id, gate]) => {
        if (!this.localGates.has(id)) {
          const container = this.add.container(gate.x, gate.y);

          // Gate: golden portal marker
          const outerGlow = this.add.graphics();
          outerGlow.fillStyle(0xc9922a, 0.25);
          outerGlow.fillCircle(0, 0, 28);

          const portal = this.add.graphics();
          portal.lineStyle(3, 0xc9922a, 1);
          portal.strokeCircle(0, 0, 20);
          portal.lineStyle(2, 0xffd54f, 0.8);
          portal.strokeCircle(0, 0, 14);
          portal.fillStyle(0xffd54f, 0.3);
          portal.fillCircle(0, 0, 10);

          const gateLabel = this.add.text(0, -30, 'Cổng đang mở...', {
            fontSize: '16px',
            fontFamily: 'VT323',
            color: '#ffd54f',
            backgroundColor: 'rgba(0,0,0,0.65)',
            padding: { x: 5, y: 2 },
          });
          gateLabel.setOrigin(0.5, 0.5);

          container.add([outerGlow, portal, gateLabel]);
          container.setDepth(Depth.AbovePlayer);
          container.setData('activeAt', gate.activeAt || Date.now());
          container.setData('gateLabel', gateLabel);

          this.physics.world.enable(container);
          const phBody = container.body as Phaser.Physics.Arcade.Body;
          phBody.setCircle(20, -20, -20);

          if (playerRole !== 'host') {
            this.physics.add.overlap(this.player, container, () => {
              if (this.collidedGates.has(id)) return;
              const now = Date.now();
              if (now < (container.getData('activeAt') || 0)) return;
              this.collidedGates.add(id);
              window.parent.postMessage(
                { type: 'ESCAPED_GATE', gateId: id },
                '*',
              );
            });
          }

          this.localGates.set(id, container);
        } else {
          const existing = this.localGates.get(id)!;
          existing.setPosition(gate.x, gate.y);
          if (gate.activeAt) existing.setData('activeAt', gate.activeAt);
        }
      });

      this.localGates.forEach((val, id) => {
        if (!gatesData[id]) {
          val.destroy();
          this.localGates.delete(id);
          this.collidedGates.delete(id);
        }
      });
    });
  }

  // Vẽ con mèo hoặc con chó pixel art đầy đủ cả thân và chân
  private drawTrapPixelArt(
    graphics: Phaser.GameObjects.Graphics,
    type?: string,
  ) {
    const isCat = type === 'visibility_squeeze' || type === 'mall_copy';
    const grid = isCat
      ? [
          // Tai mèo
          [0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
          [0, 2, 1, 2, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0],
          [0, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 0, 0, 0, 0, 0],
          // Đầu mèo
          [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0],
          [2, 1, 4, 1, 1, 1, 1, 1, 4, 1, 2, 0, 0, 0, 0, 0], // Mắt trắng
          [2, 1, 1, 1, 1, 3, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0], // Mũi hồng
          [2, 1, 1, 1, 3, 3, 3, 1, 1, 1, 2, 0, 0, 0, 0, 0], // Râu
          [0, 2, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0],
          // Thân mèo (nằm ngang kéo dài sang phải) + Đuôi hướng lên
          [0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 0, 0, 2],
          [0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0, 2, 1],
          [0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 2],
          // Chân mèo (front & back legs)
          [0, 0, 0, 2, 1, 2, 2, 1, 2, 2, 1, 2, 2, 2, 2, 0],
          [0, 0, 0, 2, 1, 2, 0, 2, 1, 2, 2, 1, 2, 0, 0, 0],
          [0, 0, 0, 2, 4, 2, 0, 2, 4, 2, 2, 4, 2, 0, 0, 0], // Bàn chân trắng
        ]
      : [
          // Tai cụp
          [0, 2, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0],
          [2, 1, 1, 2, 0, 0, 0, 2, 1, 1, 2, 0, 0, 0, 0, 0],
          [2, 1, 1, 1, 2, 2, 2, 1, 1, 1, 2, 0, 0, 0, 0, 0],
          // Đầu chó
          [0, 2, 1, 1, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0],
          [0, 2, 1, 3, 1, 1, 1, 3, 1, 2, 0, 0, 0, 0, 0, 0], // Mắt
          [0, 2, 1, 1, 1, 3, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0], // Mũi
          [0, 2, 1, 1, 3, 4, 3, 1, 1, 2, 0, 0, 0, 0, 0, 0], // Lưỡi thè ra
          [0, 0, 2, 1, 1, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0],
          // Thân chó kéo dài sang phải + Đuôi vểnh
          [0, 0, 2, 1, 1, 1, 1, 1, 1, 2, 2, 2, 0, 0, 2, 0],
          [0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 1, 2],
          [0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 0],
          // Chân chó
          [0, 0, 0, 2, 1, 2, 2, 1, 2, 2, 1, 2, 2, 2, 0, 0],
          [0, 0, 0, 2, 1, 2, 0, 2, 1, 2, 2, 1, 2, 0, 0, 0],
          [0, 0, 0, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0],
        ];

    const colors: Record<number, number> = isCat
      ? {
          1: 0xffb74d, // Cam (Mèo)
          2: 0x2c1a0e, // Viền nâu đậm
          3: 0xff8a80, // Chi tiết hồng (mũi/tai)
          4: 0xffffff, // Trắng (mắt/bàn chân)
        }
      : {
          1: 0xa1887f, // Nâu (Chó)
          2: 0x2c1a0e, // Viền nâu đậm
          3: 0x1a1a1a, // Đen (mắt/mũi)
          4: 0xe57373, // Lưỡi hồng thè ra
        };

    const pixelSize = 2; // pixelSize = 2 để cân đối tỉ lệ kích thước (16x14 grid -> 32x28 pixels)
    const cols = grid[0].length;
    const rows = grid.length;
    const offsetX = -(cols * pixelSize) / 2;
    const offsetY = -(rows * pixelSize) / 2;

    graphics.clear();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c];
        if (val > 0) {
          const color = colors[val] || 0;
          graphics.fillStyle(color, 1);
          graphics.fillRect(
            offsetX + c * pixelSize,
            offsetY + r * pixelSize,
            pixelSize,
            pixelSize,
          );
        }
      }
    }
  }

  private updateTrapVisuals() {
    const now = Date.now();
    this.localTraps.forEach((container) => {
      const warning = container.getData('warning') as
        | Phaser.GameObjects.Graphics
        | undefined;
      const active = container.getData('active') as
        | Phaser.GameObjects.Graphics
        | undefined;
      const label = container.getData('label') as
        | Phaser.GameObjects.Text
        | undefined;
      const activeAt = container.getData('activeAt') || 0;
      const isActive = now >= activeAt;

      warning?.setVisible(!isActive);
      active?.setVisible(isActive);
      if (label) {
        label.setVisible(false); // Ẩn hoàn toàn bảng tên
      }
    });
  }

  private updateGateVisuals() {
    const now = Date.now();
    this.localGates.forEach((container) => {
      const label = container.getData('gateLabel') as
        | Phaser.GameObjects.Text
        | undefined;
      const activeAt = container.getData('activeAt') || 0;
      const isActive = now >= activeAt;
      if (label) {
        label.setText(isActive ? 'Cổng Thoát ⭐' : 'Cổng đang mở...');
        label.setAlpha(isActive ? 1 : 0.6);
      }
      container.setAlpha(isActive ? 1 : 0.5);
    });
  }

  update(time: number) {
    this.updateTrapVisuals();
    this.updateGateVisuals();

    if (playerRole === 'host') {
      this.hostWorld?.update(time);
      const speed = 10;
      if (this.hostCursors.left.isDown) this.cameras.main.scrollX -= speed;
      if (this.hostCursors.right.isDown) this.cameras.main.scrollX += speed;
      if (this.hostCursors.up.isDown) this.cameras.main.scrollY -= speed;
      if (this.hostCursors.down.isDown) this.cameras.main.scrollY += speed;
      return;
    }

    if (this.isFrozen) {
      this.player.body.setVelocity(0);
      this.player.anims.stop();
      return;
    }

    this.player.update();

    const now = Date.now();
    if (now - this.lastSyncTime > 45) {
      this.lastSyncTime = now;

      const velocity = this.player.body.velocity;
      let dir = 'down';
      if (velocity.x < 0) dir = 'left';
      else if (velocity.x > 0) dir = 'right';
      else if (velocity.y < 0) dir = 'up';
      else if (velocity.y > 0) dir = 'down';

      update(ref(db, `players/${playerId}`), {
        x: this.player.x,
        y: this.player.y,
        direction: dir,
        color: playerColor,
      });
    }
  }
}
