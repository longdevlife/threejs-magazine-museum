import { Scene } from 'phaser';

import * as assets from '../assets';
import { key } from '../constants';

const selectedCharacterId =
  new URLSearchParams(window.location.search).get('character') || 'default';

const characterAtlasAssets: Record<string, string> = {
  shipper: './assets/atlas-shipper.png',
  student: './assets/atlas-student.png',
  entrepreneur: './assets/atlas-entrepreneur.png',
  seller: './assets/atlas-seller.png',
};

export class Boot extends Scene {
  constructor() {
    super(key.scene.boot);
  }

  preload() {
    this.load.spritesheet(key.image.spaceman, assets.sprites.spaceman, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.image(
      key.image.opportunityReview,
      './opportunity-items/review.png',
    );
    this.load.image(
      key.image.opportunityOrder,
      './opportunity-items/order.png',
    );
    this.load.image(
      key.image.opportunityLoyalCustomer,
      './opportunity-items/loyal-customer.png',
    );
    this.load.image(
      key.image.opportunityAiSkill,
      './opportunity-items/ai-skill.png',
    );
    this.load.image(
      key.image.opportunityNiche,
      './opportunity-items/niche.png',
    );
    this.load.image(key.image.tuxemon, assets.tilesets.tuxemon);
    this.load.tilemapTiledJSON(key.tilemap.tuxemon, assets.tilemaps.tuxemon);
    this.load.atlas(
      key.atlas.player,
      characterAtlasAssets[selectedCharacterId] || assets.atlas.image,
      assets.atlas.data,
    );
  }

  create() {
    this.scene.start(key.scene.main);
  }
}
