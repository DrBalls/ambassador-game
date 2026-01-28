/**
 * PatternPuzzle - Base-7 pattern puzzle system for The Smallest Ambassador
 *
 * The Seven Sacred Elements represent base-7 mathematics used by the alien probe.
 * Each element has a color, tone (musical note), and shape.
 * Elements are indexed 0-6 corresponding to base-7 digits.
 */

/**
 * The seven sacred colors used in pattern puzzles
 */
export enum PatternColor {
  ICE_WHITE = 'ice-white',
  DEEP_BLUE = 'deep-blue',
  AURORA_GREEN = 'aurora-green',
  SUNSET_ORANGE = 'sunset-orange',
  SHADOW_PURPLE = 'shadow-purple',
  STARLIGHT_SILVER = 'starlight-silver',
  QUANTUM_GOLD = 'quantum-gold',
}

/**
 * The seven sacred tones (musical notes)
 */
export enum PatternTone {
  C4 = 'C4',
  D4 = 'D4',
  E4 = 'E4',
  F4 = 'F4',
  G4 = 'G4',
  A4 = 'A4',
  B4 = 'B4',
}

/**
 * The seven sacred shapes
 */
export enum PatternShape {
  DOT = 'dot',
  LINE = 'line',
  TRIANGLE = 'triangle',
  SQUARE = 'square',
  PENTAGON = 'pentagon',
  HEXAGON = 'hexagon',
  HEPTAGON = 'heptagon',
}

/**
 * A single sacred element combining color, tone, and shape
 */
export interface SacredElement {
  index: number; // 0-6 (base-7 digit)
  color: PatternColor;
  tone: PatternTone;
  shape: PatternShape;
  colorHex: string; // CSS hex color for rendering
  colorRGB: { r: number; g: number; b: number }; // RGB values for sprite generation
  toneFrequency: number; // Hz frequency for audio playback
}

/**
 * The Seven Sacred Elements — ordered by index (base-7 digit 0-6)
 */
export const SACRED_ELEMENTS: readonly SacredElement[] = [
  {
    index: 0,
    color: PatternColor.ICE_WHITE,
    tone: PatternTone.C4,
    shape: PatternShape.DOT,
    colorHex: '#e8f0ff',
    colorRGB: { r: 232, g: 240, b: 255 },
    toneFrequency: 261.63, // C4
  },
  {
    index: 1,
    color: PatternColor.DEEP_BLUE,
    tone: PatternTone.D4,
    shape: PatternShape.LINE,
    colorHex: '#1a3a8a',
    colorRGB: { r: 26, g: 58, b: 138 },
    toneFrequency: 293.66, // D4
  },
  {
    index: 2,
    color: PatternColor.AURORA_GREEN,
    tone: PatternTone.E4,
    shape: PatternShape.TRIANGLE,
    colorHex: '#2aff6a',
    colorRGB: { r: 42, g: 255, b: 106 },
    toneFrequency: 329.63, // E4
  },
  {
    index: 3,
    color: PatternColor.SUNSET_ORANGE,
    tone: PatternTone.F4,
    shape: PatternShape.SQUARE,
    colorHex: '#ff6a2a',
    colorRGB: { r: 255, g: 106, b: 42 },
    toneFrequency: 349.23, // F4
  },
  {
    index: 4,
    color: PatternColor.SHADOW_PURPLE,
    tone: PatternTone.G4,
    shape: PatternShape.PENTAGON,
    colorHex: '#8a2aaa',
    colorRGB: { r: 138, g: 42, b: 170 },
    toneFrequency: 392.0, // G4
  },
  {
    index: 5,
    color: PatternColor.STARLIGHT_SILVER,
    tone: PatternTone.A4,
    shape: PatternShape.HEXAGON,
    colorHex: '#c0c8e0',
    colorRGB: { r: 192, g: 200, b: 224 },
    toneFrequency: 440.0, // A4
  },
  {
    index: 6,
    color: PatternColor.QUANTUM_GOLD,
    tone: PatternTone.B4,
    shape: PatternShape.HEPTAGON,
    colorHex: '#ffd700',
    colorRGB: { r: 255, g: 215, b: 0 },
    toneFrequency: 493.88, // B4
  },
] as const;

/**
 * Sprite sheet configuration for pattern element icons
 */
export const PATTERN_SPRITE_CONFIG = {
  textureKey: 'pattern-elements',
  assetPath: 'assets/sprites/pattern-elements.png',
  frameWidth: 32,
  frameHeight: 32,
  frameCount: 7,
} as const;

/**
 * Get a sacred element by its index (base-7 digit)
 */
export function getSacredElement(index: number): SacredElement | null {
  return SACRED_ELEMENTS[index] ?? null;
}

/**
 * Get the frame index in the sprite sheet for a given element
 * (frame order matches element index: 0=dot, 1=line, ..., 6=heptagon)
 */
export function getElementFrameIndex(element: SacredElement): number {
  return element.index;
}
