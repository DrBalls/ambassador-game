import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

/**
 * GameScene - Main gameplay container
 *
 * This scene will contain the main game loop, room rendering,
 * verb interface, inventory, and player interactions.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Display placeholder background (320x200)
    this.add.image(0, 0, 'bg-placeholder').setOrigin(0, 0);

    // Display placeholder character sprite in center
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'character');

    // Display UI button in corner as test
    this.add.image(16, 16, 'ui-button');

    // Label text to show assets loaded
    const text = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 20,
      'Assets Loaded',
      {
        fontSize: '8px',
        color: '#ffffff',
        fontFamily: 'Arial',
      }
    );
    text.setOrigin(0.5, 0.5);
  }

  update(_time: number, _delta: number): void {
    // Game loop logic will be added in future stories
  }
}
