import Phaser from 'phaser';
import { Character } from './Character';

/**
 * Sprite sheet and animation configuration for the player
 */
export const PLAYER_CONFIG = {
  /** Asset key for the player sprite sheet */
  textureKey: 'player-sheet',
  /** Path relative to public/ */
  assetPath: 'assets/sprites/player-sheet.png',
  /** Frame dimensions */
  frameWidth: 32,
  frameHeight: 48,
  /** Animation keys */
  anims: {
    idle: 'player-idle',
  },
} as const;

/**
 * Player - The controllable player character (Pip).
 *
 * Extends Character with:
 * - Idle animation registration and playback (2 frames, 500ms each)
 * - Facing direction tracking based on last movement
 * - Future: walking handled by US-014
 */
export class Player extends Character {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PLAYER_CONFIG.textureKey, 0);
    this.registerAnimations();
    this.playAnimation(PLAYER_CONFIG.anims.idle);
  }

  /**
   * Register all player animations with the scene's animation manager.
   * Uses a guard so we only register once per scene lifetime.
   */
  private registerAnimations(): void {
    const anims = this.scene.anims;

    // Only register if not already present (e.g., after room reload)
    if (!anims.exists(PLAYER_CONFIG.anims.idle)) {
      anims.create({
        key: PLAYER_CONFIG.anims.idle,
        frames: anims.generateFrameNumbers(PLAYER_CONFIG.textureKey, {
          start: 0,
          end: 1,
        }),
        frameRate: 2, // 2 fps → 500ms per frame
        repeat: -1, // Loop forever
      });
    }
  }

  /**
   * Face the direction of movement (used when walking is implemented).
   * Updates facing based on horizontal delta.
   */
  faceToward(targetX: number): void {
    if (targetX < this.getX()) {
      this.setFacing('left');
    } else if (targetX > this.getX()) {
      this.setFacing('right');
    }
  }
}
