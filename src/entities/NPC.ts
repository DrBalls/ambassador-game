import Phaser from 'phaser';
import { Character, FacingDirection } from './Character';
import { NPCDefinition } from '../data/npcs';

/**
 * NPC - A non-player character that appears in rooms.
 *
 * Extends Character with:
 * - Idle animation (configurable frame count and rate)
 * - Interactive zone for hotspot-style interaction (LOOK, TALK, etc.)
 * - Emits hotspot:hover/leave/click events like regular hotspots
 *
 * NPCs are both visual characters and interactive hotspots,
 * so the player can LOOK at, TALK to, and otherwise interact
 * with them using the verb bar.
 */
export class NPC extends Character {
  private definition: NPCDefinition;
  private interactiveZone: Phaser.GameObjects.Zone;
  private animKey: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    facing: FacingDirection,
    definition: NPCDefinition
  ) {
    super(scene, x, y, definition.textureKey, 0);
    this.definition = definition;
    this.setFacing(facing);

    // Register and play idle animation
    this.animKey = `${definition.id}-idle`;
    this.registerIdleAnimation();
    this.playAnimation(this.animKey);

    // Create an interactive zone over the sprite for hotspot-like interaction
    this.interactiveZone = this.createInteractiveZone();
    this.setupEvents();
  }

  /**
   * Register the NPC's idle animation (guard against duplicates)
   */
  private registerIdleAnimation(): void {
    const anims = this.scene.anims;

    if (!anims.exists(this.animKey)) {
      anims.create({
        key: this.animKey,
        frames: anims.generateFrameNumbers(this.definition.textureKey, {
          start: 0,
          end: this.definition.idleFrames - 1,
        }),
        frameRate: this.definition.idleFrameRate,
        repeat: -1,
      });
    }
  }

  /**
   * Create an interactive zone centered on the NPC's sprite.
   * The zone follows the sprite's position and allows pointer events.
   */
  private createInteractiveZone(): Phaser.GameObjects.Zone {
    const sprite = this.getSprite();
    // Zone positioned at sprite center; sprite origin is (0.5, 1),
    // so center is at (x, y - height/2)
    const zone = this.scene.add.zone(
      sprite.x,
      sprite.y - this.definition.frameHeight / 2,
      this.definition.frameWidth,
      this.definition.frameHeight
    );
    zone.setInteractive({ useHandCursor: true });
    return zone;
  }

  /**
   * Set up pointer events for hover, leave, and click
   */
  private setupEvents(): void {
    this.interactiveZone.on('pointerover', () => {
      this.scene.events.emit('hotspot:hover', this.definition.name);
    });

    this.interactiveZone.on('pointerout', () => {
      this.scene.events.emit('hotspot:leave');
    });

    this.interactiveZone.on('pointerdown', () => {
      // Emit a synthetic hotspot:click with NPC data shaped like HotspotData
      this.scene.events.emit('npc:click', this.definition);
    });
  }

  /**
   * Get this NPC's definition
   */
  getDefinition(): NPCDefinition {
    return this.definition;
  }

  /**
   * Clean up sprite and interactive zone
   */
  destroy(): void {
    this.interactiveZone.removeAllListeners();
    this.interactiveZone.destroy();
    super.destroy();
  }
}
