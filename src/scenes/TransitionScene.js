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
    const saveData = SaveSystem.load();

    // Update save data
    const runCount = SaveSystem.incrementRuns();
    const isNewHigh = SaveSystem.updateHighScore(this.skiResults.score);

    // Check for weapon unlocks
    const updatedSave = SaveSystem.load();
    const newUnlocks = WeaponSystem.checkUnlocks(updatedSave);
    newUnlocks.forEach((w) => SaveSystem.unlockWeapon(w.id));

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add
      .text(width / 2, 40, 'RUN COMPLETE!', {
        fontSize: '32px',
        fontFamily: 'Courier New',
        color: '#44ee88',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Stats
    const statsStyle = {
      fontSize: '18px',
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
        .text(width / 2, 100 + i * 32, text, statsStyle)
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
    if (newUnlocks.length > 0) {
      const unlockY = 100 + stats.length * 32 + 20;
      this.add
        .text(width / 2, unlockY, 'NEW WEAPON UNLOCKED!', {
          fontSize: '22px',
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
            unlockY + 30 + i * 24,
            `${weapon.name}: ${weapon.description}`,
            {
              fontSize: '14px',
              fontFamily: 'Courier New',
              color: '#ffee88',
            }
          )
          .setOrigin(0.5);
      });
    }

    // Weapon selection for combat
    const reloadedSave = SaveSystem.load();
    const weaponY = 380;

    this.add
      .text(width / 2, weaponY, 'CHOOSE YOUR WEAPON:', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#aaccee',
      })
      .setOrigin(0.5);

    let weaponIndex = 0;
    reloadedSave.unlockedWeapons.forEach((weaponId) => {
      const weapon = WeaponSystem.getWeapon(weaponId);
      if (!weapon) return;

      const btnX = 120 + weaponIndex * 180;
      const btnY = weaponY + 60;

      // Weapon icon
      this.add.image(btnX, btnY - 10, weapon.spriteKey).setScale(2);

      // Weapon button
      const btn = this.add
        .text(btnX, btnY + 20, weapon.name, {
          fontSize: '14px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          backgroundColor: '#335577',
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      const desc = this.add
        .text(btnX, btnY + 50, `DMG:${weapon.damage} SPD:${weapon.speed}`, {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#8899aa',
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

      weaponIndex++;
    });

    // Skip combat button
    this.add
      .text(width / 2, height - 40, 'Skip to Menu', {
        fontSize: '14px',
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
        weaponY + 100,
        bonusLine + potionLine,
        {
          fontSize: '12px',
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
    });
  }
}
