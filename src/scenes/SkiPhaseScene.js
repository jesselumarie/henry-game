import Phaser from 'phaser';
import { LevelManager, DEFAULT_SKI_LEVEL } from '../systems/LevelManager.js';
import { SpriteManager } from '../systems/SpriteManager.js';
import { SoundManager } from '../systems/SoundManager.js';

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
    this.potions = 0;
    this.isAirborne = false;
    this.trickRotation = 0;
    this.gameOver = false;
  }

  create() {
    const level = LevelManager.getLevel(this.levelId) || DEFAULT_SKI_LEVEL;
    const { width, height } = this.cameras.main;

    // Slope configuration
    this.slopeRatio = 0.2; // drop 0.2px for every 1px of horizontal travel
    const slopeDrop = level.width * this.slopeRatio;
    const worldHeight = height + slopeDrop + 200;
    this.downhillAngle = 12; // visual tilt in degrees

    // Lane system — player steers across the slope, not free-flying
    this.laneOffset = 0;        // current offset from slope center (negative = uphill, positive = downhill)
    this.laneRange = 120;       // max pixels the player can steer from the slope center
    this.laneSpeed = 200;       // how fast the player can steer between lanes (px/s)

    // Airborne physics
    this.verticalVelocity = 0;  // current vertical speed (negative = going up)
    this.gravity = 600;         // gravity pull (px/s^2)
    this.airOffset = 0;         // how far above the slope surface the player is

    // Set world bounds to accommodate the slope
    this.physics.world.setBounds(0, 0, level.width, worldHeight);

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

    // Snow ground tiles along the slope
    for (let x = 0; x < level.width; x += 32) {
      const groundY = height - 64 + this.getSlopeY(x);
      // Ground surface and fill below
      for (let y = groundY; y < worldHeight; y += 32) {
        this.add
          .image(x, y, 'snow-ground')
          .setOrigin(0, 0)
          .setDepth(0);
      }
    }

    // Slope line (visual ski slope angle)
    const slopeGraphics = this.add.graphics();
    slopeGraphics.lineStyle(2, 0xccddee, 0.3);
    slopeGraphics.lineBetween(0, height - 64, level.width, height - 64 + slopeDrop);
    slopeGraphics.setDepth(0);

    // Diagonal slope marks for visual speed/direction cues
    const slopeMarks = this.add.graphics();
    slopeMarks.lineStyle(1, 0xddeeff, 0.15);
    for (let x = 0; x < level.width; x += 80) {
      const markY = height - 80 + this.getSlopeY(x);
      slopeMarks.lineBetween(x, markY, x + 40, markY + 8);
    }
    slopeMarks.setDepth(1);

    // Player
    const playerKey = SpriteManager.getTextureKey('player');
    const playerStartY = this.getSlopeSurfaceY(100);
    this.player = this.physics.add.sprite(100, playerStartY, playerKey);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.player.body.setSize(20, 28);
    this.player.setAngle(this.downhillAngle);

    // Disable gravity on the physics body — we handle it ourselves
    this.player.body.setAllowGravity(false);

    // Auto-scroll speed (skiing downhill)
    this.skiSpeed = 200;
    this.player.body.setVelocityX(this.skiSpeed);

    // Obstacle group
    this.obstacles = this.physics.add.staticGroup();

    // Collectible groups
    this.coinGroup = this.physics.add.staticGroup();
    this.starGroup = this.physics.add.staticGroup();
    this.rampGroup = this.physics.add.staticGroup();
    this.potionGroup = this.physics.add.staticGroup();

    // Spawn level objects — positioned relative to slope surface
    // obj.y is a lane offset: 0 = slope center, negative = uphill, positive = downhill
    level.objects.forEach((obj) => {
      const textureKey = SpriteManager.getTextureKey(obj.type);
      const isGroundObject = obj.type.startsWith('obstacle_') || obj.type === 'ramp';

      if (isGroundObject) {
        // Ground objects sit on the snow with their base on the surface
        const snowY = this.getSnowSurfaceY(obj.x);
        const adjustedY = snowY + obj.y;

        if (obj.type.startsWith('obstacle_')) {
          const obstacle = this.obstacles.create(obj.x, adjustedY, textureKey);
          obstacle.setOrigin(0.5, 1);
          obstacle.refreshBody();
          obstacle.setDepth(3);
        } else {
          const ramp = this.rampGroup.create(obj.x, adjustedY, textureKey);
          ramp.setOrigin(0.5, 1);
          ramp.refreshBody();
          ramp.setDepth(3);
        }
      } else {
        // Collectibles float at the player's ride height
        const rideY = this.getSlopeSurfaceY(obj.x);
        const adjustedY = rideY + obj.y;

        if (obj.type === 'collectible_coin') {
          const coin = this.coinGroup.create(obj.x, adjustedY, textureKey);
          coin.setDepth(3);
        } else if (obj.type === 'collectible_star') {
          const star = this.starGroup.create(obj.x, adjustedY, textureKey);
          star.setDepth(3);
        } else if (obj.type === 'collectible_potion') {
          const potion = this.potionGroup.create(obj.x, adjustedY, textureKey);
          potion.setDepth(3);
        }
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
      this.potionGroup,
      this.collectPotion,
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

    // Camera follows player (both X and Y for the downhill slope)
    this.cameras.main.setBounds(0, 0, level.width, worldHeight);
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
    const finishY = this.getSlopeY(this.finishX);
    const finishLine = this.add.graphics();
    finishLine.lineStyle(4, 0xff4444, 1);
    finishLine.lineBetween(this.finishX, finishY - 100, this.finishX, finishY + height);
    finishLine.setDepth(2);

    this.add
      .text(this.finishX, finishY + 30, 'FINISH', {
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

    // Play main level music during skiing
    if (!this.sound.get('main-level')) {
      this.bgMusic = this.sound.add('main-level', { loop: true, volume: 0.4 });
    } else {
      this.bgMusic = this.sound.get('main-level');
    }
    if (!this.bgMusic.isPlaying) {
      this.bgMusic.play();
    }
  }

  // Get the slope Y offset at a given X position
  getSlopeY(x) {
    return x * this.slopeRatio;
  }

  // Get the Y coordinate of the snow surface at a given X
  getSnowSurfaceY(x) {
    const { height } = this.cameras.main;
    return height - 64 + this.getSlopeY(x);
  }

  // Get the Y for the player center so skis (14px below center) touch the snow
  getSlopeSurfaceY(x) {
    return this.getSnowSurfaceY(x) - 14;
  }

  update(time, delta) {
    if (this.gameOver) return;

    const dt = delta / 1000; // delta in seconds

    // --- Horizontal movement (speed boost / brake) ---
    if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(this.skiSpeed * 1.5);
    } else if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(this.skiSpeed * 0.5);
    } else {
      this.player.body.setVelocityX(this.skiSpeed);
    }

    // --- Lane steering (up/down moves across the slope, not free-fly) ---
    if (!this.isAirborne) {
      if (this.cursors.up.isDown) {
        this.laneOffset -= this.laneSpeed * dt;
      } else if (this.cursors.down.isDown) {
        this.laneOffset += this.laneSpeed * dt;
      }
      // Clamp to slope width
      this.laneOffset = Phaser.Math.Clamp(this.laneOffset, -this.laneRange, this.laneRange);
    }

    // --- Vertical (airborne) physics ---
    if (this.isAirborne) {
      // Apply gravity
      this.verticalVelocity += this.gravity * dt;
      this.airOffset -= this.verticalVelocity * dt;

      // Landed back on the slope
      if (this.airOffset <= 0) {
        this.airOffset = 0;
        this.verticalVelocity = 0;
        this.isAirborne = false;
        this.player.setAngle(this.downhillAngle);
      }
    }

    // --- Position the player on the slope surface ---
    const slopeY = this.getSlopeSurfaceY(this.player.x);
    const targetY = slopeY + this.laneOffset - this.airOffset;
    this.player.y = targetY;
    // We set velocity Y to 0 so arcade physics doesn't fight us
    this.player.body.setVelocityY(0);

    // --- Trick while airborne ---
    if (this.isAirborne && this.spaceKey.isDown) {
      this.trickRotation += 5;
      this.player.setAngle(this.trickRotation);
      if (this.trickRotation >= 360) {
        this.tricks++;
        this.score += 100;
        this.trickRotation = 0;
        this.player.setAngle(0);
        this.showStatus('TRICK! +100');
        SoundManager.trickComplete();
      }
    } else if (!this.isAirborne) {
      // Maintain downhill tilt when on the ground
      this.player.setAngle(this.downhillAngle);
    }

    // Parallax scrolling (both horizontal and vertical for downhill feel)
    this.skyBg.tilePositionX = this.cameras.main.scrollX * 0.1;
    this.skyBg.tilePositionY = this.cameras.main.scrollY * 0.05;
    this.mountainBg.tilePositionX = this.cameras.main.scrollX * 0.3;
    this.mountainBg.tilePositionY = this.cameras.main.scrollY * 0.15;

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
    SoundManager.obstacleHit();

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
    SoundManager.coinPickup();
  }

  collectStar(player, star) {
    star.destroy();
    this.stars++;
    this.score += 75;
    this.showStatus('STAR! +75');
    SoundManager.starPickup();
  }

  collectPotion(player, potion) {
    potion.destroy();
    this.potions++;
    this.showStatus('POTION! +1');
    SoundManager.potionPickup();
  }

  hitRamp(player, ramp) {
    if (this.isAirborne) return;
    this.isAirborne = true;
    this.trickRotation = 0;
    this.showStatus('AIRBORNE! Press SPACE for tricks!');
    SoundManager.rampJump();

    // Launch upward off the slope
    this.verticalVelocity = -350;
    this.airOffset = 1; // start just above ground so we're immediately airborne
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
    SoundManager.finishLine();

    // Stop background music
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }

    this.time.delayedCall(1500, () => {
      this.scene.start('TransitionScene', {
        score: this.score,
        coins: this.coins,
        stars: this.stars,
        tricks: this.tricks,
        potions: this.potions,
      });
    });
  }
}
