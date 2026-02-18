import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { SoundManager } from '../systems/SoundManager.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const saveData = SaveSystem.load();

    // Background
    this.add
      .tileSprite(0, 0, width, height, 'mountain-bg')
      .setOrigin(0, 0)
      .setTint(0x8899bb);

    // Title
    this.add
      .text(width / 2, 80, "HENRY'S\nSKI COMBAT", {
        fontSize: '48px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        align: 'center',
        stroke: '#223344',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(width / 2, 160, 'Ski. Fight. Win.', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#aaccee',
        align: 'center',
      })
      .setOrigin(0.5);

    // Menu buttons
    const buttonStyle = {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      backgroundColor: '#335577',
      padding: { x: 24, y: 12 },
    };

    const buttons = [
      { text: 'PLAY', y: 250, scene: 'SkiPhaseScene' },
      { text: 'SPRITE LIBRARY', y: 320, scene: 'SpriteLibraryScene' },
      { text: 'LEVEL EDITOR', y: 390, scene: 'LevelEditorScene' },
    ];

    buttons.forEach(({ text, y, scene }) => {
      const btn = this.add
        .text(width / 2, y, text, buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => {
        btn.setStyle({ backgroundColor: '#4477aa' });
        SoundManager.buttonHover();
      });
      btn.on('pointerout', () => {
        btn.setStyle({ backgroundColor: '#335577' });
      });
      btn.on('pointerdown', () => {
        SoundManager.buttonClick();
        this.scene.start(scene);
      });
    });

    // Stats display
    this.add
      .text(
        width / 2,
        500,
        `High Score: ${saveData.highScore}  |  Runs: ${saveData.totalRuns}  |  Weapons: ${saveData.unlockedWeapons.length}`,
        {
          fontSize: '12px',
          fontFamily: 'Courier New',
          color: '#7799bb',
        }
      )
      .setOrigin(0.5);

    // Falling snow effect
    this.snowParticles = [];
    for (let i = 0; i < 50; i++) {
      const snowflake = this.add
        .circle(
          Phaser.Math.Between(0, width),
          Phaser.Math.Between(0, height),
          Phaser.Math.Between(1, 3),
          0xffffff,
          0.6
        );
      this.snowParticles.push({
        obj: snowflake,
        speed: Phaser.Math.FloatBetween(0.3, 1.5),
        drift: Phaser.Math.FloatBetween(-0.3, 0.3),
      });
    }
  }

  update() {
    const { width, height } = this.cameras.main;
    this.snowParticles.forEach((p) => {
      p.obj.y += p.speed;
      p.obj.x += p.drift;
      if (p.obj.y > height) {
        p.obj.y = -5;
        p.obj.x = Phaser.Math.Between(0, width);
      }
      if (p.obj.x < 0) p.obj.x = width;
      if (p.obj.x > width) p.obj.x = 0;
    });
  }
}
