import Phaser from 'phaser';

/**
 * The Smallest Ambassador
 * A Sierra-style point-and-click adventure game
 *
 * Native resolution: 320x200 (VGA-style)
 * Scaled 4x to: 1280x800
 */

// Native game dimensions (VGA resolution)
const GAME_WIDTH = 320;
const GAME_HEIGHT = 200;

// Scale factor for display
const SCALE_FACTOR = 4;

// Placeholder scene for initial setup
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Set a colored background to verify the game is running
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Display loading text
    const text = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'The Smallest Ambassador',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
      }
    );
    text.setOrigin(0.5, 0.5);

    // Add subtitle
    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 24,
      'Initializing...',
      {
        fontSize: '8px',
        color: '#888888',
        fontFamily: 'Arial',
      }
    );
    subtitle.setOrigin(0.5, 0.5);
  }
}

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
  scene: [BootScene],
};

// Create and export the game instance
export const game = new Phaser.Game(config);
