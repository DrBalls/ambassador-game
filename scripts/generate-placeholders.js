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

// 10. Counting Spot background: 320x200 — dawn sky with stars, ice edge, telescope
// This is Pip's private counting spot at the edge of the colony, facing the sky.
const COUNTING_SPOT_COLORS = {
  skyTop: { r: 10, g: 8, b: 30 },        // Deep night sky at top
  skyMid: { r: 30, g: 20, b: 60 },       // Transition purple
  skyHorizon: { r: 80, g: 50, b: 90 },   // Dawn glow purple
  dawnGlow: { r: 140, g: 70, b: 60 },    // Warm dawn orange-red
  iceBase: { r: 180, g: 200, b: 220 },   // Light blue-white ice
  iceShadow: { r: 100, g: 120, b: 160 }, // Ice shadow blue
  iceDark: { r: 60, g: 75, b: 110 },     // Deeper ice shadow
  starWhite: { r: 255, g: 255, b: 240 }, // Warm white stars
  starBlue: { r: 200, g: 220, b: 255 },  // Cool blue stars
  telescope: { r: 80, g: 70, b: 50 },    // Dark bronze telescope
  telescopeLens: { r: 140, g: 180, b: 220 }, // Lens reflection
};

// Pre-computed star positions (seeded pseudo-random)
const countingSpotStars = [];
let seed = 42;
function seededRandom() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed >> 16) / 32768;
}
// 21 normal stars + 1 wrong-colored star (22 total, as per story — Pip counts 21 normal, 1 wrong color)
for (let i = 0; i < 22; i++) {
  countingSpotStars.push({
    x: Math.floor(seededRandom() * 300) + 10,
    y: Math.floor(seededRandom() * 55) + 3,
    size: seededRandom() > 0.7 ? 2 : 1,
    wrongColor: i === 21, // last star is the "wrong color" one
  });
}

