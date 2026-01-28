import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { VerbSystem } from '../systems/VerbSystem';

/**
 * GameScene - Main gameplay container
 *
 * This scene will contain the main game loop, room rendering,
 * verb interface, inventory, and player interactions.
 */
export class GameScene extends Phaser.Scene {
  private verbSystem!: VerbSystem;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Display placeholder background (320x200)
    this.add.image(0, 0, 'bg-placeholder').setOrigin(0, 0);

    // Display placeholder character sprite in center of viewport area (above verb bar)
    // Viewport is 320x176 (leaving 24px for verb bar at bottom)
    this.add.image(GAME_WIDTH / 2, (GAME_HEIGHT - 24) / 2, 'character');

    // Initialize the SCUMM-style verb bar
    this.verbSystem = new VerbSystem(this);

    // Listen for verb selection events (useful for debugging)
    this.events.on('verb:selected', (verb: string) => {
      console.log(`Verb selected: ${verb}`);
    });
  }

  /**
   * Get the verb system for external access
   */
  getVerbSystem(): VerbSystem {
    return this.verbSystem;
  }

  update(_time: number, _delta: number): void {
    // Game loop logic will be added in future stories
  }
}
