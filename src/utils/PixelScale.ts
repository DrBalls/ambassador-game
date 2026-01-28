/**
 * Pixel-Perfect Scaling Utility
 *
 * Implements integer scaling to ensure crisp pixel graphics without blur.
 * The game renders at native 320x200 resolution and scales up by whole numbers
 * (1x, 2x, 3x, 4x) to fit the viewport while maintaining pixel-perfect clarity.
 */

import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

/**
 * Calculate the maximum integer scale factor that fits within the viewport.
 * This ensures pixels are always rendered at whole-number multiples,
 * preventing sub-pixel rendering artifacts that cause blur.
 */
export function calculateIntegerScale(
  viewportWidth: number,
  viewportHeight: number
): number {
  // Calculate max scale that fits in each dimension
  const scaleX = Math.floor(viewportWidth / GAME_WIDTH);
  const scaleY = Math.floor(viewportHeight / GAME_HEIGHT);

  // Use the smaller of the two to ensure game fits in both dimensions
  const scale = Math.min(scaleX, scaleY);

  // Clamp to minimum of 1x (never scale below native resolution)
  return Math.max(1, scale);
}

/**
 * Get current viewport dimensions (accounting for device pixel ratio on high-DPI screens)
 */
export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Calculate the scaled canvas dimensions for the current viewport
 */
export function getScaledDimensions(): {
  width: number;
  height: number;
  scale: number;
} {
  const viewport = getViewportSize();
  const scale = calculateIntegerScale(viewport.width, viewport.height);

  return {
    width: GAME_WIDTH * scale,
    height: GAME_HEIGHT * scale,
    scale,
  };
}

/**
 * Apply pixel-perfect scaling to a Phaser game instance.
 * Should be called on game creation and window resize.
 */
export function applyPixelPerfectScale(game: Phaser.Game): void {
  const viewport = getViewportSize();
  const scale = calculateIntegerScale(viewport.width, viewport.height);

  // Update Phaser's scale manager with the new zoom level
  game.scale.setZoom(scale);

  // Ensure canvas is centered (Phaser handles this with autoCenter)
  game.scale.refresh();
}

/**
 * Set up resize listener for responsive pixel-perfect scaling.
 * Returns a cleanup function to remove the listener.
 */
export function setupResizeListener(game: Phaser.Game): () => void {
  let resizeTimeout: number | null = null;

  const handleResize = (): void => {
    // Debounce resize events to avoid excessive recalculations
    if (resizeTimeout !== null) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
      applyPixelPerfectScale(game);
      resizeTimeout = null;
    }, 100);
  };

  window.addEventListener('resize', handleResize);

  // Return cleanup function
  return () => {
    if (resizeTimeout !== null) {
      window.clearTimeout(resizeTimeout);
    }
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Ensure canvas has pixel-perfect CSS applied.
 * This supplements Phaser's pixelArt config with explicit CSS rules.
 */
export function applyPixelPerfectCSS(canvas: HTMLCanvasElement): void {
  canvas.style.imageRendering = 'pixelated';
  // Fallback for older browsers
  canvas.style.imageRendering = 'crisp-edges';
  // Prevent any smoothing
  canvas.style.imageRendering = '-moz-crisp-edges';
}
