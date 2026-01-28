import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';
import { VerbSystem } from '../systems/VerbSystem';
import { SentenceLineSystem } from '../systems/SentenceLineSystem';
import { InventorySystem, InventoryItem } from '../systems/InventorySystem';

/**
 * GameScene - Main gameplay container
 *
 * This scene will contain the main game loop, room rendering,
 * verb interface, inventory, and player interactions.
 */
export class GameScene extends Phaser.Scene {
  private verbSystem!: VerbSystem;
  private sentenceLineSystem!: SentenceLineSystem;
  private inventorySystem!: InventorySystem;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Display placeholder background (320x200)
    this.add.image(0, 0, 'bg-placeholder').setOrigin(0, 0);

    // Display placeholder character sprite in center of viewport area (above UI)
    // Viewport is 320x120 (leaving 80px for inventory + sentence line + verb bar at bottom)
    this.add.image(GAME_WIDTH / 2, 60, 'character');

    // Initialize UI systems in order (bottom to top visually, but create order doesn't matter)
    // UI Layout:
    // - Viewport: 0-120 (120px)
    // - Inventory: 120-160 (40px)
    // - Sentence line: 160-176 (16px)
    // - Verb bar: 176-200 (24px)
    this.inventorySystem = new InventorySystem(this);
    this.sentenceLineSystem = new SentenceLineSystem(this);
    this.verbSystem = new VerbSystem(this);

    // Create a test hotspot for verifying sentence line behavior
    this.createTestHotspot();

    // Listen for verb selection events (useful for debugging)
    this.events.on('verb:selected', (verb: string) => {
      console.log(`Verb selected: ${verb}`);
    });

    // Listen for inventory events (useful for debugging and testing)
    this.events.on('inventory:selected', (item: InventoryItem) => {
      console.log(`Inventory item selected: ${item.name}`);
    });

    this.events.on('inventory:deselected', () => {
      console.log('Inventory item deselected');
    });

    this.events.on('inventory:look', (item: InventoryItem) => {
      console.log(`Look at inventory item: ${item.name} - ${item.description}`);
    });

    // Expose inventory system globally for console testing
    // Usage: game.scene.getScene('GameScene').inventorySystem.addItem({...})
    (window as unknown as { testInventory: InventorySystem }).testInventory = this.inventorySystem;
  }

  /**
   * Create a test hotspot to verify sentence line hover behavior
   */
  private createTestHotspot(): void {
    // Create a visible test hotspot (red rectangle)
    // Positioned in the viewport area (0-120px height)
    const hotspot = this.add.rectangle(
      80,
      50,
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
    const label = this.add.text(80, 50, 'Test', {
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

  /**
   * Get the inventory system for external access
   */
  getInventorySystem(): InventorySystem {
    return this.inventorySystem;
  }

  update(_time: number, _delta: number): void {
    // Game loop logic will be added in future stories
  }
}
