import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { SkiPhaseScene } from './scenes/SkiPhaseScene.js';
import { TransitionScene } from './scenes/TransitionScene.js';
import { CombatPhaseScene } from './scenes/CombatPhaseScene.js';
import { SpriteLibraryScene } from './scenes/SpriteLibraryScene.js';
import { LevelEditorScene } from './scenes/LevelEditorScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MainMenuScene,
    SkiPhaseScene,
    TransitionScene,
    CombatPhaseScene,
    SpriteLibraryScene,
    LevelEditorScene,
    GameOverScene,
  ],
};

const game = new Phaser.Game(config);

export default game;
