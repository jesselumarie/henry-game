import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.result = data?.result || 'defeat';
    this.skiResults = data?.skiResults || {};
    this.turnsUsed = data?.turnsUsed || 0;
    this.hpRemaining = data?.hpRemaining || 0;
  }

  create() {
    const { width, height } = this.cameras.main;
    const isVictory = this.result === 'victory';

    // Background
    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      isVictory ? 0x112233 : 0x331111
    );

    // Title
    this.add
      .text(width / 2, 100, isVictory ? 'YOU WIN!' : 'DEFEATED', {
        fontSize: '48px',
        fontFamily: 'Courier New',
        color: isVictory ? '#44ff88' : '#ff4444',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Summary
    const summaryLines = [`Ski Score: ${this.skiResults.score || 0}`];
    if (isVictory) {
      summaryLines.push(`Turns Used: ${this.turnsUsed}`);
      summaryLines.push(`HP Remaining: ${this.hpRemaining}`);
      const combatBonus = Math.max(0, 500 - this.turnsUsed * 50) + this.hpRemaining;
      summaryLines.push(`Combat Bonus: ${combatBonus}`);
      summaryLines.push(
        `TOTAL: ${(this.skiResults.score || 0) + combatBonus}`
      );
    } else {
      summaryLines.push('Better luck next time!');
    }

    summaryLines.forEach((line, i) => {
      this.add
        .text(width / 2, 200 + i * 30, line, {
          fontSize: '18px',
          fontFamily: 'Courier New',
          color: '#ffffff',
        })
        .setOrigin(0.5);
    });

    // Buttons
    const btnStyle = {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      backgroundColor: '#335577',
      padding: { x: 24, y: 12 },
    };

    const playAgain = this.add
      .text(width / 2, 420, 'PLAY AGAIN', btnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playAgain.on('pointerover', () => {
      playAgain.setStyle({ backgroundColor: '#4477aa' });
      SoundManager.buttonHover();
    });
    playAgain.on('pointerout', () =>
      playAgain.setStyle({ backgroundColor: '#335577' })
    );
    playAgain.on('pointerdown', () => {
      SoundManager.buttonClick();
      this.scene.start('SkiPhaseScene');
    });

    const mainMenu = this.add
      .text(width / 2, 480, 'MAIN MENU', {
        ...btnStyle,
        backgroundColor: '#553355',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    mainMenu.on('pointerover', () => {
      mainMenu.setStyle({ backgroundColor: '#774477' });
      SoundManager.buttonHover();
    });
    mainMenu.on('pointerout', () =>
      mainMenu.setStyle({ backgroundColor: '#553355' })
    );
    mainMenu.on('pointerdown', () => {
      SoundManager.buttonClick();
      this.scene.start('MainMenuScene');
    });
  }
}
