import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

/**
 * MenuScene - Title screen / main menu
 *
 * Shows 'Click to Start' text and transitions to GameScene on click.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Set background color
    this.cameras.main.setBackgroundColor('#0a0a1e');

    // Title text
    const title = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 20,
      'The Smallest Ambassador',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial',
      }
    );
    title.setOrigin(0.5, 0.5);

    // Click to start text
    const startText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 20,
      'Click to Start',
      {
        fontSize: '10px',
        color: '#aaaaaa',
        fontFamily: 'Arial',
      }
    );
    startText.setOrigin(0.5, 0.5);

    // Add pulsing animation to start text
    this.tweens.add({
      targets: startText,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Enable input and transition to GameScene on click
    this.input.once('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
