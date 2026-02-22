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

    // Sky background — gradient from deep blue to pale horizon
    this.createPixelSprite('sky-bg', 64, 128, (ctx) => {
      const topR = 0x44, topG = 0x77, topB = 0xcc;
      const botR = 0xcc, botG = 0xdd, botB = 0xee;
      for (let y = 0; y < 128; y++) {
        const t = y / 127;
        const r = Math.round(topR + (botR - topR) * t);
        const g = Math.round(topG + (botG - topG) * t);
        const b = Math.round(topB + (botB - topB) * t);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, y, 64, 1);
      }
      // Wispy clouds
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(8, 18, 22, 4);
      ctx.fillRect(10, 16, 16, 2);
      ctx.fillRect(12, 22, 10, 2);
      ctx.fillRect(42, 30, 18, 3);
      ctx.fillRect(44, 28, 12, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(4, 50, 14, 3);
      ctx.fillRect(30, 42, 20, 3);
    });

    // Far mountain layer — distant, lighter, hazy
    this.createPixelSprite('mountain-far', 256, 96, (ctx) => {
      // Transparent sky
      ctx.clearRect(0, 0, 256, 96);
      // Distant mountains — muted blue-gray, soft shapes
      const farColor = '#8899aa';
      const farSnow = '#bbc8d4';
      // Mountain 1 — broad, gentle
      ctx.fillStyle = farColor;
      for (let i = 0; i < 80; i++) {
        const h = Math.round(50 * Math.pow(1 - Math.abs(i - 40) / 40, 1.2));
        ctx.fillRect(i, 96 - h, 1, h);
      }
      // Snow cap
      ctx.fillStyle = farSnow;
      for (let i = 25; i < 55; i++) {
        const h = Math.round(50 * Math.pow(1 - Math.abs(i - 40) / 40, 1.2));
        if (h > 35) ctx.fillRect(i, 96 - h, 1, Math.min(6, h - 35));
      }
      // Mountain 2 — taller, narrower
      ctx.fillStyle = farColor;
      for (let i = 0; i < 60; i++) {
        const h = Math.round(65 * Math.pow(1 - Math.abs(i - 30) / 30, 1.4));
        ctx.fillRect(90 + i, 96 - h, 1, h);
      }
      ctx.fillStyle = farSnow;
      for (let i = 15; i < 45; i++) {
        const h = Math.round(65 * Math.pow(1 - Math.abs(i - 30) / 30, 1.4));
        if (h > 48) ctx.fillRect(90 + i, 96 - h, 1, Math.min(8, h - 48));
      }
      // Mountain 3 — medium
      ctx.fillStyle = farColor;
      for (let i = 0; i < 70; i++) {
        const h = Math.round(42 * Math.pow(1 - Math.abs(i - 35) / 35, 1.3));
        ctx.fillRect(170 + i, 96 - h, 1, h);
      }
      ctx.fillStyle = farSnow;
      for (let i = 20; i < 50; i++) {
        const h = Math.round(42 * Math.pow(1 - Math.abs(i - 35) / 35, 1.3));
        if (h > 30) ctx.fillRect(170 + i, 96 - h, 1, Math.min(5, h - 30));
      }
      // Haze at base
      for (let y = 70; y < 96; y++) {
        const alpha = ((y - 70) / 26) * 0.15;
        ctx.fillStyle = `rgba(180,200,220,${alpha})`;
        ctx.fillRect(0, y, 256, 1);
      }
    });

    // Near mountain layer — closer, darker, more detail
    this.createPixelSprite('mountain-near', 256, 96, (ctx) => {
      ctx.clearRect(0, 0, 256, 96);
      const nearColor = '#556677';
      const nearShadow = '#445566';
      const nearSnow = '#dde4ea';
      // Mountain A — large, left-heavy ridge
      ctx.fillStyle = nearColor;
      for (let i = 0; i < 100; i++) {
        const peak = 40 + 15 * Math.sin(i * 0.08);
        const h = Math.round(peak * Math.pow(1 - Math.abs(i - 50) / 50, 1.1));
        ctx.fillRect(i, 96 - h, 1, h);
      }
      // Shadow side
      ctx.fillStyle = nearShadow;
      for (let i = 50; i < 100; i++) {
        const peak = 40 + 15 * Math.sin(i * 0.08);
        const h = Math.round(peak * Math.pow(1 - Math.abs(i - 50) / 50, 1.1));
        if (h > 5) ctx.fillRect(i, 96 - h + 3, 1, Math.max(1, h / 3));
      }
      // Snow cap
      ctx.fillStyle = nearSnow;
      for (let i = 30; i < 70; i++) {
        const peak = 40 + 15 * Math.sin(i * 0.08);
        const h = Math.round(peak * Math.pow(1 - Math.abs(i - 50) / 50, 1.1));
        if (h > 35) ctx.fillRect(i, 96 - h, 1, Math.min(6, h - 35));
      }
      // Mountain B — jagged peak
      ctx.fillStyle = nearColor;
      for (let i = 0; i < 80; i++) {
        const jagged = 2 * Math.sin(i * 0.5);
        const h = Math.round((55 + jagged) * Math.pow(1 - Math.abs(i - 40) / 40, 1.5));
        ctx.fillRect(120 + i, 96 - h, 1, h);
      }
      ctx.fillStyle = nearShadow;
      for (let i = 40; i < 80; i++) {
        const jagged = 2 * Math.sin(i * 0.5);
        const h = Math.round((55 + jagged) * Math.pow(1 - Math.abs(i - 40) / 40, 1.5));
        if (h > 5) ctx.fillRect(120 + i, 96 - h + 2, 1, Math.max(1, h / 4));
      }
      ctx.fillStyle = nearSnow;
      for (let i = 22; i < 58; i++) {
        const jagged = 2 * Math.sin(i * 0.5);
        const h = Math.round((55 + jagged) * Math.pow(1 - Math.abs(i - 40) / 40, 1.5));
        if (h > 40) ctx.fillRect(120 + i, 96 - h, 1, Math.min(8, h - 40));
      }
      // Mountain C — small foothill
      ctx.fillStyle = nearColor;
      for (let i = 0; i < 50; i++) {
        const h = Math.round(25 * Math.pow(1 - Math.abs(i - 25) / 25, 1.2));
        ctx.fillRect(210 + i, 96 - h, 1, h);
      }
      // Pine tree silhouettes along the base
      ctx.fillStyle = '#334455';
      for (let tx = 5; tx < 256; tx += 18 + Math.round(Math.sin(tx) * 6)) {
        const treeH = 10 + Math.round(Math.abs(Math.sin(tx * 0.3)) * 8);
        // Trunk
        ctx.fillRect(tx + 2, 96 - 3, 2, 3);
        // Foliage triangles
        for (let r = 0; r < treeH; r++) {
          const w = Math.max(1, Math.round((treeH - r) * 0.6));
          ctx.fillRect(tx + 3 - w, 96 - 3 - r, w * 2, 1);
        }
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
