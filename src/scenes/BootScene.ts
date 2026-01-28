import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { PLAYER_CONFIG } from '../entities/Player';

/**
 * BootScene - Initial loading scene
 *
 * Displays loading indicator and preloads game assets.
 * Transitions to MenuScene after 1 second.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load background images
    this.load.image('bg-placeholder', 'assets/backgrounds/placeholder.png');

    // Load character sprites
    this.load.image('character', 'assets/sprites/character.png');

    // Load player sprite sheet (2 frames for idle animation)
    this.load.spritesheet(PLAYER_CONFIG.textureKey, PLAYER_CONFIG.assetPath, {
      frameWidth: PLAYER_CONFIG.frameWidth,
      frameHeight: PLAYER_CONFIG.frameHeight,
    });

    // Load UI elements
    this.load.image('ui-button', 'assets/ui/button.png');
  }

  create(): void {
    // Set a colored background
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
      'Loading...',
      {
        fontSize: '8px',
        color: '#888888',
        fontFamily: 'Arial',
      }
    );
    subtitle.setOrigin(0.5, 0.5);

    // Transition to MenuScene after 1 second
    this.time.delayedCall(1000, () => {
      this.scene.start('MenuScene');
    });
  }
}
