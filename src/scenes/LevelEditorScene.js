import Phaser from 'phaser';
import { LevelManager } from '../systems/LevelManager.js';
import { SpriteManager, SPRITE_ROLES } from '../systems/SpriteManager.js';

const GRID_SIZE = 32;
const PLACEABLE_OBJECTS = [
  { type: 'obstacle_tree', name: 'Tree', category: 'ski' },
  { type: 'obstacle_rock', name: 'Rock', category: 'ski' },
  { type: 'collectible_coin', name: 'Coin', category: 'ski' },
  { type: 'collectible_star', name: 'Star', category: 'ski' },
  { type: 'ramp', name: 'Ramp', category: 'ski' },
  { type: 'enemy_basic', name: 'Basic Enemy', category: 'combat' },
  { type: 'enemy_strong', name: 'Strong Enemy', category: 'combat' },
  { type: 'enemy_boss', name: 'Boss', category: 'combat' },
];

export class LevelEditorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelEditorScene' });
  }

  init(data) {
    this.editingLevelId = data?.levelId || null;
    this.editorMode = data?.mode || 'ski'; // 'ski' or 'combat'
    this.selectedTool = null;
    this.placedObjects = [];
    this.isDragging = false;
    this.levelName = data?.levelName || 'My Level';
  }

  create() {
    const { width, height } = this.cameras.main;

    // Load existing level if editing
    if (this.editingLevelId) {
      const level = LevelManager.getLevel(this.editingLevelId);
      if (level) {
        this.placedObjects = [...(level.objects || level.enemies || [])];
        this.editorMode = level.type;
        this.levelName = level.name;
      }
    }

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2233);

    // Top bar
    this.add.rectangle(width / 2, 20, width, 40, 0x112233);

    // Back button
    this.add
      .text(15, 12, '< BACK', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#88aacc',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'));

    // Title
    this.titleText = this.add
      .text(width / 2, 12, `LEVEL EDITOR: ${this.levelName}`, {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0);

    // Mode toggle
    this.createModeToggle(width - 120, 12);

    // Tool palette (left sidebar)
    this.createToolPalette();

    // Canvas area (the actual editing grid)
    this.canvasX = 120;
    this.canvasY = 50;
    this.canvasWidth = width - 140;
    this.canvasHeight = height - 110;

    // Grid background
    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    // Object container for placed items
    this.objectContainer = this.add.container(0, 0);
    this.redrawObjects();

    // Bottom bar with actions
    this.createBottomBar();

    // Input handling for the canvas
    this.input.on('pointerdown', (pointer) => this.handleCanvasClick(pointer));
    this.input.on('pointermove', (pointer) => this.handleCanvasDrag(pointer));
    this.input.on('pointerup', () => (this.isDragging = false));

    // Right-click to delete
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.handleDelete(pointer);
      }
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-DELETE', () => {
      if (this.selectedPlacedObject !== undefined) {
        this.placedObjects.splice(this.selectedPlacedObject, 1);
        this.selectedPlacedObject = undefined;
        this.redrawObjects();
      }
    });
  }

  createModeToggle(x, y) {
    const skiBtn = this.add
      .text(x, y, 'SKI', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: this.editorMode === 'ski' ? '#44cc88' : '#667788',
        backgroundColor: this.editorMode === 'ski' ? '#224433' : '#222233',
        padding: { x: 8, y: 4 },
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.editorMode = 'ski';
        this.scene.restart({ mode: 'ski', levelName: this.levelName });
      });

    const combatBtn = this.add
      .text(x + 60, y, 'COMBAT', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: this.editorMode === 'combat' ? '#44cc88' : '#667788',
        backgroundColor:
          this.editorMode === 'combat' ? '#224433' : '#222233',
        padding: { x: 8, y: 4 },
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.editorMode = 'combat';
        this.scene.restart({ mode: 'combat', levelName: this.levelName });
      });
  }

  createToolPalette() {
    const paletteX = 10;
    const startY = 60;

    this.add
      .text(paletteX, startY, 'TOOLS', {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#8899aa',
      });

    // Eraser tool
    const eraserBtn = this.add
      .text(paletteX, startY + 18, 'ERASER', {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#cc4444',
        backgroundColor: '#332222',
        padding: { x: 4, y: 3 },
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.selectedTool = '_eraser';
        this.highlightTool();
      });

    this.toolButtons = [{ btn: eraserBtn, type: '_eraser' }];

    const filteredObjects = PLACEABLE_OBJECTS.filter(
      (obj) => obj.category === this.editorMode
    );

    filteredObjects.forEach((obj, i) => {
      const y = startY + 42 + i * 50;
      const textureKey = SpriteManager.getTextureKey(obj.type);

      // Object icon
      if (this.textures.exists(textureKey)) {
        this.add.image(paletteX + 18, y + 8, textureKey).setScale(1);
      }

      // Object label
      const btn = this.add
        .text(paletteX, y + 24, obj.name, {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#aabbcc',
          backgroundColor: '#222244',
          padding: { x: 3, y: 2 },
        })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.selectedTool = obj.type;
          this.highlightTool();
        });

      this.toolButtons.push({ btn, type: obj.type });
    });
  }

  highlightTool() {
    this.toolButtons.forEach(({ btn, type }) => {
      if (type === this.selectedTool) {
        btn.setStyle({ color: '#44ff88', backgroundColor: '#224433' });
      } else {
        btn.setStyle({
          color: type === '_eraser' ? '#cc4444' : '#aabbcc',
          backgroundColor: type === '_eraser' ? '#332222' : '#222244',
        });
      }
    });
  }

  drawGrid() {
    this.gridGraphics.clear();

    // Grid area background
    this.gridGraphics.fillStyle(0x1a2244, 1);
    this.gridGraphics.fillRect(
      this.canvasX,
      this.canvasY,
      this.canvasWidth,
      this.canvasHeight
    );

    // Grid lines
    this.gridGraphics.lineStyle(1, 0x223355, 0.3);
    for (let x = this.canvasX; x <= this.canvasX + this.canvasWidth; x += GRID_SIZE) {
      this.gridGraphics.lineBetween(x, this.canvasY, x, this.canvasY + this.canvasHeight);
    }
    for (let y = this.canvasY; y <= this.canvasY + this.canvasHeight; y += GRID_SIZE) {
      this.gridGraphics.lineBetween(this.canvasX, y, this.canvasX + this.canvasWidth, y);
    }

    // Border
    this.gridGraphics.lineStyle(2, 0x4466aa, 0.8);
    this.gridGraphics.strokeRect(
      this.canvasX,
      this.canvasY,
      this.canvasWidth,
      this.canvasHeight
    );

    // Ground line for ski mode
    if (this.editorMode === 'ski') {
      this.gridGraphics.lineStyle(2, 0x88aa88, 0.5);
      const groundY = this.canvasY + this.canvasHeight - GRID_SIZE;
      this.gridGraphics.lineBetween(
        this.canvasX,
        groundY,
        this.canvasX + this.canvasWidth,
        groundY
      );
    }
  }

  redrawObjects() {
    this.objectContainer.removeAll(true);

    this.placedObjects.forEach((obj, i) => {
      const textureKey = SpriteManager.getTextureKey(obj.type);
      const screenX = this.canvasX + obj.x;
      const screenY = this.canvasY + obj.y;

      if (this.textures.exists(textureKey)) {
        const sprite = this.add
          .image(screenX, screenY, textureKey)
          .setScale(1)
          .setDepth(5);
        this.objectContainer.add(sprite);
      } else {
        const rect = this.add
          .rectangle(screenX, screenY, 16, 16, 0xff00ff)
          .setDepth(5);
        this.objectContainer.add(rect);
      }

      // HP label for enemies
      if (obj.hp) {
        const hpLabel = this.add
          .text(screenX, screenY + 16, `HP:${obj.hp}`, {
            fontSize: '8px',
            fontFamily: 'Courier New',
            color: '#ff8888',
          })
          .setOrigin(0.5)
          .setDepth(6);
        this.objectContainer.add(hpLabel);
      }
    });

    // Update count display
    if (this.countText) {
      this.countText.setText(`Objects: ${this.placedObjects.length}`);
    }
  }

  handleCanvasClick(pointer) {
    if (pointer.rightButtonDown()) return;
    if (!this.selectedTool) return;

    const x = pointer.x;
    const y = pointer.y;

    // Check if click is in canvas area
    if (
      x < this.canvasX ||
      x > this.canvasX + this.canvasWidth ||
      y < this.canvasY ||
      y > this.canvasY + this.canvasHeight
    ) {
      return;
    }

    if (this.selectedTool === '_eraser') {
      this.handleDelete(pointer);
      return;
    }

    // Snap to grid
    const gridX =
      Math.floor((x - this.canvasX) / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
    const gridY =
      Math.floor((y - this.canvasY) / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;

    // Create the object
    const newObj = {
      type: this.selectedTool,
      x: gridX,
      y: gridY,
    };

    // Add HP for enemies
    if (this.selectedTool.startsWith('enemy_')) {
      if (this.selectedTool === 'enemy_basic') newObj.hp = 30;
      else if (this.selectedTool === 'enemy_strong') newObj.hp = 60;
      else if (this.selectedTool === 'enemy_boss') newObj.hp = 120;
    }

    this.placedObjects.push(newObj);
    this.redrawObjects();
    this.isDragging = true;
  }

  handleCanvasDrag(pointer) {
    if (!this.isDragging || !this.selectedTool || this.selectedTool === '_eraser') return;
    // Could implement paint-style dragging here
  }

  handleDelete(pointer) {
    const x = pointer.x;
    const y = pointer.y;

    // Find object near click
    const threshold = GRID_SIZE;
    const idx = this.placedObjects.findIndex((obj) => {
      const screenX = this.canvasX + obj.x;
      const screenY = this.canvasY + obj.y;
      return (
        Math.abs(x - screenX) < threshold && Math.abs(y - screenY) < threshold
      );
    });

    if (idx !== -1) {
      this.placedObjects.splice(idx, 1);
      this.redrawObjects();
    }
  }

  createBottomBar() {
    const { width, height } = this.cameras.main;
    const barY = height - 45;

    // Background
    this.add.rectangle(width / 2, barY + 15, width, 50, 0x112233);

    // Object count
    this.countText = this.add.text(
      20,
      barY + 5,
      `Objects: ${this.placedObjects.length}`,
      {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#8899aa',
      }
    );

    const btnStyle = {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      backgroundColor: '#335577',
      padding: { x: 10, y: 5 },
    };

    // Save button
    const saveBtn = this.add
      .text(width - 280, barY + 3, 'SAVE', btnStyle)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.saveLevel());

    // Test button
    const testBtn = this.add
      .text(width - 210, barY + 3, 'TEST', {
        ...btnStyle,
        backgroundColor: '#335544',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.testLevel());

    // Clear button
    const clearBtn = this.add
      .text(width - 140, barY + 3, 'CLEAR', {
        ...btnStyle,
        backgroundColor: '#553333',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.placedObjects = [];
        this.redrawObjects();
      });

    // Rename button
    const renameBtn = this.add
      .text(width - 60, barY + 3, 'NAME', btnStyle)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const name = prompt('Level name:', this.levelName);
        if (name) {
          this.levelName = name;
          this.titleText.setText(`LEVEL EDITOR: ${this.levelName}`);
        }
      });

    // Hover effects
    [saveBtn, testBtn, clearBtn, renameBtn].forEach((btn) => {
      const origColor = btn.style.backgroundColor;
      btn.on('pointerover', () =>
        btn.setStyle({ backgroundColor: '#4477aa' })
      );
      btn.on('pointerout', () =>
        btn.setStyle({ backgroundColor: origColor })
      );
    });
  }

  saveLevel() {
    const levelData = {
      name: this.levelName,
      type: this.editorMode,
      width: this.editorMode === 'ski' ? 3200 : 800,
      height: 600,
    };

    if (this.editorMode === 'ski') {
      levelData.objects = [...this.placedObjects];
    } else {
      levelData.enemies = this.placedObjects.filter((o) =>
        o.type.startsWith('enemy_')
      );
      levelData.objects = this.placedObjects.filter(
        (o) => !o.type.startsWith('enemy_')
      );
    }

    if (this.editingLevelId) {
      LevelManager.updateLevel(this.editingLevelId, levelData);
    } else {
      this.editingLevelId = LevelManager.addLevel(levelData);
    }

    // Visual feedback
    const { width } = this.cameras.main;
    const saved = this.add
      .text(width / 2, 40, 'SAVED!', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#44ff88',
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.tweens.add({
      targets: saved,
      alpha: 0,
      y: 30,
      duration: 1500,
      onComplete: () => saved.destroy(),
    });
  }

  testLevel() {
    // Save first, then launch the appropriate scene
    this.saveLevel();

    if (this.editorMode === 'ski') {
      this.scene.start('SkiPhaseScene', { levelId: this.editingLevelId });
    } else {
      this.scene.start('CombatPhaseScene', {
        levelId: this.editingLevelId,
        weapon: { id: 'fists', name: 'Fists', damage: 8, speed: 1.2, range: 40, qteType: 'mash', spriteKey: 'weapon-fists' },
        skiResults: { score: 0, coins: 0, stars: 0, tricks: 0 },
        bonuses: { bonusHp: 0, bonusDamage: 0, bonusCrit: 0 },
      });
    }
  }
}