const countingSpotBuffer = createPNG(320, 200, (x, y) => {
  // Sky gradient (top 80px)
  if (y < 80) {
    // Check for stars first
    for (const star of countingSpotStars) {
      const sdx = x - star.x;
      const sdy = y - star.y;
      if (Math.abs(sdx) <= star.size && Math.abs(sdy) <= star.size && (Math.abs(sdx) + Math.abs(sdy) <= star.size + 1)) {
        if (star.wrongColor) {
          // The one "wrong" star — aurora-green tint
          return { r: 100, g: 255, b: 140, a: 255 };
        }
        return star.size > 1 ? { ...COUNTING_SPOT_COLORS.starWhite, a: 255 } : { ...COUNTING_SPOT_COLORS.starBlue, a: 255 };
      }
    }

    // Sky gradient
    const t = y / 80;
    let r, g, b;
    if (t < 0.5) {
      // Top to mid
      const lt = t * 2;
      r = Math.floor(COUNTING_SPOT_COLORS.skyTop.r + (COUNTING_SPOT_COLORS.skyMid.r - COUNTING_SPOT_COLORS.skyTop.r) * lt);
      g = Math.floor(COUNTING_SPOT_COLORS.skyTop.g + (COUNTING_SPOT_COLORS.skyMid.g - COUNTING_SPOT_COLORS.skyTop.g) * lt);
      b = Math.floor(COUNTING_SPOT_COLORS.skyTop.b + (COUNTING_SPOT_COLORS.skyMid.b - COUNTING_SPOT_COLORS.skyTop.b) * lt);
    } else {
      // Mid to horizon
      const lt = (t - 0.5) * 2;
      r = Math.floor(COUNTING_SPOT_COLORS.skyMid.r + (COUNTING_SPOT_COLORS.skyHorizon.r - COUNTING_SPOT_COLORS.skyMid.r) * lt);
      g = Math.floor(COUNTING_SPOT_COLORS.skyMid.g + (COUNTING_SPOT_COLORS.skyHorizon.g - COUNTING_SPOT_COLORS.skyMid.g) * lt);
      b = Math.floor(COUNTING_SPOT_COLORS.skyMid.b + (COUNTING_SPOT_COLORS.skyHorizon.b - COUNTING_SPOT_COLORS.skyMid.b) * lt);
    }

    // Add dawn glow near horizon (y 60-80, concentrated at center-right)
    if (y > 60) {
      const glowT = (y - 60) / 20;
      const horizonDist = Math.abs(x - 220) / 160;
      const glowStrength = glowT * Math.max(0, 1 - horizonDist);
      r = Math.floor(r + (COUNTING_SPOT_COLORS.dawnGlow.r - r) * glowStrength * 0.6);
      g = Math.floor(g + (COUNTING_SPOT_COLORS.dawnGlow.g - g) * glowStrength * 0.4);
      b = Math.floor(b + (COUNTING_SPOT_COLORS.dawnGlow.b - b) * glowStrength * 0.3);
    }

    return { r, g, b, a: 255 };
  }

  // Ice and ground area (y 80-200)
  // Ice edge / cliff (y 80-95)
  if (y < 95) {
    const edgeT = (y - 80) / 15;
    // Jagged ice edge silhouette
    const jaggedness = Math.sin(x * 0.15) * 3 + Math.sin(x * 0.3) * 2;
    if (y < 82 + jaggedness) {
      // Sky showing through jagged edge
      const t2 = 0.95;
      const r2 = Math.floor(COUNTING_SPOT_COLORS.skyHorizon.r + (COUNTING_SPOT_COLORS.dawnGlow.r - COUNTING_SPOT_COLORS.skyHorizon.r) * 0.3);
      const g2 = Math.floor(COUNTING_SPOT_COLORS.skyHorizon.g);
      const b2 = Math.floor(COUNTING_SPOT_COLORS.skyHorizon.b);
      return { r: r2, g: g2, b: b2, a: 255 };
    }
    // Ice edge face (lighter at top, darker below)
    const r = Math.floor(COUNTING_SPOT_COLORS.iceBase.r - edgeT * 40);
    const g = Math.floor(COUNTING_SPOT_COLORS.iceBase.g - edgeT * 40);
    const b = Math.floor(COUNTING_SPOT_COLORS.iceBase.b - edgeT * 20);
    return { r, g, b, a: 255 };
  }

  // Telescope (at x 250-268, y 78-115) — tripod with tube
  // Tripod legs
  const isTripodLeft = Math.abs(x - (259 - (y - 100) * 0.3)) < 1 && y >= 100 && y < 116;
  const isTripodRight = Math.abs(x - (259 + (y - 100) * 0.3)) < 1 && y >= 100 && y < 116;
  const isTripodCenter = x === 259 && y >= 95 && y < 105;
  // Telescope tube (angled upward to the right)
  const tubeAngle = -0.4; // radians
  const tubeCx = 259;
  const tubeCy = 95;
  const tubeLen = 20;
  const relX = x - tubeCx;
  const relY = y - tubeCy;
  const along = relX * Math.cos(tubeAngle) + relY * Math.sin(tubeAngle);
  const perp = Math.abs(-relX * Math.sin(tubeAngle) + relY * Math.cos(tubeAngle));
  const isTube = along >= -tubeLen && along <= tubeLen * 0.3 && perp < 2.5;
  const isLens = along < -tubeLen && along >= -tubeLen - 3 && perp < 3.5;

  if (isTripodLeft || isTripodRight || isTripodCenter || isTube) {
    return { ...COUNTING_SPOT_COLORS.telescope, a: 255 };
  }
  if (isLens) {
    return { ...COUNTING_SPOT_COLORS.telescopeLens, a: 255 };
  }

  // Ice marks / scratches on the wall (y 95-110, x 40-90) — Pool's mysterious writing
  if (y >= 96 && y < 108 && x >= 42 && x < 88) {
    // Scratched marks — thin lines at various angles
    const markGroup = Math.floor((x - 42) / 8);
    const markX = (x - 42) % 8;
    // Vertical-ish marks in groups of varying heights
    const markHeights = [8, 10, 7, 9, 11, 6];
    const mh = markHeights[markGroup % markHeights.length];
    const markStart = 96 + (12 - mh) / 2;
    if (markX === 2 && y >= markStart && y < markStart + mh) {
      return { r: 150, g: 170, b: 200, a: 255 }; // Lighter scratch color
    }
    // Diagonal accent marks
    if (markX === 4 && markGroup % 3 === 0 && y >= markStart + 2 && y < markStart + mh - 2) {
      return { r: 140, g: 160, b: 190, a: 255 };
    }
  }

  // Main ice ground surface
  // Add subtle ice texture variation
  const noiseVal = Math.sin(x * 0.2 + y * 0.1) * 0.3 + Math.sin(x * 0.05 + y * 0.15) * 0.2;
  const depthT = (y - 95) / 105; // 0 at top of ground, 1 at bottom
  const baseR = Math.floor(COUNTING_SPOT_COLORS.iceShadow.r + (COUNTING_SPOT_COLORS.iceBase.r - COUNTING_SPOT_COLORS.iceShadow.r) * (1 - depthT * 0.5));
  const baseG = Math.floor(COUNTING_SPOT_COLORS.iceShadow.g + (COUNTING_SPOT_COLORS.iceBase.g - COUNTING_SPOT_COLORS.iceShadow.g) * (1 - depthT * 0.5));
  const baseB = Math.floor(COUNTING_SPOT_COLORS.iceShadow.b + (COUNTING_SPOT_COLORS.iceBase.b - COUNTING_SPOT_COLORS.iceShadow.b) * (1 - depthT * 0.5));

  const texR = Math.max(0, Math.min(255, Math.floor(baseR + noiseVal * 15)));
  const texG = Math.max(0, Math.min(255, Math.floor(baseG + noiseVal * 15)));
  const texB = Math.max(0, Math.min(255, Math.floor(baseB + noiseVal * 10)));

  return { r: texR, g: texG, b: texB, a: 255 };
});
savePNG('public/assets/backgrounds/counting-spot.png', countingSpotBuffer);

