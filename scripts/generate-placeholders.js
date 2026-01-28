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

// 5. Player walk sprite sheet: 4 frames (32x48 each) → 128x48 total
// Frame 0: left foot forward, Frame 1: standing, Frame 2: right foot forward, Frame 3: standing (mirror)
const playerWalkBuffer = createPNG(128, 48, (x, y) => {
  const frame = Math.floor(x / 32);
  const localX = x % 32;

  // Leg offsets per frame to simulate walking
  // Frame 0: left leg forward (shift left foot down)
  // Frame 1: mid-stride (normal stance, slight bob up)
  // Frame 2: right leg forward (shift right foot down)
  // Frame 3: mid-stride (normal stance, slight bob up)
  const bobOffset = (frame === 1 || frame === 3) ? -1 : 0;
  const adjustedY = y - bobOffset;

  if (adjustedY < 0 || adjustedY >= 48) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Body (same base penguin shape)
  const isBody = localX >= 4 && localX < 28 && adjustedY >= 8 && adjustedY < 44;
  const isHead = localX >= 8 && localX < 24 && adjustedY >= 0 && adjustedY < 16;
  const isBelly = localX >= 10 && localX < 22 && adjustedY >= 16 && adjustedY < 40;
  const isLeftEye = localX >= 10 && localX < 14 && adjustedY >= 6 && adjustedY < 10;
  const isRightEye = localX >= 18 && localX < 22 && adjustedY >= 6 && adjustedY < 10;
  const isBeak = localX >= 14 && localX < 18 && adjustedY >= 10 && adjustedY < 14;

  // Animated feet per frame
  let isFeet = false;
  if (frame === 0) {
    // Left foot forward, right foot back
    isFeet = (localX >= 6 && localX < 12 && adjustedY >= 44 && adjustedY < 48) ||
             (localX >= 20 && localX < 26 && adjustedY >= 42 && adjustedY < 46);
  } else if (frame === 1) {
    // Normal stance
    isFeet = (localX >= 8 && localX < 14 && adjustedY >= 44 && adjustedY < 48) ||
             (localX >= 18 && localX < 24 && adjustedY >= 44 && adjustedY < 48);
  } else if (frame === 2) {
    // Right foot forward, left foot back
    isFeet = (localX >= 6 && localX < 12 && adjustedY >= 42 && adjustedY < 46) ||
             (localX >= 20 && localX < 26 && adjustedY >= 44 && adjustedY < 48);
  } else {
    // Normal stance (same as frame 1)
    isFeet = (localX >= 8 && localX < 14 && adjustedY >= 44 && adjustedY < 48) ||
             (localX >= 18 && localX < 24 && adjustedY >= 44 && adjustedY < 48);
  }

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
  return { r: 0, g: 0, b: 0, a: 0 };
});
savePNG('public/assets/sprites/player-walk-sheet.png', playerWalkBuffer);

// 6. NPC "Bubble" sprite sheet: 2 frames (32x48 each) → 64x48 total
// Visually distinct from player: lighter blue body, bigger eyes, rounder shape
const NPC_COLORS = {
  body: { r: 60, g: 80, b: 140 },       // Lighter blue body
  belly: { r: 220, g: 230, b: 255 },     // Light blue-white belly
  beak: { r: 255, g: 180, b: 50 },       // Yellow-orange beak
  eyes: { r: 255, g: 255, b: 255 },      // White eyes
  pupil: { r: 20, g: 20, b: 60 },        // Dark pupils
  feet: { r: 255, g: 180, b: 50 },       // Yellow-orange feet
};

