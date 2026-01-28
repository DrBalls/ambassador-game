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

// ────────────────────────────────────────────────────────────────────────
// Pattern Display Component
// ────────────────────────────────────────────────────────────────────────

/** Delay between each element reveal in the pattern sequence (ms) */
const DISPLAY_STEP_DELAY = 500;

/** Duration each tone plays (ms) */
const TONE_DURATION = 300;

/** Depth layer for pattern display UI (below dialogue at 200, above gameplay) */
const PATTERN_DISPLAY_DEPTH = 150;

/**
 * PatternDisplay — Shows a sequence of sacred elements one at a time.
 *
 * Each element appears with its colored shape sprite and plays its
 * corresponding musical tone via the Web Audio API. The sequence can
 * be replayed on demand and supports 3, 5, or 7 element lengths.
 *
 * Usage:
 *   const display = new PatternDisplay(scene, [0, 2, 4]); // 3-element sequence
 *   display.play();             // start the sequence
 *   display.replay();           // replay from the beginning
 *   display.destroy();          // clean up when done
 */
export class PatternDisplay {
  private scene: Phaser.Scene;
  private sequence: SacredElement[];
  private container: Phaser.GameObjects.Container;
  private slotSprites: Phaser.GameObjects.Sprite[] = [];
  private slotBackgrounds: Phaser.GameObjects.Rectangle[] = [];
  private replayButton: Phaser.GameObjects.Container | null = null;
  private audioContext: AudioContext | null = null;
  private currentStep = 0;
  private isPlaying = false;
  private stepTimer: Phaser.Time.TimerEvent | null = null;
  private label: Phaser.GameObjects.Text;

  /**
   * @param scene - The Phaser scene to render in
   * @param elementIndices - Array of base-7 digit indices (0-6) forming the pattern.
   *                         Length must be 3, 5, or 7.
   */
  constructor(scene: Phaser.Scene, elementIndices: number[]) {
    this.scene = scene;

    // Validate sequence length
    if (elementIndices.length !== 3 && elementIndices.length !== 5 && elementIndices.length !== 7) {
      console.warn(`PatternDisplay: expected 3, 5, or 7 elements, got ${elementIndices.length}`);
    }

    // Resolve element indices to SacredElement objects
    this.sequence = elementIndices
      .map(i => getSacredElement(i))
      .filter((el): el is SacredElement => el !== null);

    // Create the display container centered in the viewport
    this.container = scene.add.container(160, 50);
    this.container.setDepth(PATTERN_DISPLAY_DEPTH);

    // Label above the pattern slots
    this.label = scene.add.text(0, -24, 'Observe the pattern...', {
      fontSize: '8px',
      fontFamily: 'Arial',
      color: '#c0c8e0',
    });
    this.label.setOrigin(0.5, 0.5);
    this.container.add(this.label);

    // Create element slots (centered row)
    this.createSlots();

    // Create replay button below the slots
    this.createReplayButton();

    // Try to initialise Web Audio (may fail before user gesture)
    this.initAudio();
  }

  /**
   * Create the row of slots for displaying pattern elements.
   * Slots are empty rectangles initially; sprites are revealed during play().
   */
  private createSlots(): void {
    const slotSize = 32;
    const gap = 4;
    const count = this.sequence.length;
    const totalWidth = count * slotSize + (count - 1) * gap;
    const startX = -totalWidth / 2 + slotSize / 2;

    for (let i = 0; i < count; i++) {
      const x = startX + i * (slotSize + gap);

      // Slot background (dark rounded rectangle)
      const bg = this.scene.add.rectangle(x, 0, slotSize, slotSize, 0x111122);
      bg.setStrokeStyle(1, 0x334466);
      this.container.add(bg);
      this.slotBackgrounds.push(bg);

      // Slot sprite (hidden initially)
      const element = this.sequence[i]!;
      const sprite = this.scene.add.sprite(x, 0, PATTERN_SPRITE_CONFIG.textureKey, element.index);
      sprite.setVisible(false);
      sprite.setAlpha(0);
      this.container.add(sprite);
      this.slotSprites.push(sprite);
    }
  }

