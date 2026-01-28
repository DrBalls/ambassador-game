/**
 * Generates placeholder PNG assets for development.
 * Run with: node scripts/generate-placeholders.js
 */

import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Creates a PNG image with specified dimensions and pixel data generator.
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {function(x, y, width, height): {r, g, b, a}} pixelFn - Function returning RGBA for each pixel
 * @returns {Buffer} PNG buffer
 */
function createPNG(width, height, pixelFn) {
  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const { r, g, b, a } = pixelFn(x, y, width, height);
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

/**
 * Writes PNG buffer to file, creating directories if needed.
 */
function savePNG(filePath, buffer) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, buffer);
  console.log(`Created: ${filePath}`);
}

// Colors matching VGA-style palette
const COLORS = {
  darkBlue: { r: 26, g: 26, b: 46 },    // #1a1a2e - UI background
  mediumBlue: { r: 41, g: 41, b: 66 },  // #292942 - Background
  lightBlue: { r: 74, g: 74, b: 106 },  // #4a4a6a - Grid lines
  orange: { r: 230, g: 126, b: 34 },    // #e67e22 - Character (Pip - orange penguin)
  gray: { r: 128, g: 128, b: 128 },     // #808080 - UI button
  white: { r: 255, g: 255, b: 255 },    // #ffffff - Highlights
};

// 1. Background: 320x200, blue with grid
const backgroundBuffer = createPNG(320, 200, (x, y) => {
  // Draw grid every 16 pixels
  const isGridLine = x % 16 === 0 || y % 16 === 0;
  const color = isGridLine ? COLORS.lightBlue : COLORS.mediumBlue;
  return { ...color, a: 255 };
});
savePNG('public/assets/backgrounds/placeholder.png', backgroundBuffer);

// 2. Character sprite: 32x48, colored rectangle (orange for Pip)
const characterBuffer = createPNG(32, 48, (x, y, w, h) => {
  // Create a simple penguin-like shape
  const centerX = w / 2;
  const isBody = x >= 4 && x < w - 4 && y >= 8 && y < h - 4;
  const isHead = x >= 8 && x < w - 8 && y >= 0 && y < 16;

  // Eyes (white dots)
  const isLeftEye = x >= 10 && x < 14 && y >= 6 && y < 10;
  const isRightEye = x >= 18 && x < 22 && y >= 6 && y < 10;

  // Beak (orange)
  const isBeak = x >= 14 && x < 18 && y >= 10 && y < 14;

  if (isLeftEye || isRightEye) {
    return { ...COLORS.white, a: 255 };
  }
  if (isBeak) {
    return { ...COLORS.orange, a: 255 };
  }
  if (isBody || isHead) {
    return { ...COLORS.darkBlue, a: 255 };
  }
  // Transparent background
  return { r: 0, g: 0, b: 0, a: 0 };
});
savePNG('public/assets/sprites/character.png', characterBuffer);

// 3. UI button: 16x16, gray rectangle with border
const buttonBuffer = createPNG(16, 16, (x, y, w, h) => {
  // Border (1px)
  const isBorder = x === 0 || y === 0 || x === w - 1 || y === h - 1;
  // Highlight on top-left edges
  const isHighlight = (x === 1 && y >= 1 && y < h - 1) || (y === 1 && x >= 1 && x < w - 1);
  // Shadow on bottom-right edges
  const isShadow = (x === w - 2 && y >= 1 && y < h - 1) || (y === h - 2 && x >= 1 && x < w - 1);

  if (isBorder) {
    return { r: 64, g: 64, b: 64, a: 255 };
  }
  if (isHighlight) {
    return { r: 180, g: 180, b: 180, a: 255 };
  }
  if (isShadow) {
    return { r: 80, g: 80, b: 80, a: 255 };
  }
  return { ...COLORS.gray, a: 255 };
});
savePNG('public/assets/ui/button.png', buttonBuffer);

// 4. Player sprite sheet: 2 frames (32x48 each) → 64x48 total
// Frame 0: idle, Frame 1: idle variant (slight bob)
const playerSheetBuffer = createPNG(64, 48, (x, y) => {
  // Determine which frame we're in (0 or 1)
  const frame = Math.floor(x / 32);
  const localX = x % 32;

  // Frame 1 has a 1px vertical offset (bob effect)
  const yOffset = frame === 1 ? 1 : 0;
  const adjustedY = y - yOffset;

  // Outside shifted bounds → transparent
  if (adjustedY < 0 || adjustedY >= 48) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Penguin shape (same as original character, using adjustedY for bob)
  const isBody = localX >= 4 && localX < 28 && adjustedY >= 8 && adjustedY < 44;
  const isHead = localX >= 8 && localX < 24 && adjustedY >= 0 && adjustedY < 16;

  // White belly
  const isBelly = localX >= 10 && localX < 22 && adjustedY >= 16 && adjustedY < 40;

  // Eyes (white dots)
  const isLeftEye = localX >= 10 && localX < 14 && adjustedY >= 6 && adjustedY < 10;
  const isRightEye = localX >= 18 && localX < 22 && adjustedY >= 6 && adjustedY < 10;

  // Beak (orange)
  const isBeak = localX >= 14 && localX < 18 && adjustedY >= 10 && adjustedY < 14;

  // Feet (orange)
  const isFeet = (localX >= 8 && localX < 14 || localX >= 18 && localX < 24) && adjustedY >= 44 && adjustedY < 48;

  if (isLeftEye || isRightEye) {
    return { ...COLORS.white, a: 255 };
  }
  if (isBeak || isFeet) {
    return { ...COLORS.orange, a: 255 };
  }
  if (isBelly) {
    return { ...COLORS.white, a: 255 };
  }
  if (isBody || isHead) {
    return { ...COLORS.darkBlue, a: 255 };
  }
  // Transparent background
  return { r: 0, g: 0, b: 0, a: 0 };
});
savePNG('public/assets/sprites/player-sheet.png', playerSheetBuffer);

console.log('\nAll placeholder assets generated successfully!');