// 11. Colony Gathering background: 320x200 — ice colony spiral, many penguins, ice shelves
// The main colony area where penguins gather in spiral formation.
const COLONY_COLORS = {
  skyTop: { r: 20, g: 25, b: 60 },       // Dark blue-purple sky
  skyBottom: { r: 60, g: 70, b: 120 },    // Lighter blue sky
  iceGround: { r: 170, g: 190, b: 210 },  // Light blue-white ice ground
  iceShadow: { r: 110, g: 130, b: 165 },  // Ice shadow
  iceShelf: { r: 140, g: 160, b: 190 },   // Raised ice shelf
  iceShelfEdge: { r: 90, g: 110, b: 150 },// Ice shelf edge shadow
  penguinBody: { r: 20, g: 20, b: 40 },   // Dark penguin body (background penguins)
  penguinBelly: { r: 200, g: 210, b: 230 },// White-ish belly
  boardWood: { r: 90, g: 60, b: 35 },     // Depth call board wood
  boardText: { r: 180, g: 160, b: 120 },  // Board scratched text
};

// Pre-computed background penguin positions for the colony spiral
const colonyPenguins = [];
seed = 137; // reset seeded random for deterministic positions
for (let i = 0; i < 18; i++) {
  // Spiral-ish formation
  const angle = i * 0.6;
  const radius = 30 + i * 6;
  const centerX = 160;
  const centerY = 65;
  colonyPenguins.push({
    x: Math.floor(centerX + Math.cos(angle) * radius * 0.8 + (seededRandom() - 0.5) * 20),
    y: Math.floor(centerY + Math.sin(angle) * radius * 0.3 + (seededRandom() - 0.5) * 8),
    size: seededRandom() > 0.5 ? 1 : 0, // 1 = larger (closer), 0 = smaller (further)
  });
}

