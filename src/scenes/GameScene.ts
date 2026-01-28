import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';
import { VerbSystem } from '../systems/VerbSystem';
import { SentenceLineSystem } from '../systems/SentenceLineSystem';
import { InventorySystem, InventoryItem } from '../systems/InventorySystem';
import { ItemDefinition } from '../data/items';
import { RoomData, HotspotData, HotspotCallback, getRoom } from '../data/rooms';
import { Hotspot } from '../entities/Hotspot';

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
  private feedbackText!: Phaser.GameObjects.Text;
  private currentRoom: RoomData | null = null;
  private roomBackground: Phaser.GameObjects.Image | null = null;
  private hotspots: Hotspot[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Load the test room (future: room ID will come from game state)
    this.loadRoom('test-room');

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

    // Listen for hotspot clicks — dispatch verb action
    this.events.on('hotspot:click', (hotspotData: HotspotData) => {
      this.handleHotspotClick(hotspotData);
    });

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

    // Create feedback text for combination results (centered in viewport area)
    this.feedbackText = this.add.text(GAME_WIDTH / 2, 60, '', {
      fontSize: '8px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    this.feedbackText.setOrigin(0.5, 0.5);
    this.feedbackText.setDepth(100);
    this.feedbackText.setVisible(false);

    // Listen for combination events
    this.events.on(
      'combination:success',
      (resultItem: ItemDefinition) => {
        this.showFeedback(`Created ${resultItem.name}!`);
      }
    );

    this.events.on(
      'combination:fail',
      (_source: InventoryItem, _target: InventoryItem) => {
        this.showFeedback("That doesn't work.");
      }
    );

    // Expose inventory system globally for console testing
    // Usage: game.scene.getScene('GameScene').inventorySystem.addItem({...})
    (window as unknown as { testInventory: InventorySystem }).testInventory = this.inventorySystem;
  }

  /**
   * Handle a hotspot click — resolve the active verb's response
   */
  private handleHotspotClick(hotspotData: HotspotData): void {
    const verb = this.verbSystem.getSelectedVerb();
    const hotspot = this.hotspots.find(h => h.getData().id === hotspotData.id);
    if (!hotspot) return;

    const response = hotspot.getResponse(verb);

    if (!response) {
      // No specific response defined for this verb
      this.showFeedback("Nothing happens.");
      return;
    }

    if (typeof response === 'string') {
      // Text response — show as feedback
      this.showFeedback(response);
    } else {
      // Callback response — emit event with action data
      const callback = response as HotspotCallback;
      this.events.emit('hotspot:action', callback.action, callback.data);
      console.log(`Hotspot action: ${callback.action}`, callback.data);
    }
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

  /**
   * Show temporary feedback text in the viewport area
   */
  private showFeedback(message: string): void {
    this.feedbackText.setText(message);
    this.feedbackText.setVisible(true);
    this.feedbackText.setAlpha(1);

    // Fade out after 2 seconds
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      duration: 500,
      delay: 1500,
      onComplete: () => {
        this.feedbackText.setVisible(false);
      },
    });
  }

  /**
   * Load a room by ID — sets background and stores room data.
   * Clears any previous room background before rendering the new one.
   */
  loadRoom(roomId: string): void {
    const room = getRoom(roomId);
    if (!room) {
      console.warn(`Room not found: ${roomId}`);
      return;
    }

    // Clear previous background
    if (this.roomBackground) {
      this.roomBackground.destroy();
      this.roomBackground = null;
    }

    // Clear previous hotspots
    this.clearHotspots();

    this.currentRoom = room;

    // Render background at top-left of viewport (320x120 area)
    this.roomBackground = this.add.image(0, 0, room.background).setOrigin(0, 0);
    // Ensure background renders behind everything else
    this.roomBackground.setDepth(-1);

    // Create hotspot entities from room data
    this.createHotspots(room);

    console.log(`Loaded room: ${room.name} (${room.id})`);
  }

  /**
   * Create Hotspot entities from room data
   */
  private createHotspots(room: RoomData): void {
    for (const hotspotData of room.hotspots) {
      const hotspot = new Hotspot(this, hotspotData);
      this.hotspots.push(hotspot);
    }
  }

  /**
   * Destroy all current hotspot entities
   */
  private clearHotspots(): void {
    for (const hotspot of this.hotspots) {
      hotspot.destroy();
    }
    this.hotspots = [];
  }

  /**
   * Get the current room data
   */
  getCurrentRoom(): RoomData | null {
    return this.currentRoom;
  }

  update(_time: number, _delta: number): void {
    // Game loop logic will be added in future stories
  }
}
