import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { VerbSystem } from '../systems/VerbSystem';
import { SentenceLineSystem } from '../systems/SentenceLineSystem';

/**
 * GameScene - Main gameplay container
 *
 * This scene will contain the main game loop, room rendering,
 * verb interface, inventory, and player interactions.
 */
export class GameScene extends Phaser.Scene {
  private verbSystem!: VerbSystem;
  private sentenceLineSystem!: SentenceLineSystem;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Display placeholder background (320x200)
    this.add.image(0, 0, 'bg-placeholder').setOrigin(0, 0);

    // Display placeholder character sprite in center of viewport area (above UI)
    // Viewport is 320x160 (leaving 40px for sentence line + verb bar at bottom)
    this.add.image(GAME_WIDTH / 2, (GAME_HEIGHT - 40) / 2, 'character');

    // Initialize the sentence line (above verb bar)
    this.sentenceLineSystem = new SentenceLineSystem(this);

    // Initialize the SCUMM-style verb bar
    this.verbSystem = new VerbSystem(this);

    // Create a test hotspot for verifying sentence line behavior
    this.createTestHotspot();

    // Listen for verb selection events (useful for debugging)
    this.events.on('verb:selected', (verb: string) => {
      console.log(`Verb selected: ${verb}`);
    });
  }

  /**
   * Create a test hotspot to verify sentence line hover behavior
   */
  private createTestHotspot(): void {
    // Create a visible test hotspot (red rectangle)
    const hotspot = this.add.rectangle(
      80,
      60,
      48,
      32,
      0x994444,
      0.5 // Semi-transparent
    );
    hotspot.setInteractive({ useHandCursor: true });

    // Emit events on hover/leave for the sentence line system
    hotspot.on('pointerover', () => {
      this.events.emit('hotspot:hover', 'Test Object');
    });

    hotspot.on('pointerout', () => {
      this.events.emit('hotspot:leave');
    });

    // Add a label so it's clear what this is
    const label = this.add.text(80, 60, 'Test', {
      fontSize: '6px',
      fontFamily: 'Arial',
      color: '#ffffff',
    });
    label.setOrigin(0.5, 0.5);
  }

  /**
   * Get the verb system for external access
   */
  getVerbSystem(): VerbSystem {
    return this.verbSystem;
  }

  /**
   * Get the sentence line system for external access
   */
  getSentenceLineSystem(): SentenceLineSystem {
    return this.sentenceLineSystem;
  }

  update(_time: number, _delta: number): void {
    // Game loop logic will be added in future stories
  }
}