const colonyGatheringBuffer = createPNG(320, 200, (x, y) => {
  // Sky area (top 45px)
  if (y < 45) {
    const t = y / 45;
    const r = Math.floor(COLONY_COLORS.skyTop.r + (COLONY_COLORS.skyBottom.r - COLONY_COLORS.skyTop.r) * t);
    const g = Math.floor(COLONY_COLORS.skyTop.g + (COLONY_COLORS.skyBottom.g - COLONY_COLORS.skyTop.g) * t);
    const b = Math.floor(COLONY_COLORS.skyTop.b + (COLONY_COLORS.skyBottom.b - COLONY_COLORS.skyTop.b) * t);
    return { r, g, b, a: 255 };
  }

  // Horizon/ice shelf area (y 45-55) — jagged ice horizon
  if (y < 55) {
    const jagged = Math.sin(x * 0.1) * 3 + Math.sin(x * 0.25) * 2;
    if (y < 47 + jagged) {
      // sky peeking through
      const t = 0.95;
      return { ...COLONY_COLORS.skyBottom, a: 255 };
    }
    return { ...COLONY_COLORS.iceShelf, a: 255 };
  }

  // Check for background penguins (small 4x6 or 6x8 shapes)
  for (const pen of colonyPenguins) {
    const pw = pen.size ? 6 : 4;
    const ph = pen.size ? 8 : 6;
    if (x >= pen.x - pw / 2 && x < pen.x + pw / 2 && y >= pen.y - ph && y < pen.y) {
      // Upper half = dark body
      if (y < pen.y - ph / 2) {
        return { ...COLONY_COLORS.penguinBody, a: 255 };
      }
      // Lower half center = white belly
      const bellyW = pw / 2;
      if (x >= pen.x - bellyW / 2 && x < pen.x + bellyW / 2) {
        return { ...COLONY_COLORS.penguinBelly, a: 255 };
      }
      return { ...COLONY_COLORS.penguinBody, a: 255 };
    }
  }

  // Depth call board (wooden sign at x 220-260, y 55-75)
  if (x >= 222 && x < 258 && y >= 56 && y < 74) {
    // Board border
    if (x === 222 || x === 257 || y === 56 || y === 73) {
      return { r: 60, g: 40, b: 20, a: 255 };
    }
    // Board surface
    if (y >= 58 && y < 72 && x >= 224 && x < 256) {
      // Scratched "text" lines
      if ((y === 60 || y === 64 || y === 68) && x >= 226 && x < 254 && x % 3 !== 0) {
        return { ...COLONY_COLORS.boardText, a: 255 };
      }
      return { ...COLONY_COLORS.boardWood, a: 255 };
    }
    return { ...COLONY_COLORS.boardWood, a: 255 };
  }
  // Board post
  if (x >= 238 && x < 242 && y >= 74 && y < 85) {
    return { r: 70, g: 50, b: 30, a: 255 };
  }

  // Raised ice shelves (platforms) — left shelf and right shelf
  // Left ice shelf (x 0-60, y 55-70)
  if (x < 60 && y >= 55 && y < 70) {
    if (y < 58) {
      return { ...COLONY_COLORS.iceShelf, a: 255 };
    }
    const edgeT = (y - 58) / 12;
    const r = Math.floor(COLONY_COLORS.iceShelf.r - edgeT * 30);
    const g = Math.floor(COLONY_COLORS.iceShelf.g - edgeT * 30);
    const b = Math.floor(COLONY_COLORS.iceShelf.b - edgeT * 20);
    return { r, g, b, a: 255 };
  }

  // Right ice shelf (x 270-320, y 55-65)
  if (x >= 270 && y >= 55 && y < 65) {
    if (y < 57) {
      return { ...COLONY_COLORS.iceShelf, a: 255 };
    }
    return { ...COLONY_COLORS.iceShelfEdge, a: 255 };
  }

  // Main ice ground
  const noiseVal = Math.sin(x * 0.15 + y * 0.08) * 0.3 + Math.sin(x * 0.06 + y * 0.12) * 0.2;
  const depthT = Math.max(0, (y - 55) / 145);
  const baseR = Math.floor(COLONY_COLORS.iceShadow.r + (COLONY_COLORS.iceGround.r - COLONY_COLORS.iceShadow.r) * (1 - depthT * 0.3));
  const baseG = Math.floor(COLONY_COLORS.iceShadow.g + (COLONY_COLORS.iceGround.g - COLONY_COLORS.iceShadow.g) * (1 - depthT * 0.3));
  const baseB = Math.floor(COLONY_COLORS.iceShadow.b + (COLONY_COLORS.iceGround.b - COLONY_COLORS.iceShadow.b) * (1 - depthT * 0.3));

  // Gathering area circle (center of room, slightly worn ice)
  const gatherDx = x - 160;
  const gatherDy = (y - 85) * 2; // elliptical
  const gatherDist = Math.sqrt(gatherDx * gatherDx + gatherDy * gatherDy);
  let extraBright = 0;
  if (gatherDist < 60) {
    extraBright = Math.floor((1 - gatherDist / 60) * 15);
  }

  const texR = Math.max(0, Math.min(255, Math.floor(baseR + noiseVal * 12 + extraBright)));
  const texG = Math.max(0, Math.min(255, Math.floor(baseG + noiseVal * 12 + extraBright)));
  const texB = Math.max(0, Math.min(255, Math.floor(baseB + noiseVal * 8 + extraBright)));

  return { r: texR, g: texG, b: texB, a: 255 };
});
savePNG('public/assets/backgrounds/colony-gathering.png', colonyGatheringBuffer);