  /**
   * Create a "Replay" button below the pattern slots.
   */
  private createReplayButton(): void {
    const btnBg = this.scene.add.rectangle(0, 28, 48, 14, 0x1a3a8a);
    btnBg.setStrokeStyle(1, 0x4488cc);
    btnBg.setInteractive({ useHandCursor: true });

    const btnText = this.scene.add.text(0, 28, 'Replay', {
      fontSize: '7px',
      fontFamily: 'Arial',
      color: '#c0c8e0',
    });
    btnText.setOrigin(0.5, 0.5);

    // Hover effects
    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x2a4aaa);
      btnText.setColor('#ffffff');
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x1a3a8a);
      btnText.setColor('#c0c8e0');
    });
    btnBg.on('pointerdown', () => {
      this.replay();
    });

    this.replayButton = this.scene.add.container(0, 0, [btnBg, btnText]);
    this.container.add(this.replayButton);
  }

  /**
   * Initialise the Web Audio context for tone playback.
   */
  private initAudio(): void {
    try {
      this.audioContext = new AudioContext();
    } catch {
      console.warn('PatternDisplay: Web Audio API not available');
    }
  }

  /**
   * Play a sine-wave tone at the given frequency.
   */
  private playTone(frequency: number): void {
    if (!this.audioContext) {
      this.initAudio();
    }
    if (!this.audioContext) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Envelope: quick fade in, sustain, fade out
    const now = this.audioContext.currentTime;
    const durationSec = TONE_DURATION / 1000;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.linearRampToValueAtTime(0.3, now + durationSec * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + durationSec);

    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + durationSec);
  }

  /**
   * Start playing the pattern sequence from the beginning.
   * Elements are revealed one at a time with DISPLAY_STEP_DELAY between each.
   */
  play(): void {
    if (this.isPlaying) return;

    // Reset all slots to hidden
    this.resetSlots();
    this.currentStep = 0;
    this.isPlaying = true;
    this.label.setText('Observe the pattern...');

    // Show each element in sequence
    this.showNextElement();
  }

  /**
   * Replay the pattern from the beginning.
   */
  replay(): void {
    // Stop any in-progress playback
    this.stopPlayback();
    this.play();
  }

  /**
   * Reveal the next element in the sequence.
   */
  private showNextElement(): void {
    if (this.currentStep >= this.sequence.length) {
      // Sequence complete
      this.isPlaying = false;
      this.label.setText('Pattern complete!');
      this.scene.events.emit('pattern:displayComplete');
      return;
    }

    const element = this.sequence[this.currentStep]!;
    const sprite = this.slotSprites[this.currentStep]!;
    const bg = this.slotBackgrounds[this.currentStep]!;

    // Reveal the sprite with a quick fade-in and scale pop
    sprite.setVisible(true);
    sprite.setAlpha(0);
    sprite.setScale(0.5);

    this.scene.tweens.add({
      targets: sprite,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Highlight the slot background with the element's color
    const rgb = element.colorRGB;
    bg.setStrokeStyle(2, Phaser.Display.Color.GetColor(rgb.r, rgb.g, rgb.b));

    // Play the corresponding tone
    this.playTone(element.toneFrequency);

    this.currentStep++;

    // Schedule next element
    this.stepTimer = this.scene.time.addEvent({
      delay: DISPLAY_STEP_DELAY,
      callback: () => this.showNextElement(),
    });
  }

  /**
   * Reset all slots to their hidden/empty state.
   */
  private resetSlots(): void {
    for (const sprite of this.slotSprites) {
      sprite.setVisible(false);
      sprite.setAlpha(0);
      sprite.setScale(1);
    }
    for (const bg of this.slotBackgrounds) {
      bg.setStrokeStyle(1, 0x334466);
    }
  }

  /**
   * Stop any in-progress sequence playback.
   */
  private stopPlayback(): void {
    if (this.stepTimer) {
      this.stepTimer.destroy();
      this.stepTimer = null;
    }
    this.isPlaying = false;
  }

  /**
   * Whether the display is currently playing a sequence.
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get the sequence of elements being displayed.
   */
  getSequence(): readonly SacredElement[] {
    return this.sequence;
  }

  /**
   * Show or hide the entire display.
   */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Clean up all game objects and audio resources.
   */
  destroy(): void {
    this.stopPlayback();

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }

    this.container.destroy();
    this.slotSprites = [];
    this.slotBackgrounds = [];
    this.replayButton = null;
  }
}
