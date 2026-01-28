import Phaser from 'phaser';
import { HotspotData, HotspotResponse } from '../data/rooms';
import { Verb } from '../systems/VerbSystem';

/**
 * Map from Verb enum to the corresponding key in HotspotResponses
 */
const VERB_TO_RESPONSE_KEY: Record<Verb, keyof NonNullable<HotspotData['responses']>> = {
  [Verb.WALK]: 'walk',
  [Verb.LOOK]: 'look',
  [Verb.TALK]: 'talk',
  [Verb.USE]: 'use',
  [Verb.TAKE]: 'take',
  [Verb.GIVE]: 'look', // GIVE falls back to look (no specific response key)
};

/**
 * Hotspot - Interactive area within a game room.
 *
 * Wraps a Phaser Zone with the correct collision shape (rect or polygon),
 * emits hover/leave events for the sentence line, and dispatches verb
 * actions on click.
 */
export class Hotspot {
  private scene: Phaser.Scene;
  private data: HotspotData;
  private zone: Phaser.GameObjects.Zone;

  constructor(scene: Phaser.Scene, data: HotspotData) {
    this.scene = scene;
    this.data = data;
    this.zone = this.createZone();
    this.setupEvents();
  }

  /**
   * Create the interactive zone based on bounds type (rect or polygon)
   */
  private createZone(): Phaser.GameObjects.Zone {
    const { bounds } = this.data;

    if (bounds.type === 'rect') {
      // Rectangle: zone centered at the rect's center
      const zone = this.scene.add.zone(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        bounds.width,
        bounds.height
      );
      zone.setInteractive({ useHandCursor: true });
      return zone;
    }

    // Polygon: create zone at origin, set polygon hit area
    const { points } = bounds;

    // Calculate bounding box for zone placement
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    const zone = this.scene.add.zone(centerX, centerY, width, height);

    // Create a Phaser polygon for the hit area, translated to local coords
    const localPoints = points.map(p => new Phaser.Geom.Point(p.x - minX, p.y - minY));
    const polygon = new Phaser.Geom.Polygon(localPoints);

    zone.setInteractive({
      hitArea: polygon,
      hitAreaCallback: Phaser.Geom.Polygon.Contains,
      useHandCursor: true,
    });

    return zone;
  }

  /**
   * Set up pointer events for hover and click
   */
  private setupEvents(): void {
    this.zone.on('pointerover', () => {
      this.scene.events.emit('hotspot:hover', this.data.name);
    });

    this.zone.on('pointerout', () => {
      this.scene.events.emit('hotspot:leave');
    });

    this.zone.on('pointerdown', () => {
      this.scene.events.emit('hotspot:click', this.data);
    });
  }

  /**
   * Get the response for a given verb, or null if no response defined
   */
  getResponse(verb: Verb): HotspotResponse | undefined {
    const key = VERB_TO_RESPONSE_KEY[verb];
    return this.data.responses[key];
  }

  /**
   * Get the hotspot data
   */
  getData(): HotspotData {
    return this.data;
  }

  /**
   * Get the hotspot's display name
   */
  getName(): string {
    return this.data.name;
  }

  /**
   * Clean up the zone and event listeners
   */
  destroy(): void {
    this.zone.removeAllListeners();
    this.zone.destroy();
  }
}
