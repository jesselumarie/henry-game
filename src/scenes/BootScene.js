import Phaser from 'phaser';
import { SpriteManager } from '../systems/SpriteManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show loading text
    const loadingText = this.add
      .text(400, 300, 'Loading...', {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Load music
    this.load.audio('title-theme', 'title-theme.mp3');
    this.load.audio('main-level', 'main_level.mp3');
    this.load.audio('boss', 'boss.mp3');

    // Generate all placeholder sprites programmatically
    this.generatePlaceholderSprites();
  }

  generatePlaceholderSprites() {
    // Player - blue character
    this.createPixelSprite('player-default', 32, 32, (ctx) => {
      // Body
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(8, 4, 16, 20);
      // Head
      ctx.fillStyle = '#ffcc88';
      ctx.fillRect(10, 0, 12, 10);
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(12, 4, 3, 3);
      ctx.fillRect(18, 4, 3, 3);
      // Skis
      ctx.fillStyle = '#cc4444';
      ctx.fillRect(4, 26, 24, 4);
    });

    // Enemy basic - red goblin
    this.createPixelSprite('enemy-basic', 32, 32, (ctx) => {
      ctx.fillStyle = '#cc3333';
      ctx.fillRect(8, 6, 16, 18);
      ctx.fillStyle = '#880000';
      ctx.fillRect(10, 0, 12, 10);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(12, 4, 3, 3);
      ctx.fillRect(18, 4, 3, 3);
      ctx.fillStyle = '#442222';
      ctx.fillRect(6, 24, 8, 6);
      ctx.fillRect(18, 24, 8, 6);
    });

    // Enemy strong - purple brute
    this.createPixelSprite('enemy-strong', 32, 32, (ctx) => {
      ctx.fillStyle = '#8833cc';
      ctx.fillRect(4, 4, 24, 22);
      ctx.fillStyle = '#551199';
      ctx.fillRect(8, 0, 16, 10);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(12, 4, 3, 3);
      ctx.fillRect(20, 4, 3, 3);
      ctx.fillStyle = '#332255';
      ctx.fillRect(2, 26, 12, 6);
      ctx.fillRect(18, 26, 12, 6);
    });

    // Enemy boss - big dark figure
    this.createPixelSprite('enemy-boss', 48, 48, (ctx) => {
      ctx.fillStyle = '#333333';
      ctx.fillRect(8, 8, 32, 30);
      ctx.fillStyle = '#111111';
      ctx.fillRect(12, 2, 24, 14);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(16, 6, 5, 5);
      ctx.fillRect(28, 6, 5, 5);
      ctx.fillStyle = '#222222';
      ctx.fillRect(4, 38, 16, 8);
      ctx.fillRect(28, 38, 16, 8);
      // Crown
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(14, 0, 4, 6);
      ctx.fillRect(22, 0, 4, 6);
      ctx.fillRect(30, 0, 4, 6);
    });

    // Tree obstacle
    this.createPixelSprite('obstacle-tree', 32, 32, (ctx) => {
      // Trunk
      ctx.fillStyle = '#885522';
      ctx.fillRect(12, 18, 8, 14);
      // Foliage
      ctx.fillStyle = '#228833';
      ctx.fillRect(4, 2, 24, 8);
      ctx.fillRect(6, 10, 20, 6);
      ctx.fillRect(8, 16, 16, 4);
      // Snow on top
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 2, 20, 3);
    });

    // Rock obstacle
    this.createPixelSprite('obstacle-rock', 32, 32, (ctx) => {
      ctx.fillStyle = '#888888';
      ctx.fillRect(4, 12, 24, 16);
      ctx.fillRect(8, 8, 16, 4);
      ctx.fillStyle = '#666666';
      ctx.fillRect(6, 14, 8, 8);
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(16, 12, 10, 6);
    });

    // Coin collectible
    this.createPixelSprite('collectible-coin', 16, 16, (ctx) => {
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(4, 2, 8, 12);
      ctx.fillRect(2, 4, 12, 8);
      ctx.fillStyle = '#ffee66';
      ctx.fillRect(6, 4, 4, 4);
    });

    // Star collectible
    this.createPixelSprite('collectible-star', 16, 16, (ctx) => {
      ctx.fillStyle = '#ffee00';
      ctx.fillRect(6, 0, 4, 4);
      ctx.fillRect(0, 6, 16, 4);
      ctx.fillRect(4, 4, 8, 8);
      ctx.fillRect(2, 10, 4, 4);
      ctx.fillRect(10, 10, 4, 4);
    });

    // Health potion collectible
    this.createPixelSprite('collectible-potion', 16, 16, (ctx) => {
      // Bottle body
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(4, 6, 8, 8);
      // Bottle neck
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(6, 3, 4, 3);
      // Cork
      ctx.fillStyle = '#885522';
      ctx.fillRect(6, 1, 4, 2);
      // Shine
      ctx.fillStyle = '#ff6666';
      ctx.fillRect(5, 7, 2, 3);
      // Plus symbol (health cross)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 8, 2, 4);
      ctx.fillRect(6, 9, 4, 2);
    });

    // Ramp
    this.createPixelSprite('ramp', 32, 32, (ctx) => {
      ctx.fillStyle = '#ccaa66';
      // Triangle-ish ramp shape
      for (let row = 0; row < 16; row++) {
        ctx.fillRect(row * 2, 16 + row, 32 - row * 2, 2);
      }
      ctx.fillStyle = '#eedd88';
      ctx.fillRect(0, 30, 32, 2);
    });

    // Weapon sprites
    this.createPixelSprite('weapon-fists', 16, 16, (ctx) => {
      ctx.fillStyle = '#ffcc88';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillStyle = '#cc9966';
      ctx.fillRect(4, 4, 3, 4);
      ctx.fillRect(8, 4, 3, 4);
    });

    this.createPixelSprite('weapon-sword', 16, 16, (ctx) => {
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(6, 0, 4, 10);
      ctx.fillStyle = '#888888';
      ctx.fillRect(2, 10, 12, 2);
      ctx.fillStyle = '#885522';
      ctx.fillRect(6, 12, 4, 4);
    });

    this.createPixelSprite('weapon-staff', 16, 16, (ctx) => {
      ctx.fillStyle = '#885522';
      ctx.fillRect(7, 2, 2, 14);
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(4, 0, 8, 4);
    });

    this.createPixelSprite('weapon-snowball', 16, 16, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 8, 8);
      ctx.fillRect(6, 2, 4, 12);
      ctx.fillRect(2, 6, 12, 4);
      ctx.fillStyle = '#ddeeff';
      ctx.fillRect(6, 6, 3, 3);
    });

    // Placeholder for anything missing
    this.createPixelSprite('placeholder', 32, 32, (ctx) => {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillRect(16, 16, 16, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(16, 0, 16, 16);
      ctx.fillRect(0, 16, 16, 16);
    });

    // Snow ground tile
    this.createPixelSprite('snow-ground', 32, 32, (ctx) => {
      ctx.fillStyle = '#eeeeff';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#ddddee';
      ctx.fillRect(4, 8, 6, 2);
      ctx.fillRect(18, 4, 8, 2);
      ctx.fillRect(10, 20, 4, 2);
      ctx.fillRect(24, 22, 6, 2);
    });

    // Sky background
    this.createPixelSprite('sky-bg', 64, 64, (ctx) => {
      ctx.fillStyle = '#88bbee';
      ctx.fillRect(0, 0, 64, 64);
      // Clouds
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 10, 20, 6);
      ctx.fillRect(12, 8, 12, 2);
      ctx.fillRect(40, 20, 16, 4);
      ctx.fillRect(44, 18, 8, 2);
    });

    // Mountain background
    this.createPixelSprite('mountain-bg', 128, 64, (ctx) => {
      ctx.fillStyle = '#88bbee';
      ctx.fillRect(0, 0, 128, 64);
      // Mountains
      ctx.fillStyle = '#667788';
      for (let i = 0; i < 64; i++) {
        ctx.fillRect(0 + i, 64 - i, 1, i);
      }
      for (let i = 0; i < 48; i++) {
        ctx.fillRect(60 + i, 64 - i, 1, i);
      }
      for (let i = 0; i < 48; i++) {
        ctx.fillRect(60 + 48 - i, 64 - i, 1, i);
      }
      // Snow caps
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 15; i++) {
        ctx.fillRect(48 + i, 64 - 48 - i + 48 - 15, 1, 2);
      }
    });

    // Combat arena background
    this.createPixelSprite('arena-bg', 128, 64, (ctx) => {
      // Dark arena floor
      ctx.fillStyle = '#334455';
      ctx.fillRect(0, 0, 128, 64);
      // Snow-covered ground
      ctx.fillStyle = '#ddeeff';
      ctx.fillRect(0, 44, 128, 20);
      ctx.fillStyle = '#ccddee';
      ctx.fillRect(0, 44, 128, 4);
    });
  }

  createPixelSprite(key, width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx);
    this.textures.addCanvas(key, canvas);
  }

  create() {
    // Load any custom sprites from the library
    const sprites = SpriteManager.getAllSprites();
    let loaded = 0;
    const total = sprites.length;

    if (total === 0) {
      this.scene.start('MainMenuScene');
      return;
    }

    sprites.forEach((sprite) => {
      const img = new Image();
      img.onload = () => {
        if (!this.textures.exists(sprite.id)) {
          this.textures.addImage(sprite.id, img);
        }
        loaded++;
        if (loaded >= total) {
          this.scene.start('MainMenuScene');
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded >= total) {
          this.scene.start('MainMenuScene');
        }
      };
      img.src = sprite.dataUrl;
    });
  }
}