// 12. NPC "Commander Frost" sprite sheet: 2 frames (32x48 each) → 64x48
// Taller, stern-looking penguin with slightly darker coloring and a scar mark
const FROST_COLORS = {
  body: { r: 25, g: 30, b: 55 },        // Dark navy body
  belly: { r: 190, g: 195, b: 210 },    // Gray-white belly
  beak: { r: 200, g: 140, b: 40 },      // Darker orange beak
  eyes: { r: 220, g: 220, b: 230 },     // Slightly cold white eyes
  pupil: { r: 10, g: 10, b: 30 },       // Dark pupils
  feet: { r: 200, g: 140, b: 40 },      // Darker orange feet
  scar: { r: 160, g: 160, b: 180 },     // Scar line across face
};

const npcFrostBuffer = createPNG(64, 48, (x, y) => {
  const frame = Math.floor(x / 32);
  const localX = x % 32;
  const bobOffset = frame === 1 ? 1 : 0;
  const adjustedY = y - bobOffset;

  if (adjustedY < 0 || adjustedY >= 48) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Slightly broader, taller-looking penguin (wider body)
  const isBody = localX >= 2 && localX < 30 && adjustedY >= 4 && adjustedY < 44;
  const isHead = localX >= 6 && localX < 26 && adjustedY >= 0 && adjustedY < 14;
  const isBelly = localX >= 9 && localX < 23 && adjustedY >= 14 && adjustedY < 40;

  // Smaller, stern eyes
  const isLeftEye = localX >= 9 && localX < 13 && adjustedY >= 5 && adjustedY < 9;
  const isRightEye = localX >= 19 && localX < 23 && adjustedY >= 5 && adjustedY < 9;
  const isLeftPupil = localX >= 10 && localX < 12 && adjustedY >= 6 && adjustedY < 8;
  const isRightPupil = localX >= 20 && localX < 22 && adjustedY >= 6 && adjustedY < 8;

  // Beak (slightly larger, authoritative)
  const isBeak = localX >= 12 && localX < 20 && adjustedY >= 9 && adjustedY < 13;

  // Scar across left side of face
  const isScar = adjustedY === 7 && localX >= 6 && localX < 10;

  // Feet
  const isFeet = (localX >= 6 && localX < 13 || localX >= 19 && localX < 26) && adjustedY >= 44 && adjustedY < 48;

  if (isScar) return { ...FROST_COLORS.scar, a: 255 };
  if (isLeftPupil || isRightPupil) return { ...FROST_COLORS.pupil, a: 255 };
  if (isLeftEye || isRightEye) return { ...FROST_COLORS.eyes, a: 255 };
  if (isBeak || isFeet) return { ...FROST_COLORS.beak, a: 255 };
  if (isBelly) return { ...FROST_COLORS.belly, a: 255 };
  if (isBody || isHead) return { ...FROST_COLORS.body, a: 255 };
  return { r: 0, g: 0, b: 0, a: 0 };
});
savePNG('public/assets/sprites/npc-frost-sheet.png', npcFrostBuffer);

// 13. Portrait: Commander Frost (48x48)
const portraitFrostBuffer = createPNG(48, 48, (x, y) => {
  const bg = { r: 15, g: 15, b: 35 };
  const dx = x - 24;
  const dy = y - 26;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 22) return { ...bg, a: 255 };

  // Stern, smaller eyes
  const isLeftEye = x >= 11 && x < 18 && y >= 16 && y < 22;
  const isRightEye = x >= 30 && x < 37 && y >= 16 && y < 22;
  const isLeftPupil = x >= 13 && x < 16 && y >= 17 && y < 20;
  const isRightPupil = x >= 32 && x < 35 && y >= 17 && y < 20;

  // Scar across left cheek
  const isScar = y >= 19 && y < 21 && x >= 6 && x < 14;

  // Beak
  const isBeak = x >= 18 && x < 30 && y >= 23 && y < 29;

  // Belly/chin
  const isChin = x >= 15 && x < 33 && y >= 30 && y < 42;

  if (isScar) return { ...FROST_COLORS.scar, a: 255 };
  if (isLeftPupil || isRightPupil) return { ...FROST_COLORS.pupil, a: 255 };
  if (isLeftEye || isRightEye) return { ...FROST_COLORS.eyes, a: 255 };
  if (isBeak) return { ...FROST_COLORS.beak, a: 255 };
  if (isChin) return { ...FROST_COLORS.belly, a: 255 };
  return { ...FROST_COLORS.body, a: 255 };
});
savePNG('public/assets/portraits/frost.png', portraitFrostBuffer);

