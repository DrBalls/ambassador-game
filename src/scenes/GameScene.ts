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
    // Set background color for now
    this.cameras.main.setBackgroundColor('#1e3a5f');

    // Placeholder text to show the scene is working
    const text = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'Game Scene',
      {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial',
      }
    );
    text.setOrigin(0.5, 0.5);

    // Subtitle with instructions
    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 16,
      'Adventure awaits...',
      {
        fontSize: '8px',
        color: '#aaaaaa',
        fontFamily: 'Arial',
      }
    );
    subtitle.setOrigin(0.5, 0.5);
  }

  update(_time: number, _delta: number): void {
    // Game loop logic will be added in future stories
  }
}
