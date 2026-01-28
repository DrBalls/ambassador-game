import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCALE_FACTOR } from './constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

/**
 * The Smallest Ambassador
 * A Sierra-style point-and-click adventure game
 *
 * Native resolution: 320x200 (VGA-style)
 * Scaled 4x to: 1280x800
 */

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    zoom: SCALE_FACTOR,
  },
  render: {
    pixelArt: true,
    roundPixels: true,
    antialias: false,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene],
};

// Create and export the game instance
export const game = new Phaser.Game(config);
