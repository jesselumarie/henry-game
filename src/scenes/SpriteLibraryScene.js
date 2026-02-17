import Phaser from 'phaser';
import { SpriteManager, SPRITE_ROLES } from '../systems/SpriteManager.js';

export class SpriteLibraryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpriteLibraryScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add
      .text(width / 2, 25, 'SPRITE LIBRARY', {
        fontSize: '28px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Back button
    this.add
      .text(20, 20, '< BACK', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#88aacc',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));

    // Upload area
    this.createUploadArea(width / 2, 85);

    // Sprite gallery
    this.galleryY = 160;
    this.refreshGallery();

    // Role assignments panel
    this.assignmentY = 400;
    this.refreshAssignments();
  }

  createUploadArea(x, y) {
    const { width } = this.cameras.main;

    // Upload zone outline
    const zone = this.add.rectangle(x, y, width - 60, 60, 0x223344);
    zone.setStrokeStyle(2, 0x4488aa);

    this.add
      .text(x, y - 8, 'Drop an image here or click to upload', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#6699bb',
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 12, '(PNG recommended, will be scaled to pixel art size)', {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#445566',
      })
      .setOrigin(0.5);

    // Hidden file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    // Click to upload
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      this.fileInput.click();
    });
    zone.on('pointerover', () => zone.setFillStyle(0x334455));
    zone.on('pointerout', () => zone.setFillStyle(0x223344));

    // Drag and drop support
    this.setupDragDrop();
  }

  setupDragDrop() {
    const canvas = this.game.canvas;

    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.scene.key !== 'SpriteLibraryScene') return;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFileUpload(e.dataTransfer.files[0]);
      }
    });
  }

  handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
      console.warn('Not an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Scale to pixel art size (32x32 by default)
        const canvas = document.createElement('canvas');
        const targetSize = 32;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, targetSize, targetSize);

        const dataUrl = canvas.toDataURL('image/png');
        const name = file.name.replace(/\.[^.]+$/, '') || 'Unnamed Sprite';
        const spriteId = SpriteManager.addSprite(
          name,
          dataUrl,
          targetSize,
          targetSize
        );

        // Add to Phaser textures
        const texImg = new Image();
        texImg.onload = () => {
          if (!this.textures.exists(spriteId)) {
            this.textures.addImage(spriteId, texImg);
          }
          this.refreshGallery();
        };
        texImg.src = dataUrl;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  refreshGallery() {
    // Clear existing gallery items
    if (this.galleryContainer) {
      this.galleryContainer.destroy();
    }

    const { width } = this.cameras.main;
    this.galleryContainer = this.add.container(0, 0);

    const sprites = SpriteManager.getAllSprites();

    this.add
      .text(30, this.galleryY - 10, `Uploaded Sprites (${sprites.length}):`, {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#aaccee',
      });

    if (sprites.length === 0) {
      this.galleryContainer.add(
        this.add
          .text(width / 2, this.galleryY + 30, 'No sprites uploaded yet!', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#556677',
          })
          .setOrigin(0.5)
      );
      return;
    }

    const cols = 8;
    const cellSize = 70;
    const startX = 50;

    sprites.forEach((sprite, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellSize;
      const y = this.galleryY + 20 + row * (cellSize + 10);

      // Background
      const bg = this.add.rectangle(x + 25, y + 25, 56, 56, 0x223344);
      bg.setStrokeStyle(1, 0x334455);
      this.galleryContainer.add(bg);

      // Sprite preview
      if (this.textures.exists(sprite.id)) {
        const preview = this.add.image(x + 25, y + 20, sprite.id).setScale(1.5);
        this.galleryContainer.add(preview);
      }

      // Name
      const nameText = this.add
        .text(x + 25, y + 45, sprite.name.slice(0, 8), {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#8899aa',
        })
        .setOrigin(0.5);
      this.galleryContainer.add(nameText);

      // Delete button
      const delBtn = this.add
        .text(x + 48, y + 2, 'x', {
          fontSize: '12px',
          fontFamily: 'Courier New',
          color: '#cc4444',
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          SpriteManager.removeSprite(sprite.id);
          this.refreshGallery();
          this.refreshAssignments();
        });
      this.galleryContainer.add(delBtn);
    });
  }

  refreshAssignments() {
    if (this.assignContainer) {
      this.assignContainer.destroy();
    }

    const { width } = this.cameras.main;
    this.assignContainer = this.add.container(0, 0);

    this.add
      .text(30, this.assignmentY, 'Role Assignments:', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#aaccee',
      });

    const roles = Object.entries(SPRITE_ROLES);
    const sprites = SpriteManager.getAllSprites();

    roles.forEach(([roleId, role], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 40 + col * 250;
      const y = this.assignmentY + 30 + row * 50;

      // Role name
      this.assignContainer.add(
        this.add.text(x, y, role.name, {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#ffffff',
        })
      );

      // Current assignment
      const assigned = SpriteManager.getSpriteForRole(roleId);
      const assignText = assigned ? assigned.name : '(default)';

      const assignBtn = this.add
        .text(x + 120, y, `[${assignText}]`, {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: assigned ? '#44cc88' : '#667788',
        })
        .setInteractive({ useHandCursor: true });

      assignBtn.on('pointerdown', () => {
        this.cycleAssignment(roleId, sprites);
      });

      this.assignContainer.add(assignBtn);
    });
  }

  cycleAssignment(roleId, sprites) {
    if (sprites.length === 0) return;

    const current = SpriteManager.getSpriteForRole(roleId);
    const currentIdx = current
      ? sprites.findIndex((s) => s.id === current.id)
      : -1;
    const nextIdx = (currentIdx + 1) % (sprites.length + 1);

    if (nextIdx >= sprites.length) {
      // Cycle back to default
      SpriteManager.unassignRole(roleId);
    } else {
      SpriteManager.assignToRole(sprites[nextIdx].id, roleId);
    }

    this.refreshAssignments();
  }

  shutdown() {
    // Clean up file input
    if (this.fileInput && this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput);
    }
  }
}
