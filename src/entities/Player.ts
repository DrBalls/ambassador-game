import Phaser from 'phaser';
import { Character } from './Character';
import { Point } from '../data/rooms';

/**
 * Sprite sheet and animation configuration for the player
 */
export const PLAYER_CONFIG = {
  /** Asset key for the player idle sprite sheet */
  textureKey: 'player-sheet',
  /** Path relative to public/ */
  assetPath: 'assets/sprites/player-sheet.png',
  /** Asset key for the player walk sprite sheet */
  walkTextureKey: 'player-walk-sheet',
  /** Path for walk sprite sheet */
  walkAssetPath: 'assets/sprites/player-walk-sheet.png',
  /** Frame dimensions */
  frameWidth: 32,
  frameHeight: 48,
  /** Animation keys */
  anims: {
    idle: 'player-idle',
    walk: 'player-walk',
  },
  /** Walk speed in pixels per second */
  walkSpeed: 60,
} as const;

/**
 * Player - The controllable player character (Pip).
 *
 * Extends Character with:
 * - Idle animation (2 frames, 500ms each)
 * - Walk animation (4 frames, ~8 fps)
 * - Click-to-walk movement toward a target position
 * - Multi-waypoint path following for A* pathfinding
 * - Facing direction tracking based on movement
 */
export class Player extends Character {
  private walkTarget: { x: number; y: number } | null = null;
  private isWalking = false;
  /** Remaining waypoints in the current path (excluding current target) */
  private pathQueue: Point[] = [];

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

    if (!anims.exists(PLAYER_CONFIG.anims.idle)) {
      anims.create({
        key: PLAYER_CONFIG.anims.idle,
        frames: anims.generateFrameNumbers(PLAYER_CONFIG.textureKey, {
          start: 0,
          end: 1,
        }),
        frameRate: 2, // 2 fps → 500ms per frame
        repeat: -1,
      });
    }

    if (!anims.exists(PLAYER_CONFIG.anims.walk)) {
      anims.create({
        key: PLAYER_CONFIG.anims.walk,
        frames: anims.generateFrameNumbers(PLAYER_CONFIG.walkTextureKey, {
          start: 0,
          end: 3,
        }),
        frameRate: 8, // 8 fps walk cycle
        repeat: -1,
      });
    }
  }

  /**
   * Set a walk target. The player will move toward this position each update().
   * Clears any existing path queue (used for direct single-point walking).
   */
  walkTo(x: number, y: number): void {
    this.pathQueue = [];
    this.walkTarget = { x, y };
    if (!this.isWalking) {
      this.isWalking = true;
      this.playAnimation(PLAYER_CONFIG.anims.walk, false);
    }
    this.faceToward(x);
  }

  /**
   * Follow a multi-waypoint path. The player walks to each waypoint in sequence.
   * The first waypoint is the player's current position (skipped).
   */
  followPath(path: Point[]): void {
    if (path.length < 2) return;

    // Skip the first point (current position), queue the rest
    const remaining = path.slice(1);
    const first = remaining.shift();
    if (!first) return;

    this.pathQueue = remaining;
    this.walkTarget = { x: first.x, y: first.y };

    if (!this.isWalking) {
      this.isWalking = true;
      this.playAnimation(PLAYER_CONFIG.anims.walk, false);
    }
    this.faceToward(first.x);
  }

  /**
   * Stop walking and return to idle animation.
   */
  stopWalking(): void {
    this.walkTarget = null;
    this.pathQueue = [];
    if (this.isWalking) {
      this.isWalking = false;
      this.playAnimation(PLAYER_CONFIG.anims.idle, false);
    }
  }

  /**
   * Whether the player is currently walking.
   */
  getIsWalking(): boolean {
    return this.isWalking;
  }

  /**
   * Update movement each frame. Call from GameScene.update().
   * Returns true if the player reached the final destination this frame.
   */
  updateMovement(delta: number): boolean {
    if (!this.walkTarget || !this.isWalking) return false;

    const dx = this.walkTarget.x - this.getX();
    const dy = this.walkTarget.y - this.getY();
    const distance = Math.sqrt(dx * dx + dy * dy);

    // How far we can move this frame
    const step = PLAYER_CONFIG.walkSpeed * (delta / 1000);

    if (distance <= step) {
      // Arrived at current waypoint
      this.setPosition(this.walkTarget.x, this.walkTarget.y);

      // Check if there are more waypoints in the path queue
      const nextWaypoint = this.pathQueue.shift();
      if (nextWaypoint) {
        this.walkTarget = { x: nextWaypoint.x, y: nextWaypoint.y };
        this.faceToward(nextWaypoint.x);
        return false; // Not at final destination yet
      }

      // Path complete
      this.stopWalking();
      return true;
    }

    // Move toward current waypoint
    const nx = dx / distance;
    const ny = dy / distance;
    this.setPosition(this.getX() + nx * step, this.getY() + ny * step);
    this.faceToward(this.walkTarget.x);
    return false;
  }

  /**
   * Face the direction of movement.
   */
  faceToward(targetX: number): void {
    if (targetX < this.getX()) {
      this.setFacing('left');
    } else if (targetX > this.getX()) {
      this.setFacing('right');
    }
  }
}