const npcBubbleBuffer = createPNG(64, 48, (x, y) => {
  const frame = Math.floor(x / 32);
  const localX = x % 32;

  // Frame 1 has a 1px bob
  const bobOffset = frame === 1 ? 1 : 0;
  const adjustedY = y - bobOffset;

  if (adjustedY < 0 || adjustedY >= 48) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Rounder, slightly wider body for Bubble
  const isBody = localX >= 3 && localX < 29 && adjustedY >= 6 && adjustedY < 44;
  const isHead = localX >= 6 && localX < 26 && adjustedY >= 0 && adjustedY < 14;
  const isBelly = localX >= 9 && localX < 23 && adjustedY >= 14 && adjustedY < 40;

  // Bigger eyes for a friendly look
  const isLeftEye = localX >= 9 && localX < 14 && adjustedY >= 4 && adjustedY < 10;
  const isRightEye = localX >= 18 && localX < 23 && adjustedY >= 4 && adjustedY < 10;
  // Pupils inside eyes
  const isLeftPupil = localX >= 11 && localX < 13 && adjustedY >= 5 && adjustedY < 8;
  const isRightPupil = localX >= 20 && localX < 22 && adjustedY >= 5 && adjustedY < 8;

  // Beak
  const isBeak = localX >= 13 && localX < 19 && adjustedY >= 10 && adjustedY < 13;

  // Feet
  const isFeet = (localX >= 7 && localX < 14 || localX >= 18 && localX < 25) && adjustedY >= 44 && adjustedY < 48;

  if (isLeftPupil || isRightPupil) {
    return { ...NPC_COLORS.pupil, a: 255 };
  }
  if (isLeftEye || isRightEye) {
    return { ...NPC_COLORS.eyes, a: 255 };
  }
  if (isBeak || isFeet) {
    return { ...NPC_COLORS.beak, a: 255 };
  }
  if (isBelly) {
    return { ...NPC_COLORS.belly, a: 255 };
  }
  if (isBody || isHead) {
    return { ...NPC_COLORS.body, a: 255 };
  }
  return { r: 0, g: 0, b: 0, a: 0 };
});
savePNG('public/assets/sprites/npc-bubble-sheet.png', npcBubbleBuffer);

// 7. Portrait: Pip (48x48) — close-up of dark blue penguin face
const portraitPipBuffer = createPNG(48, 48, (x, y) => {
  // Dark blue background
  const bg = { r: 20, g: 20, b: 40 };

  // Round face shape (circle centered at 24,26, radius 20)
  const dx = x - 24;
  const dy = y - 26;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 22) return { ...bg, a: 255 };

  // Eyes (white with dark pupils)
  const isLeftEye = x >= 12 && x < 20 && y >= 16 && y < 24;
  const isRightEye = x >= 28 && x < 36 && y >= 16 && y < 24;
  const isLeftPupil = x >= 15 && x < 18 && y >= 18 && y < 22;
  const isRightPupil = x >= 31 && x < 34 && y >= 18 && y < 22;

  // Beak
  const isBeak = x >= 19 && x < 29 && y >= 24 && y < 30;

  // White belly/chin
  const isChin = x >= 16 && x < 32 && y >= 30 && y < 42;

  if (isLeftPupil || isRightPupil) return { r: 10, g: 10, b: 30, a: 255 };
  if (isLeftEye || isRightEye) return { ...COLORS.white, a: 255 };
  if (isBeak) return { ...COLORS.orange, a: 255 };
  if (isChin) return { ...COLORS.white, a: 255 };
  // Face color (dark blue)
  return { ...COLORS.darkBlue, a: 255 };
});
savePNG('public/assets/portraits/pip.png', portraitPipBuffer);

// 8. Portrait: Bubble (48x48) — close-up of lighter blue penguin face
const portraitBubbleBuffer = createPNG(48, 48, (x, y) => {
  const bg = { r: 20, g: 20, b: 40 };

  const dx = x - 24;
  const dy = y - 26;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 22) return { ...bg, a: 255 };

  // Bigger, friendlier eyes
  const isLeftEye = x >= 10 && x < 20 && y >= 14 && y < 24;
  const isRightEye = x >= 28 && x < 38 && y >= 14 && y < 24;
  const isLeftPupil = x >= 14 && x < 18 && y >= 16 && y < 21;
  const isRightPupil = x >= 32 && x < 36 && y >= 16 && y < 21;

  // Beak (yellow-orange)
  const isBeak = x >= 18 && x < 30 && y >= 24 && y < 30;

  // Belly/chin
  const isChin = x >= 14 && x < 34 && y >= 30 && y < 42;

  if (isLeftPupil || isRightPupil) return { ...NPC_COLORS.pupil, a: 255 };
  if (isLeftEye || isRightEye) return { ...NPC_COLORS.eyes, a: 255 };
  if (isBeak) return { ...NPC_COLORS.beak, a: 255 };
  if (isChin) return { ...NPC_COLORS.belly, a: 255 };
  return { ...NPC_COLORS.body, a: 255 };
});
savePNG('public/assets/portraits/bubble.png', portraitBubbleBuffer);

