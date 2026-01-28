import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';
import { VerbSystem } from '../systems/VerbSystem';
import { SentenceLineSystem } from '../systems/SentenceLineSystem';
import { InventorySystem, InventoryItem } from '../systems/InventorySystem';
import { ItemDefinition } from '../data/items';
import { RoomData, HotspotData, HotspotCallback, ExitData, getRoom } from '../data/rooms';
import { Hotspot } from '../entities/Hotspot';
import { Verb } from '../systems/VerbSystem';

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
  private exitZones: Phaser.GameObjects.Zone[] = [];
  private isTransitioning = false;

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

    // Clear previous hotspots and exit zones
    this.clearHotspots();
    this.clearExitZones();

    this.currentRoom = room;

    // Render background at top-left of viewport (320x120 area)
    this.roomBackground = this.add.image(0, 0, room.background).setOrigin(0, 0);
    // Ensure background renders behind everything else
    this.roomBackground.setDepth(-1);

    // Create hotspot entities from room data
    this.createHotspots(room);

    // Create exit zones from room data
    this.createExitZones(room);

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
   * Create interactive exit zones from room data.
   * Exits behave like hotspots: they show their name in the sentence line on hover
   * and trigger a room transition when clicked with the WALK verb.
   */
  private createExitZones(room: RoomData): void {
    for (const exit of room.exits) {
      const zone = this.createExitZone(exit);
      this.exitZones.push(zone);
    }
  }

  /**
   * Create a single exit zone with interactive events
   */
  private createExitZone(exit: ExitData): Phaser.GameObjects.Zone {
    const { bounds } = exit;
    let zone: Phaser.GameObjects.Zone;

    if (bounds.type === 'rect') {
      zone = this.add.zone(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        bounds.width,
        bounds.height
      );
      zone.setInteractive({ useHandCursor: true });
    } else {
      // Polygon exit bounds
      const { points } = bounds;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const width = maxX - minX;
      const height = maxY - minY;
      zone = this.add.zone(minX + width / 2, minY + height / 2, width, height);

      const localPoints = points.map(p => new Phaser.Geom.Point(p.x - minX, p.y - minY));
      const polygon = new Phaser.Geom.Polygon(localPoints);
      zone.setInteractive({
        hitArea: polygon,
        hitAreaCallback: Phaser.Geom.Polygon.Contains,
        useHandCursor: true,
      });
    }

    // Hover events — show exit name in sentence line
    zone.on('pointerover', () => {
      this.events.emit('hotspot:hover', exit.name);
    });
    zone.on('pointerout', () => {
      this.events.emit('hotspot:leave');
    });

    // Click — trigger room transition if WALK verb is active
    zone.on('pointerdown', () => {
      const verb = this.verbSystem.getSelectedVerb();
      if (verb === Verb.WALK) {
        this.transitionToRoom(exit.targetRoomId, exit.spawnPosition);
      } else {
        this.showFeedback(`You can walk to ${exit.name}.`);
      }
    });

    return zone;
  }

  /**
   * Destroy all current exit zones
   */
  private clearExitZones(): void {
    for (const zone of this.exitZones) {
      zone.removeAllListeners();
      zone.destroy();
    }
    this.exitZones = [];
  }

  /**
   * Transition to a new room with a fade out/in effect.
   * Fade out (0.5s) → load new room → fade in (0.5s).
   */
  private transitionToRoom(targetRoomId: string, spawnPosition: { x: number; y: number }): void {
    if (this.isTransitioning) return;

    const targetRoom = getRoom(targetRoomId);
    if (!targetRoom) {
      console.warn(`Exit target room not found: ${targetRoomId}`);
      return;
    }

    this.isTransitioning = true;

    // Fade out (500ms)
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Load the new room (clears old background, hotspots, exit zones)
      this.loadRoom(targetRoomId);

      // Set player position to spawn point (future: move actual player entity)
      console.log(`Player spawns at (${spawnPosition.x}, ${spawnPosition.y})`);

      // Fade in (500ms)
      this.cameras.main.fadeIn(500, 0, 0, 0);

      this.cameras.main.once('camerafadeincomplete', () => {
        this.isTransitioning = false;
      });
    });
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
