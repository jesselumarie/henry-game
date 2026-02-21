import Phaser from 'phaser';
import {
  LevelManager,
  DEFAULT_COMBAT_LEVEL,
} from '../systems/LevelManager.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { SpriteManager } from '../systems/SpriteManager.js';
import { SoundManager } from '../systems/SoundManager.js';

const COMBAT_STATES = {
  PLAYER_TURN: 'player_turn',
  QTE_ACTIVE: 'qte_active',
  ENEMY_TURN: 'enemy_turn',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
};

export class CombatPhaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombatPhaseScene' });
  }

  init(data) {
    this.weapon = data?.weapon || WeaponSystem.getWeapon('fists');
    this.skiResults = data?.skiResults || { score: 0, coins: 0, stars: 0, tricks: 0 };
    this.bonuses = data?.bonuses || { bonusHp: 0, bonusDamage: 0, bonusCrit: 0 };

    this.potions = data?.skiResults?.potions || 0;
    this.playerHp = 100 + this.bonuses.bonusHp;
    this.playerMaxHp = this.playerHp;
    this.combatState = COMBAT_STATES.PLAYER_TURN;
    this.currentEnemyIndex = 0;
    this.qteResult = 0;
    this.turnCount = 0;
    this.defendMultiplier = 1;
  }

  create() {
    const { width, height } = this.cameras.main;
    const level = DEFAULT_COMBAT_LEVEL;

    // Background
    this.add
      .tileSprite(0, 0, width, height, 'arena-bg')
      .setOrigin(0, 0);

    // Arena label
    this.add
      .text(width / 2, 20, level.name.toUpperCase(), {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#aabbcc',
      })
      .setOrigin(0.5);

    // Player sprite
    const playerKey = SpriteManager.getTextureKey('player');
    this.playerSprite = this.add
      .image(150, height - 150, playerKey)
      .setScale(3)
      .setDepth(5);

    // Weapon display
    this.add.image(150, height - 200, this.weapon.spriteKey).setScale(2);
    this.add
      .text(150, height - 230, this.weapon.name, {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#ffcc00',
      })
      .setOrigin(0.5);

    // Enemies
    this.enemies = level.enemies.map((enemyData, i) => {
      const textureKey = SpriteManager.getTextureKey(enemyData.type);
      const sprite = this.add
        .image(500 + i * 100, height - 150, textureKey)
        .setScale(3)
        .setDepth(5);

      return {
        ...enemyData,
        sprite,
        currentHp: enemyData.hp,
        maxHp: enemyData.hp,
        alive: true,
      };
    });

    // HP bars
    this.playerHpBar = this.createHpBar(50, height - 80, 180, this.playerHp, this.playerMaxHp, 0x44cc44);
    this.enemyHpBars = this.enemies.map((enemy, i) => {
      return this.createHpBar(
        440 + i * 100,
        height - 80,
        80,
        enemy.currentHp,
        enemy.maxHp,
        0xcc4444
      );
    });

    // Combat log
    this.logText = this.add
      .text(width / 2, 60, 'Choose your action!', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5);

    // Action buttons
    this.actionButtons = [];
    this.createActionButtons();

    // QTE area (hidden initially)
    this.qteContainer = this.add.container(width / 2, height / 2).setVisible(false).setDepth(50);

    // Player HP label
    this.add
      .text(140, height - 100, 'YOU', {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#44cc44',
      })
      .setOrigin(0.5);
  }

  createHpBar(x, y, barWidth, current, max, color) {
    const bgBar = this.add.rectangle(x, y, barWidth, 12, 0x333333).setOrigin(0, 0.5);
    const fillWidth = (current / max) * barWidth;
    const fillBar = this.add.rectangle(x, y, fillWidth, 12, color).setOrigin(0, 0.5);
    const label = this.add
      .text(x + barWidth / 2, y, `${current}/${max}`, {
        fontSize: '10px',
        fontFamily: 'Courier New',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    return { bgBar, fillBar, label, barWidth, color };
  }

  updateHpBar(hpBar, current, max) {
    const fillWidth = Math.max(0, (current / max) * hpBar.barWidth);
    hpBar.fillBar.width = fillWidth;
    hpBar.label.setText(`${Math.max(0, current)}/${max}`);
  }

  createActionButtons() {
    const { width, height } = this.cameras.main;
    const actions = [
      { text: 'ATTACK', action: () => this.startAttack() },
      { text: 'DEFEND', action: () => this.defend() },
      { text: 'SPECIAL', action: () => this.specialAttack() },
      { text: `POTION (${this.potions})`, action: () => this.usePotion(), color: '#553535' },
    ];

    actions.forEach((act, i) => {
      const bgColor = act.color || '#335577';
      const btn = this.add
        .text(100 + i * 160, height - 30, act.text, {
          fontSize: '14px',
          fontFamily: 'Courier New',
          color: '#ffffff',
          backgroundColor: bgColor,
          padding: { x: 12, y: 8 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(10);

      btn.on('pointerover', () => {
        btn.setStyle({ backgroundColor: '#4477aa' });
        SoundManager.buttonHover();
      });
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: bgColor }));
      btn.on('pointerdown', () => {
        SoundManager.buttonClick();
        act.action();
      });

      this.actionButtons.push(btn);
    });

    // Disable potion button if no potions
    if (this.potions <= 0) {
      const potionBtn = this.actionButtons[3];
      potionBtn.setAlpha(0.4);
      potionBtn.disableInteractive();
    }
  }

  setButtonsEnabled(enabled) {
    this.actionButtons.forEach((btn, i) => {
      if (i === 3 && this.potions <= 0) {
        // Keep potion button disabled if no potions left
        btn.disableInteractive();
        btn.setAlpha(0.4);
        return;
      }
      if (enabled) {
        btn.setInteractive({ useHandCursor: true });
        btn.setAlpha(1);
      } else {
        btn.disableInteractive();
        btn.setAlpha(0.4);
      }
    });
  }

  updatePotionButton() {
    const potionBtn = this.actionButtons[3];
    if (potionBtn) {
      potionBtn.setText(`POTION (${this.potions})`);
      if (this.potions <= 0) {
        potionBtn.setAlpha(0.4);
        potionBtn.disableInteractive();
      }
    }
  }

  getCurrentEnemy() {
    return this.enemies.find((e) => e.alive);
  }

  startAttack() {
    if (this.combatState !== COMBAT_STATES.PLAYER_TURN) return;
    this.combatState = COMBAT_STATES.QTE_ACTIVE;
    this.setButtonsEnabled(false);
    this.startQTE();
  }

  startQTE() {
    const { width, height } = this.cameras.main;
    this.qteContainer.setVisible(true);
    this.qteContainer.removeAll(true);

    const qteType = this.weapon.qteType;

    if (qteType === 'mash') {
      this.runMashQTE();
    } else if (qteType === 'timing') {
      this.runTimingQTE();
    } else if (qteType === 'sequence') {
      this.runSequenceQTE();
    } else if (qteType === 'aim') {
      this.runTimingQTE(); // fallback to timing for now
    } else {
      this.runMashQTE();
    }
  }

  runMashQTE() {
    // Mash SPACE as fast as you can in 3 seconds
    let presses = 0;
    const maxPresses = 20;
    const duration = 3000;

    const bg = this.add.rectangle(0, 0, 300, 140, 0x000000, 0.8);
    const label = this.add
      .text(0, -50, 'MASH SPACE!', {
        fontSize: '20px',
        fontFamily: 'Courier New',
        color: '#ffee00',
      })
      .setOrigin(0.5);
    const counter = this.add
      .text(0, -10, `${presses}/${maxPresses}`, {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    const bonusText = this.add
      .text(0, 20, '', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ff4444',
      })
      .setOrigin(0.5);
    const timerText = this.add
      .text(0, 45, '3.0s', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.qteContainer.add([bg, label, counter, bonusText, timerText]);

    const startTime = Date.now();
    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const handler = () => {
      presses++;
      counter.setText(`${presses}/${maxPresses}`);
      SoundManager.qteMash();

      // Show bonus indicator when exceeding the base target
      if (presses > maxPresses) {
        const bonusCount = presses - maxPresses;
        bonusText.setText(`BONUS! +${bonusCount}`);
        bonusText.setColor('#ff4444');
        counter.setColor('#ff4444');
      }
    };

    spaceKey.on('down', handler);

    const timer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, (duration - elapsed) / 1000);
        timerText.setText(`${remaining.toFixed(1)}s`);

        if (elapsed >= duration) {
          timer.remove();
          spaceKey.off('down', handler);
          // No cap — mashing beyond 20 gives extra damage
          const score = presses / maxPresses;
          this.finishQTE(score);
        }
      },
    });
  }

  runTimingQTE() {
    // Hit SPACE when the marker is in the sweet spot
    const bg = this.add.rectangle(0, 0, 400, 100, 0x000000, 0.8);
    const label = this.add
      .text(0, -35, 'HIT SPACE IN THE GREEN ZONE!', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffee00',
      })
      .setOrigin(0.5);

    // Timing bar
    const barBg = this.add.rectangle(0, 10, 300, 20, 0x333333);
    const sweetSpot = this.add.rectangle(60, 10, 60, 20, 0x44cc44, 0.6);
    const marker = this.add.rectangle(-150, 10, 6, 24, 0xffffff);

    this.qteContainer.add([bg, label, barBg, sweetSpot, marker]);

    let markerX = -150;
    const speed = 4;
    let done = false;

    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const handler = () => {
      if (done) return;
      done = true;
      // Check if marker is in sweet spot (30 to 90 on the bar)
      const dist = Math.abs(markerX - 60);
      const score = Math.max(0, 1 - dist / 100);
      this.finishQTE(score);
    };

    spaceKey.once('down', handler);

    const timer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (done) {
          timer.remove();
          return;
        }
        markerX += speed;
        marker.x = markerX;
        if (markerX > 150) {
          done = true;
          timer.remove();
          spaceKey.off('down', handler);
          this.finishQTE(0);
        }
      },
    });
  }

  runSequenceQTE() {
    // Press the correct sequence of keys
    const keys = ['A', 'S', 'D', 'W'];
    const sequence = [];
    for (let i = 0; i < 4; i++) {
      sequence.push(keys[Phaser.Math.Between(0, keys.length - 1)]);
    }

    const bg = this.add.rectangle(0, 0, 350, 120, 0x000000, 0.8);
    const label = this.add
      .text(0, -40, 'TYPE THE SEQUENCE!', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ffee00',
      })
      .setOrigin(0.5);
    const seqDisplay = this.add
      .text(0, 0, sequence.join('  '), {
        fontSize: '28px',
        fontFamily: 'Courier New',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    const timerText = this.add
      .text(0, 35, '4.0s', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.qteContainer.add([bg, label, seqDisplay, timerText]);

    let currentIdx = 0;
    const startTime = Date.now();
    const duration = 4000;

    const keyHandler = (event) => {
      if (currentIdx >= sequence.length) return;
      if (event.key.toUpperCase() === sequence[currentIdx]) {
        currentIdx++;
        // Update display to show progress
        const display = sequence
          .map((k, i) => (i < currentIdx ? '.' : k))
          .join('  ');
        seqDisplay.setText(display);

        if (currentIdx >= sequence.length) {
          this.input.keyboard.off('keydown', keyHandler);
          timer.remove();
          const elapsed = Date.now() - startTime;
          const score = Math.max(0.3, 1 - elapsed / duration);
          this.finishQTE(score);
        }
      }
    };

    this.input.keyboard.on('keydown', keyHandler);

    const timer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, (duration - elapsed) / 1000);
        timerText.setText(`${remaining.toFixed(1)}s`);

        if (elapsed >= duration) {
          timer.remove();
          this.input.keyboard.off('keydown', keyHandler);
          const score = currentIdx / sequence.length;
          this.finishQTE(score * 0.5);
        }
      },
    });
  }

  finishQTE(score) {
    this.qteContainer.setVisible(false);
    this.qteResult = score;

    const enemy = this.getCurrentEnemy();
    if (!enemy) {
      this.checkVictory();
      return;
    }

    // Calculate and apply damage
    const baseDamage = WeaponSystem.calculateDamage(this.weapon, score);
    const totalDamage = baseDamage + this.bonuses.bonusDamage;

    // Crit check
    const critRoll = Math.random() * 100;
    const isCrit = critRoll < this.bonuses.bonusCrit;
    const finalDamage = isCrit ? totalDamage * 2 : totalDamage;

    enemy.currentHp -= finalDamage;

    // Update HP bar
    const enemyIdx = this.enemies.indexOf(enemy);
    this.updateHpBar(this.enemyHpBars[enemyIdx], enemy.currentHp, enemy.maxHp);

    // Visual feedback
    const qualityText =
      score > 1.0 ? 'INSANE!!' : score > 0.8 ? 'PERFECT!' : score > 0.5 ? 'GOOD!' : score > 0.2 ? 'OK' : 'MISS...';
    this.logText.setText(
      `${qualityText} ${finalDamage} damage!${isCrit ? ' CRITICAL HIT!' : ''}`
    );

    if (score > 0.2) {
      isCrit ? SoundManager.criticalHit() : SoundManager.attackHit();
    } else {
      SoundManager.qteFail();
    }

    // Flash enemy
    enemy.sprite.setTint(0xffffff);
    this.time.delayedCall(200, () => {
      if (enemy.alive) enemy.sprite.clearTint();
    });

    // Check if enemy is dead
    if (enemy.currentHp <= 0) {
      enemy.alive = false;
      SoundManager.enemyDeath();
      this.tweens.add({
        targets: enemy.sprite,
        alpha: 0,
        angle: 45,
        duration: 500,
      });
    }

    // Next: enemy turn or victory
    this.time.delayedCall(1000, () => {
      if (this.checkVictory()) return;
      this.enemyTurn();
    });
  }

  defend() {
    if (this.combatState !== COMBAT_STATES.PLAYER_TURN) return;
    this.combatState = COMBAT_STATES.QTE_ACTIVE;
    this.setButtonsEnabled(false);
    this.isDefending = true;
    SoundManager.defend();
    this.runDefendQTE();
  }

  runDefendQTE() {
    this.qteContainer.setVisible(true);
    this.qteContainer.removeAll(true);

    const bg = this.add.rectangle(0, 0, 400, 100, 0x000000, 0.8);
    const label = this.add
      .text(0, -35, 'HIT SPACE IN THE BLUE ZONE!', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#44aaff',
      })
      .setOrigin(0.5);

    // Timing bar
    const barBg = this.add.rectangle(0, 10, 300, 20, 0x333333);
    const sweetSpot = this.add.rectangle(0, 10, 60, 20, 0x4488ff, 0.6);
    const marker = this.add.rectangle(-150, 10, 6, 24, 0xffffff);

    this.qteContainer.add([bg, label, barBg, sweetSpot, marker]);

    let markerX = -150;
    const speed = 4;
    let done = false;

    const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const handler = () => {
      if (done) return;
      done = true;
      // Center of sweet spot is at x=0, bar spans -150 to 150
      const dist = Math.abs(markerX);
      // Score: 1.0 at center, 0.0 at edges (150px away)
      const score = Math.max(0, 1 - dist / 150);
      this.finishDefendQTE(score);
    };

    spaceKey.once('down', handler);

    const timer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (done) {
          timer.remove();
          return;
        }
        markerX += speed;
        marker.x = markerX;
        if (markerX > 150) {
          done = true;
          timer.remove();
          spaceKey.off('down', handler);
          this.finishDefendQTE(0);
        }
      },
    });
  }

  finishDefendQTE(score) {
    this.qteContainer.setVisible(false);

    // Damage reduction: 0% at edges (score=0) to 70% at center (score=1)
    const reduction = Math.round(score * 70);
    this.defendMultiplier = 1 - (score * 0.7);

    const qualityText =
      score > 0.9 ? 'PERFECT BLOCK!' :
      score > 0.6 ? 'GREAT BLOCK!' :
      score > 0.3 ? 'OK BLOCK' :
      'WEAK BLOCK...';

    this.logText.setText(`${qualityText} Damage reduced by ${reduction}%`);

    this.time.delayedCall(800, () => {
      this.enemyTurn();
    });
  }

  specialAttack() {
    if (this.combatState !== COMBAT_STATES.PLAYER_TURN) return;

    // Special costs 20 HP but deals big damage
    if (this.playerHp <= 20) {
      this.logText.setText('Not enough HP for special! (Need >20)');
      return;
    }

    this.playerHp -= 20;
    this.updateHpBar(this.playerHpBar, this.playerHp, this.playerMaxHp);

    const enemy = this.getCurrentEnemy();
    if (!enemy) return;

    const damage = Math.round(this.weapon.damage * 2.5) + this.bonuses.bonusDamage;
    enemy.currentHp -= damage;

    const enemyIdx = this.enemies.indexOf(enemy);
    this.updateHpBar(this.enemyHpBars[enemyIdx], enemy.currentHp, enemy.maxHp);

    this.logText.setText(`SPECIAL ATTACK! ${damage} damage! (-20 HP)`);
    SoundManager.specialAttack();

    enemy.sprite.setTint(0xff4444);
    this.time.delayedCall(300, () => {
      if (enemy.alive) enemy.sprite.clearTint();
    });

    if (enemy.currentHp <= 0) {
      enemy.alive = false;
      SoundManager.enemyDeath();
      this.tweens.add({
        targets: enemy.sprite,
        alpha: 0,
        angle: 45,
        duration: 500,
      });
    }

    this.setButtonsEnabled(false);
    this.time.delayedCall(1000, () => {
      if (this.checkVictory()) return;
      this.enemyTurn();
    });
  }

  usePotion() {
    if (this.combatState !== COMBAT_STATES.PLAYER_TURN) return;
    if (this.potions <= 0) {
      this.logText.setText('No potions left!');
      return;
    }

    this.potions--;
    const healAmount = 30;
    const oldHp = this.playerHp;
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + healAmount);
    const actualHeal = this.playerHp - oldHp;
    this.updateHpBar(this.playerHpBar, this.playerHp, this.playerMaxHp);
    this.updatePotionButton();

    this.logText.setText(`Used potion! +${actualHeal} HP (${this.potions} left)`);
    SoundManager.usePotion();

    // Green flash on player
    this.playerSprite.setTint(0x44ff44);
    this.time.delayedCall(400, () => this.playerSprite.clearTint());

    // Using a potion takes your turn
    this.setButtonsEnabled(false);
    this.time.delayedCall(1000, () => {
      this.enemyTurn();
    });
  }

  enemyTurn() {
    this.combatState = COMBAT_STATES.ENEMY_TURN;

    const aliveEnemies = this.enemies.filter((e) => e.alive);
    if (aliveEnemies.length === 0) {
      this.checkVictory();
      return;
    }

    let totalDamage = 0;
    aliveEnemies.forEach((enemy) => {
      let dmg = Phaser.Math.Between(5, 15);
      if (enemy.type === 'enemy_strong') dmg = Phaser.Math.Between(10, 25);
      if (this.isDefending) dmg = Math.round(dmg * this.defendMultiplier);
      totalDamage += dmg;

      // Visual: enemy "attacks"
      this.tweens.add({
        targets: enemy.sprite,
        x: enemy.sprite.x - 30,
        duration: 150,
        yoyo: true,
      });
    });

    this.playerHp -= totalDamage;
    this.updateHpBar(this.playerHpBar, this.playerHp, this.playerMaxHp);
    this.isDefending = false;
    this.defendMultiplier = 1;

    this.logText.setText(`Enemies attack for ${totalDamage} damage!`);
    SoundManager.enemyAttack();
    this.time.delayedCall(150, () => SoundManager.playerHurt());

    // Flash player
    this.playerSprite.setTint(0xff4444);
    this.time.delayedCall(300, () => this.playerSprite.clearTint());

    // Check defeat
    if (this.playerHp <= 0) {
      this.combatState = COMBAT_STATES.DEFEAT;
      SoundManager.defeat();
      this.time.delayedCall(1000, () => {
        this.scene.start('GameOverScene', {
          result: 'defeat',
          skiResults: this.skiResults,
        });
      });
      return;
    }

    // Back to player turn
    this.time.delayedCall(1200, () => {
      this.combatState = COMBAT_STATES.PLAYER_TURN;
      this.setButtonsEnabled(true);
      this.turnCount++;
      this.logText.setText(`Turn ${this.turnCount + 1} - Choose your action!`);
    });
  }

  checkVictory() {
    const allDead = this.enemies.every((e) => !e.alive);
    if (allDead) {
      this.combatState = COMBAT_STATES.VICTORY;
      this.logText.setText('VICTORY!');
      this.setButtonsEnabled(false);
      SoundManager.victory();

      this.time.delayedCall(2000, () => {
        this.scene.start('GameOverScene', {
          result: 'victory',
          skiResults: this.skiResults,
          turnsUsed: this.turnCount,
          hpRemaining: this.playerHp,
        });
      });
      return true;
    }
    return false;
  }
}
