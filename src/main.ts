import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import {
  calculateIntegerScale,
  getViewportSize,
  setupResizeListener,
  applyPixelPerfectCSS,
} from './utils/PixelScale';

/**
 * The Smallest Ambassador
 * A Sierra-style point-and-click adventure game
 *
 * Native resolution: 320x200 (VGA-style)
 * Dynamically scaled to largest integer multiple that fits viewport
 */

// Calculate initial scale based on current viewport
const viewport = getViewportSize();
const initialScale = calculateIntegerScale(viewport.width, viewport.height);

// Phaser game configuration with pixel-perfect integer scaling
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.NONE, // We handle scaling manually for integer precision
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    zoom: initialScale,
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

// Apply pixel-perfect CSS to canvas once it's created
game.events.once('ready', () => {
  const canvas = game.canvas;
  if (canvas) {
    applyPixelPerfectCSS(canvas);
  }

  // Set up resize listener for responsive integer scaling
  setupResizeListener(game);
});