// 9. Pattern Elements sprite sheet: 7 frames (32x32 each) → 224x32 total
// Each frame is a colored shape icon representing one of the Seven Sacred Elements:
// Frame 0: Ice-White Dot, Frame 1: Deep-Blue Line, Frame 2: Aurora-Green Triangle,
// Frame 3: Sunset-Orange Square, Frame 4: Shadow-Purple Pentagon,
// Frame 5: Starlight-Silver Hexagon, Frame 6: Quantum-Gold Heptagon
const ELEMENT_COLORS = [
  { r: 232, g: 240, b: 255 }, // 0: ice-white
  { r: 26, g: 58, b: 138 },   // 1: deep-blue
  { r: 42, g: 255, b: 106 },  // 2: aurora-green
  { r: 255, g: 106, b: 42 },  // 3: sunset-orange
  { r: 138, g: 42, b: 170 },  // 4: shadow-purple
  { r: 192, g: 200, b: 224 }, // 5: starlight-silver
  { r: 255, g: 215, b: 0 },   // 6: quantum-gold
];

/**
 * Draw a regular polygon with N sides centered at (cx, cy) with given radius.
 * Returns true if point (px, py) is inside the polygon.
 */
function isInsideRegularPolygon(px, py, cx, cy, radius, sides, rotation) {
  // Generate polygon vertices
  const vertices = [];
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (2 * Math.PI * i) / sides;
    vertices.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  // Point-in-polygon test (ray casting)
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const vi = vertices[i];
    const vj = vertices[j];
    if ((vi.y > py) !== (vj.y > py) &&
        px < ((vj.x - vi.x) * (py - vi.y)) / (vj.y - vi.y) + vi.x) {
      inside = !inside;
    }
  }
  return inside;
}

const patternElementsBuffer = createPNG(224, 32, (x, y) => {
  const frame = Math.floor(x / 32);
  const localX = x % 32;
  const cx = 16; // Center of 32x32 frame
  const cy = 16;
  const color = ELEMENT_COLORS[frame];
  const bg = { r: 20, g: 20, b: 40 }; // Dark background matching UI theme

  // Distance from center
  const dx = localX - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Draw a 1px border around each frame cell
  const isBorder = localX === 0 || localX === 31 || y === 0 || y === 31;
  if (isBorder) {
    return { r: 40, g: 40, b: 60, a: 255 };
  }

  let isShape = false;

  switch (frame) {
    case 0: // Dot (filled circle, radius 6)
      isShape = dist <= 6;
      break;

    case 1: // Line (horizontal bar, 20x4)
      isShape = localX >= 6 && localX < 26 && y >= 14 && y < 18;
      break;

    case 2: // Triangle (equilateral, pointing up)
      isShape = isInsideRegularPolygon(localX, y, cx, cy + 2, 11, 3, -Math.PI / 2);
      break;

    case 3: // Square (axis-aligned, 16x16)
      isShape = localX >= 8 && localX < 24 && y >= 8 && y < 24;
      break;

    case 4: // Pentagon (pointing up)
      isShape = isInsideRegularPolygon(localX, y, cx, cy, 11, 5, -Math.PI / 2);
      break;

    case 5: // Hexagon (flat top)
      isShape = isInsideRegularPolygon(localX, y, cx, cy, 12, 6, 0);
      break;

    case 6: // Heptagon (pointing up)
      isShape = isInsideRegularPolygon(localX, y, cx, cy, 12, 7, -Math.PI / 2);
      break;
  }

  if (isShape) {
    return { ...color, a: 255 };
  }

  return { ...bg, a: 255 };
});
savePNG('public/assets/sprites/pattern-elements.png', patternElementsBuffer);

console.log('\nAll placeholder assets generated successfully!');
