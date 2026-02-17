import Phaser from 'phaser';
import { LevelManager, DEFAULT_SKI_LEVEL } from '../systems/LevelManager.js';
import { SpriteManager } from '../systems/SpriteManager.js';

export class SkiPhaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SkiPhaseScene' });
  }

  init(data) {
    this.levelId = data?.levelId || 'default-ski';
    this.score = 0;
    this.coins = 0;
    this.stars = 0;
    this.tricks = 0;
    this.isAirborne = false;
    this.trickRotation = 0;
    this.gameOver = false;
  }

  create() {
    const level = LevelManager.getLevel(this.levelId) || DEFAULT_SKI_LEVEL;
    const { width, height } = this.cameras.main;

    // Set world bounds to level width
    this.physics.world.setBounds(0, 0, level.width, height);

    // Background layers (parallax)
    this.skyBg = this.add
      .tileSprite(0, 0, width, height, 'sky-bg')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-10);

    this.mountainBg = this.add
      .tileSprite(0, 0, width, height, 'mountain-bg')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-5);

    // Snow ground
    for (let x = 0; x < level.width; x += 32) {
      this.add
        .image(x, height - 32, 'snow-ground')
        .setOrigin(0, 0)
        .setDepth(0);
    }

    // Slope line (visual ski slope angle)
    const slopeGraphics = this.add.graphics();
    slopeGraphics.lineStyle(2, 0xccddee, 0.3);
    slopeGraphics.lineBetween(0, height - 64, level.width, height - 64);
    slopeGraphics.setDepth(0);

    // Player
    const playerKey = SpriteManager.getTextureKey('player');
    this.player = this.physics.add.sprite(100, height - 100, playerKey);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.player.body.setSize(20, 28);

    // Auto-scroll speed (skiing right)
    this.skiSpeed = 200;
    this.player.body.setVelocityX(this.skiSpeed);

    // Obstacle group
    this.obstacles = this.physics.add.staticGroup();

    // Collectible groups
    this.coinGroup = this.physics.add.staticGroup();
    this.starGroup = this.physics.add.staticGroup();
    this.rampGroup = this.physics.add.staticGroup();

    // Spawn level objects
    level.objects.forEach((obj) => {
      const textureKey = SpriteManager.getTextureKey(obj.type);
      if (obj.type.startsWith('obstacle_')) {
        const obstacle = this.obstacles.create(obj.x, obj.y, textureKey);
        obstacle.setDepth(3);
      } else if (obj.type === 'collectible_coin') {
        const coin = this.coinGroup.create(obj.x, obj.y, textureKey);
        coin.setDepth(3);
      } else if (obj.type === 'collectible_star') {
        const star = this.starGroup.create(obj.x, obj.y, textureKey);
        star.setDepth(3);
      } else if (obj.type === 'ramp') {
        const ramp = this.rampGroup.create(obj.x, obj.y, textureKey);
        ramp.setDepth(3);
      }
    });

    // Collisions
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      this.hitObstacle,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.coinGroup,
      this.collectCoin,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.starGroup,
      this.collectStar,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.rampGroup,
      this.hitRamp,
      null,
      this
    );

    // Camera follows player
    this.cameras.main.setBounds(0, 0, level.width, height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // HUD
    this.scoreText = this.add
      .text(16, 16, 'Score: 0', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.coinText = this.add
      .text(16, 40, 'Coins: 0', {
        fontSize: '14px',
        fontFamily: 'Courier New',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.statusText = this.add
      .text(width / 2, 50, '', {
        fontSize: '24px',
        fontFamily: 'Courier New',
        color: '#ffee00',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);

    // Finish line
    this.finishX = level.width - 100;
    const finishLine = this.add.graphics();
    finishLine.lineStyle(4, 0xff4444, 1);
    finishLine.lineBetween(this.finishX, 0, this.finishX, height);
    finishLine.setDepth(2);

    this.add
      .text(this.finishX, 30, 'FINISH', {
        fontSize: '16px',
        fontFamily: 'Courier New',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Level progress
    this.levelWidth = level.width;
  }

  update() {
    if (this.gameOver) return;

    // Player movement (vertical only, horizontal is auto-scroll)
    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-180);
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(180);
    } else {
      this.player.body.setVelocityY(0);
    }

    // Speed boost / brake
    if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(this.skiSpeed * 1.5);
    } else if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(this.skiSpeed * 0.5);
    } else {
      this.player.body.setVelocityX(this.skiSpeed);
    }

    // Trick while airborne
    if (this.isAirborne && this.spaceKey.isDown) {
      this.trickRotation += 5;
      this.player.setAngle(this.trickRotation);
      if (this.trickRotation >= 360) {
        this.tricks++;
        this.score += 100;
        this.trickRotation = 0;
        this.player.setAngle(0);
        this.showStatus('TRICK! +100');
      }
    }

    // Parallax scrolling
    this.skyBg.tilePositionX = this.cameras.main.scrollX * 0.1;
    this.mountainBg.tilePositionX = this.cameras.main.scrollX * 0.3;

    // Check finish
    if (this.player.x >= this.finishX) {
      this.finishRun();
    }

    // Update HUD
    this.scoreText.setText(`Score: ${this.score}`);
    this.coinText.setText(`Coins: ${this.coins}  Stars: ${this.stars}`);
  }

  hitObstacle(player, obstacle) {
    if (this.isAirborne) return; // jump over obstacles

    this.score = Math.max(0, this.score - 50);
    this.showStatus('OUCH! -50');

    // Knockback
    player.body.setVelocityX(-100);
    this.time.delayedCall(300, () => {
      if (!this.gameOver) {
        player.body.setVelocityX(this.skiSpeed);
      }
    });

    // Flash red
    player.setTint(0xff0000);
    this.time.delayedCall(200, () => player.clearTint());
  }

  collectCoin(player, coin) {
    coin.destroy();
    this.coins++;
    this.score += 25;
    this.showStatus('+25');
  }

  collectStar(player, star) {
    star.destroy();
    this.stars++;
    this.score += 75;
    this.showStatus('STAR! +75');
  }

  hitRamp(player, ramp) {
    if (this.isAirborne) return;
    this.isAirborne = true;
    this.trickRotation = 0;
    this.showStatus('AIRBORNE! Press SPACE for tricks!');

    // Jump effect
    player.body.setVelocityY(-200);
    this.time.delayedCall(1500, () => {
      this.isAirborne = false;
      player.setAngle(0);
      player.body.setVelocityY(0);
    });
  }

  showStatus(text) {
    this.statusText.setText(text);
    this.statusText.setAlpha(1);
    this.tweens.add({
      targets: this.statusText,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
    });
  }

  finishRun() {
    if (this.gameOver) return;
    this.gameOver = true;

    this.player.body.setVelocity(0, 0);
    this.showStatus('FINISH!');

    this.time.delayedCall(1500, () => {
      this.scene.start('TransitionScene', {
        score: this.score,
        coins: this.coins,
        stars: this.stars,
        tricks: this.tricks,
      });
    });
  }
}
