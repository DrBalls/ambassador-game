import Phaser from 'phaser';

/**
 * Direction a character can face
 */
export type FacingDirection = 'left' | 'right';

/**
 * Character - Base class for all game characters (player and NPCs).
 *
 * Wraps a Phaser Sprite with:
 * - Position management
 * - Facing direction (flipX for left/right)
 * - Y-based depth sorting (lower = in front)
 * - Idle animation playback
 */
export class Character {
  protected scene: Phaser.Scene;
  protected sprite: Phaser.GameObjects.Sprite;
  protected facing: FacingDirection = 'right';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    frame?: number
  ) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, textureKey, frame);
    this.sprite.setOrigin(0.5, 1); // Anchor at bottom-center (feet)
    this.updateDepth();
  }

  /**
   * Get the character's current X position
   */
  getX(): number {
    return this.sprite.x;
  }

  /**
   * Get the character's current Y position
   */
  getY(): number {
    return this.sprite.y;
  }

  /**
   * Set the character's position and update depth sorting
   */
  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.updateDepth();
  }

  /**
   * Set the direction the character faces.
   * Uses flipX so we only need right-facing art.
   */
  setFacing(direction: FacingDirection): void {
    this.facing = direction;
    this.sprite.setFlipX(direction === 'left');
  }

  /**
   * Get the current facing direction
   */
  getFacing(): FacingDirection {
    return this.facing;
  }

  /**
   * Play a named animation on the sprite
   */
  playAnimation(key: string, ignoreIfPlaying = true): void {
    this.sprite.play(key, ignoreIfPlaying);
  }

  /**
   * Stop the current animation
   */
  stopAnimation(): void {
    this.sprite.stop();
  }

  /**
   * Update depth based on Y position.
   * Characters lower on screen (higher Y) appear in front.
   */
  protected updateDepth(): void {
    this.sprite.setDepth(this.sprite.y);
  }

  /**
   * Get the underlying Phaser sprite (for advanced usage)
   */
  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  /**
   * Clean up the character sprite
   */
  destroy(): void {
    this.sprite.destroy();
  }
}