// 14. NPC "Riptide" sprite sheet: 2 frames (32x48 each) → 64x48
// Larger, menacing penguin — broader body, narrow eyes, aggressive stance
const RIPTIDE_COLORS = {
  body: { r: 15, g: 15, b: 35 },        // Very dark body
  belly: { r: 180, g: 180, b: 195 },    // Grayish belly
  beak: { r: 220, g: 130, b: 30 },      // Sharp orange beak
  eyes: { r: 240, g: 200, b: 160 },     // Yellowish eyes
  pupil: { r: 15, g: 10, b: 10 },       // Dark red-black pupils
  feet: { r: 220, g: 130, b: 30 },      // Orange feet
};

const npcRiptideBuffer = createPNG(64, 48, (x, y) => {
  const frame = Math.floor(x / 32);
  const localX = x % 32;
  const bobOffset = frame === 1 ? 1 : 0;
  const adjustedY = y - bobOffset;

  if (adjustedY < 0 || adjustedY >= 48) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // Broader, bulkier body
  const isBody = localX >= 1 && localX < 31 && adjustedY >= 5 && adjustedY < 44;
  const isHead = localX >= 5 && localX < 27 && adjustedY >= 0 && adjustedY < 14;
  const isBelly = localX >= 10 && localX < 22 && adjustedY >= 14 && adjustedY < 38;

  // Narrow, aggressive eyes
  const isLeftEye = localX >= 8 && localX < 13 && adjustedY >= 6 && adjustedY < 9;
  const isRightEye = localX >= 19 && localX < 24 && adjustedY >= 6 && adjustedY < 9;
  const isLeftPupil = localX >= 10 && localX < 12 && adjustedY >= 7 && adjustedY < 9;
  const isRightPupil = localX >= 21 && localX < 23 && adjustedY >= 7 && adjustedY < 9;

  // Sharp beak
  const isBeak = localX >= 12 && localX < 20 && adjustedY >= 10 && adjustedY < 14;

  // Feet
  const isFeet = (localX >= 5 && localX < 13 || localX >= 19 && localX < 27) && adjustedY >= 44 && adjustedY < 48;

  if (isLeftPupil || isRightPupil) return { ...RIPTIDE_COLORS.pupil, a: 255 };
  if (isLeftEye || isRightEye) return { ...RIPTIDE_COLORS.eyes, a: 255 };
  if (isBeak || isFeet) return { ...RIPTIDE_COLORS.beak, a: 255 };
  if (isBelly) return { ...RIPTIDE_COLORS.belly, a: 255 };
  if (isBody || isHead) return { ...RIPTIDE_COLORS.body, a: 255 };
  return { r: 0, g: 0, b: 0, a: 0 };
});
savePNG('public/assets/sprites/npc-riptide-sheet.png', npcRiptideBuffer);

// 15. Portrait: Riptide (48x48)
const portraitRiptideBuffer = createPNG(48, 48, (x, y) => {
  const bg = { r: 10, g: 10, b: 25 };
  const dx = x - 24;
  const dy = y - 26;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 22) return { ...bg, a: 255 };

  // Narrow, menacing eyes
  const isLeftEye = x >= 9 && x < 18 && y >= 17 && y < 22;
  const isRightEye = x >= 30 && x < 39 && y >= 17 && y < 22;
  const isLeftPupil = x >= 13 && x < 16 && y >= 18 && y < 21;
  const isRightPupil = x >= 34 && x < 37 && y >= 18 && y < 21;

  // Sharp beak
  const isBeak = x >= 17 && x < 31 && y >= 24 && y < 30;

  // Belly/chin
  const isChin = x >= 14 && x < 34 && y >= 31 && y < 42;

  if (isLeftPupil || isRightPupil) return { ...RIPTIDE_COLORS.pupil, a: 255 };
  if (isLeftEye || isRightEye) return { ...RIPTIDE_COLORS.eyes, a: 255 };
  if (isBeak) return { ...RIPTIDE_COLORS.beak, a: 255 };
  if (isChin) return { ...RIPTIDE_COLORS.belly, a: 255 };
  return { ...RIPTIDE_COLORS.body, a: 255 };
});
savePNG('public/assets/portraits/riptide.png', portraitRiptideBuffer);

console.log('\nAll placeholder assets generated successfully!');
