import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem.js';
import { WeaponSystem, WEAPONS } from '../systems/WeaponSystem.js';
import { SoundManager } from '../systems/SoundManager.js';

export class TransitionScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TransitionScene' });
  }

  init(data) {
    this.skiResults = {
      score: data?.score || 0,
      coins: data?.coins || 0,
      stars: data?.stars || 0,
      tricks: data?.tricks || 0,
      potions: data?.potions || 0,
    };
  }

  create() {
    const { width, height } = this.cameras.main;

    // Update save data
    const runCount = SaveSystem.incrementRuns();
    const isNewHigh = SaveSystem.updateHighScore(this.skiResults.score);

    // Check for weapon unlocks
    const updatedSave = SaveSystem.load();
    const newUnlocks = WeaponSystem.checkUnlocks(updatedSave);
    newUnlocks.forEach((w) => SaveSystem.unlockWeapon(w.id));

    this.playerLevel = WeaponSystem.getPlayerLevel(updatedSave.totalRuns);
    const playerLevel = this.playerLevel;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add
      .text(width / 2, 30, 'RUN COMPLETE!', {
        fontSize: '32px',
        fontFamily: 'Courier New',
        color: '#44ee88',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Player Level display
    this.add
      .text(width / 2, 65, `LEVEL ${playerLevel}`, {
        fontSize: '22px',
        fontFamily: 'Courier New',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Next level info
    const nextInfo = WeaponSystem.getNextLevelInfo(playerLevel);
    if (nextInfo) {
      const runsNeeded = nextInfo.runsRequired - updatedSave.totalRuns;
      this.add
        .text(width / 2, 88, `${runsNeeded} more run${runsNeeded !== 1 ? 's' : ''} to Level ${nextInfo.level} — unlocks ${nextInfo.weapon.name}!`, {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#aabbcc',
        })
        .setOrigin(0.5);
    } else {
      this.add
        .text(width / 2, 88, 'MAX LEVEL — All weapons unlocked!', {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#ffee88',
        })
        .setOrigin(0.5);
    }

    // Stats
    const statsStyle = {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffffff',
    };

    const stats = [
      `Score: ${this.skiResults.score}${isNewHigh ? ' NEW HIGH!' : ''}`,
      `Coins: ${this.skiResults.coins}`,
      `Stars: ${this.skiResults.stars}`,
      `Tricks: ${this.skiResults.tricks}`,
      `Potions: ${this.skiResults.potions}`,
      `Total Runs: ${runCount}`,
    ];

    stats.forEach((text, i) => {
      const t = this.add
        .text(width / 2, 115 + i * 26, text, statsStyle)
        .setOrigin(0.5)
        .setAlpha(0);

      this.tweens.add({
        targets: t,
        alpha: 1,
        x: width / 2,
        duration: 400,
        delay: i * 200,
      });
    });

    // New unlock notifications
    const unlockBaseY = 115 + stats.length * 26 + 10;
    if (newUnlocks.length > 0) {
      this.add
        .text(width / 2, unlockBaseY, 'NEW WEAPON UNLOCKED!', {
          fontSize: '20px',
          fontFamily: 'Courier New',
          color: '#ffcc00',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5);

      newUnlocks.forEach((weapon, i) => {
        this.add
          .text(
            width / 2,
            unlockBaseY + 26 + i * 22,
            `${weapon.name}: ${weapon.description}`,
            {
              fontSize: '12px',
              fontFamily: 'Courier New',
              color: '#ffee88',
            }
          )
          .setOrigin(0.5);
      });
    }

    // Weapon selection for combat
    const reloadedSave = SaveSystem.load();
    const availableWeapons = WeaponSystem.getWeaponsForLevel(playerLevel);
    const weaponY = 380;

    this.add
      .text(width / 2, weaponY - 10, 'CHOOSE YOUR WEAPON:', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#aaccee',
      })
      .setOrigin(0.5);

    const weaponSpacing = Math.min(150, (width - 60) / availableWeapons.length);
    const totalWeaponWidth = (availableWeapons.length - 1) * weaponSpacing;
    const weaponStartX = width / 2 - totalWeaponWidth / 2;

    availableWeapons.forEach((weapon, i) => {
      const btnX = weaponStartX + i * weaponSpacing;
      const btnY = weaponY + 40;

      // Weapon icon
      this.add.image(btnX, btnY - 10, weapon.spriteKey).setScale(2);

      // Weapon button
      const btn = this.add
        .text(btnX, btnY + 20, weapon.name, {
          fontSize: '12px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          backgroundColor: '#335577',
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(btnX, btnY + 45, `DMG:${weapon.damage} SPD:${weapon.speed}`, {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#8899aa',
        })
        .setOrigin(0.5);

      // Level badge
      this.add
        .text(btnX, btnY - 30, `Lv${weapon.level}`, {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#ffcc00',
        })
        .setOrigin(0.5);

      btn.on('pointerover', () => {
        btn.setStyle({ backgroundColor: '#4477aa' });
        SoundManager.buttonHover();
      });
      btn.on('pointerout', () =>
        btn.setStyle({ backgroundColor: '#335577' })
      );
      btn.on('pointerdown', () => {
        SoundManager.buttonClick();
        this.startCombat(weapon, this.skiResults);
      });
    });

    // Skip combat button
    this.add
      .text(width / 2, height - 30, 'Skip to Menu', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#667788',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('MainMenuScene');
      });

    // Calculate combat bonuses from ski phase
    this.combatBonuses = {
      bonusHp: this.skiResults.coins * 2,
      bonusDamage: this.skiResults.stars * 5,
      bonusCrit: this.skiResults.tricks * 10,
    };

    // Show bonuses
    const bonusLine = `Combat Bonuses: +${this.combatBonuses.bonusHp} HP | +${this.combatBonuses.bonusDamage} DMG | +${this.combatBonuses.bonusCrit}% Crit`;
    const potionLine = this.skiResults.potions > 0
      ? ` | ${this.skiResults.potions} Potion${this.skiResults.potions > 1 ? 's' : ''}`
      : '';
    this.add
      .text(
        width / 2,
        weaponY + 80,
        bonusLine + potionLine,
        {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#88cc88',
        }
      )
      .setOrigin(0.5);
  }

  startCombat(weapon, skiResults) {
    this.scene.start('CombatPhaseScene', {
      weapon,
      skiResults,
      bonuses: this.combatBonuses,
      playerLevel: this.playerLevel,
    });
  }
}
