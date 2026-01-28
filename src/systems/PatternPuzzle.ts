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

// ────────────────────────────────────────────────────────────────────────
// Pattern Input Component
// ────────────────────────────────────────────────────────────────────────

/** Depth layer for pattern input UI (same level as display) */
const PATTERN_INPUT_DEPTH = 150;

/**
 * PatternInput — Allows the player to input pattern sequences by clicking
 * the seven sacred element buttons.
 *
 * Shows 7 clickable shape buttons, a player sequence display area above them,
 * and Submit / Backspace controls. Validates the input against a target pattern
 * and emits success/failure events with visual flash feedback.
 *
 * Usage:
 *   const input = new PatternInput(scene, [0, 2, 4]); // target is 3-element sequence
 *   input.show();
 *   // listen for scene.events 'pattern:inputSuccess' or 'pattern:inputFail'
 *   input.destroy();
 */
export class PatternInput {
  private scene: Phaser.Scene;
  private targetSequence: number[]; // expected base-7 digit indices
  private expectedLength: number;
  private playerSequence: number[] = [];
  private container: Phaser.GameObjects.Container;
  private buttonSprites: Phaser.GameObjects.Sprite[] = [];
  private buttonBackgrounds: Phaser.GameObjects.Rectangle[] = [];
  private inputSlotSprites: Phaser.GameObjects.Sprite[] = [];
  private inputSlotBackgrounds: Phaser.GameObjects.Rectangle[] = [];
  private submitButton: Phaser.GameObjects.Container | null = null;
  private backspaceButton: Phaser.GameObjects.Container | null = null;
  private label: Phaser.GameObjects.Text;
  private audioContext: AudioContext | null = null;
  private flashOverlay: Phaser.GameObjects.Rectangle | null = null;
  private isActive = false;
  private onComplete: ((success: boolean) => void) | null = null;
  private backspaceKey: Phaser.Input.Keyboard.Key | null = null;

  /**
   * @param scene - The Phaser scene to render in
   * @param targetIndices - Array of base-7 digit indices (0-6) forming the target pattern.
   *                        Length must be 3, 5, or 7.
   * @param onComplete - Optional callback when puzzle is completed (success or fail is reset)
   */
  constructor(scene: Phaser.Scene, targetIndices: number[], onComplete?: (success: boolean) => void) {
    this.scene = scene;
    this.targetSequence = targetIndices;
    this.expectedLength = targetIndices.length;
    this.onComplete = onComplete ?? null;

    if (targetIndices.length !== 3 && targetIndices.length !== 5 && targetIndices.length !== 7) {
      console.warn(`PatternInput: expected 3, 5, or 7 elements, got ${targetIndices.length}`);
    }

    // Create the input container centered in the viewport
    this.container = scene.add.container(160, 60);
    this.container.setDepth(PATTERN_INPUT_DEPTH);

    // Label above the input area
    this.label = scene.add.text(0, -40, 'Input the pattern:', {
      fontSize: '8px',
      fontFamily: 'Arial',
      color: '#c0c8e0',
    });
    this.label.setOrigin(0.5, 0.5);
    this.container.add(this.label);

    // Create the player's input sequence display (empty slots at top)
    this.createInputSlots();

    // Create the 7 clickable element buttons (below input slots)
    this.createElementButtons();

    // Create submit and backspace buttons
    this.createControlButtons();

    // Flash overlay for success/fail feedback (covers the whole container area)
    this.flashOverlay = scene.add.rectangle(0, 0, 280, 100, 0x000000, 0);
    this.container.add(this.flashOverlay);

    // Init audio
    this.initAudio();

    // Keyboard: Backspace removes last input element
    this.backspaceKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE) ?? null;
    this.backspaceKey?.on('down', () => {
      if (!this.isActive) return;
      this.removeLastElement();
    });

    this.isActive = true;
  }

  /**
   * Create the row of empty slots showing the player's current input sequence.
   */
  private createInputSlots(): void {
    const slotSize = 24;
    const gap = 3;
    const count = this.expectedLength;
    const totalWidth = count * slotSize + (count - 1) * gap;
    const startX = -totalWidth / 2 + slotSize / 2;
    const y = -22;

    for (let i = 0; i < count; i++) {
      const x = startX + i * (slotSize + gap);

      // Slot background
      const bg = this.scene.add.rectangle(x, y, slotSize, slotSize, 0x111122);
      bg.setStrokeStyle(1, 0x334466);
      this.container.add(bg);
      this.inputSlotBackgrounds.push(bg);

      // Slot sprite (hidden until player inputs)
      const sprite = this.scene.add.sprite(x, y, PATTERN_SPRITE_CONFIG.textureKey, 0);
      sprite.setDisplaySize(slotSize - 4, slotSize - 4);
      sprite.setVisible(false);
      this.container.add(sprite);
      this.inputSlotSprites.push(sprite);
    }
  }

  /**
   * Create the 7 clickable sacred element buttons.
   */
  private createElementButtons(): void {
    const btnSize = 28;
    const gap = 4;
    const count = 7;
    const totalWidth = count * btnSize + (count - 1) * gap;
    const startX = -totalWidth / 2 + btnSize / 2;
    const y = 10;

    for (let i = 0; i < count; i++) {
      const element = SACRED_ELEMENTS[i]!;
      const x = startX + i * (btnSize + gap);

      // Button background
      const bg = this.scene.add.rectangle(x, y, btnSize, btnSize, 0x1a1a2e);
      const rgb = element.colorRGB;
      bg.setStrokeStyle(1, Phaser.Display.Color.GetColor(
        Math.floor(rgb.r * 0.5), Math.floor(rgb.g * 0.5), Math.floor(rgb.b * 0.5)
      ));
      bg.setInteractive({ useHandCursor: true });
      this.container.add(bg);
      this.buttonBackgrounds.push(bg);

      // Element sprite on the button
      const sprite = this.scene.add.sprite(x, y, PATTERN_SPRITE_CONFIG.textureKey, element.index);
      sprite.setDisplaySize(btnSize - 6, btnSize - 6);
      this.container.add(sprite);
      this.buttonSprites.push(sprite);

      // Hover effects
      bg.on('pointerover', () => {
        if (!this.isActive) return;
        bg.setStrokeStyle(2, Phaser.Display.Color.GetColor(rgb.r, rgb.g, rgb.b));
        bg.setFillStyle(0x2a2a4e);
      });
      bg.on('pointerout', () => {
        if (!this.isActive) return;
        bg.setStrokeStyle(1, Phaser.Display.Color.GetColor(
          Math.floor(rgb.r * 0.5), Math.floor(rgb.g * 0.5), Math.floor(rgb.b * 0.5)
        ));
        bg.setFillStyle(0x1a1a2e);
      });

      // Click — add this element to the player's sequence
      bg.on('pointerdown', () => {
        if (!this.isActive) return;
        this.addElement(element.index);
      });
    }
  }

  /**
   * Create Submit and Backspace control buttons.
   */
  private createControlButtons(): void {
    const y = 36;

    // Backspace button (left)
    {
      const bg = this.scene.add.rectangle(-40, y, 52, 14, 0x4a2222);
      bg.setStrokeStyle(1, 0x884444);
      bg.setInteractive({ useHandCursor: true });

      const text = this.scene.add.text(-40, y, 'Backspace', {
        fontSize: '6px',
        fontFamily: 'Arial',
        color: '#cc8888',
      });
      text.setOrigin(0.5, 0.5);

      bg.on('pointerover', () => {
        bg.setFillStyle(0x6a3333);
        text.setColor('#ffaaaa');
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x4a2222);
        text.setColor('#cc8888');
      });
      bg.on('pointerdown', () => {
        if (!this.isActive) return;
        this.removeLastElement();
      });

      this.backspaceButton = this.scene.add.container(0, 0, [bg, text]);
      this.container.add(this.backspaceButton);
    }

    // Submit button (right)
    {
      const bg = this.scene.add.rectangle(40, y, 44, 14, 0x1a3a1a);
      bg.setStrokeStyle(1, 0x44aa44);
      bg.setInteractive({ useHandCursor: true });

      const text = this.scene.add.text(40, y, 'Submit', {
        fontSize: '7px',
        fontFamily: 'Arial',
        color: '#88cc88',
      });
      text.setOrigin(0.5, 0.5);

      bg.on('pointerover', () => {
        bg.setFillStyle(0x2a5a2a);
        text.setColor('#aaffaa');
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x1a3a1a);
        text.setColor('#88cc88');
      });
      bg.on('pointerdown', () => {
        if (!this.isActive) return;
        this.submitSequence();
      });

      this.submitButton = this.scene.add.container(0, 0, [bg, text]);
      this.container.add(this.submitButton);
    }
  }

  /**
   * Add an element to the player's input sequence.
   */
  private addElement(elementIndex: number): void {
    if (this.playerSequence.length >= this.expectedLength) return;

    this.playerSequence.push(elementIndex);

    // Play the element's tone
    const element = getSacredElement(elementIndex);
    if (element) {
      this.playTone(element.toneFrequency);
    }

    // Update the input slot display
    this.updateInputSlots();
  }

  /**
   * Remove the last element from the player's input sequence (Backspace).
   */
  removeLastElement(): void {
    if (this.playerSequence.length === 0) return;
    this.playerSequence.pop();
    this.updateInputSlots();
  }

  /**
   * Update the visual display of the player's input slots.
   */
  private updateInputSlots(): void {
    for (let i = 0; i < this.expectedLength; i++) {
      const sprite = this.inputSlotSprites[i]!;
      const bg = this.inputSlotBackgrounds[i]!;

      if (i < this.playerSequence.length) {
        const elIdx = this.playerSequence[i]!;
        const element = getSacredElement(elIdx);
        if (element) {
          sprite.setFrame(element.index);
          sprite.setVisible(true);
          const rgb = element.colorRGB;
          bg.setStrokeStyle(2, Phaser.Display.Color.GetColor(rgb.r, rgb.g, rgb.b));
        }
      } else {
        sprite.setVisible(false);
        bg.setStrokeStyle(1, 0x334466);
      }
    }
  }

  /**
   * Submit the player's sequence and check against the target.
   */
  private submitSequence(): void {
    if (this.playerSequence.length !== this.expectedLength) {
      // Not enough elements — flash the label
      this.label.setText(`Need ${this.expectedLength} elements!`);
      this.scene.time.addEvent({
        delay: 1000,
        callback: () => { this.label.setText('Input the pattern:'); },
      });
      return;
    }

    // Compare sequences
    let success = true;
    for (let i = 0; i < this.expectedLength; i++) {
      if (this.playerSequence[i] !== this.targetSequence[i]) {
        success = false;
        break;
      }
    }

    this.isActive = false;

    if (success) {
      this.showSuccessFlash();
    } else {
      this.showFailFlash();
    }
  }

  /**
   * Show green flash on success, emit event, and call callback.
   */
  private showSuccessFlash(): void {
    this.label.setText('Correct!');
    this.label.setColor('#44ff44');

    if (this.flashOverlay) {
      this.flashOverlay.setFillStyle(0x00ff00, 0.3);
      this.scene.tweens.add({
        targets: this.flashOverlay,
        alpha: { from: 0.3, to: 0 },
        duration: 600,
        onComplete: () => {
          this.scene.events.emit('pattern:inputSuccess');
          this.onComplete?.(true);
        },
      });
    } else {
      this.scene.events.emit('pattern:inputSuccess');
      this.onComplete?.(true);
    }
  }

  /**
   * Show red flash on failure, clear sequence, and allow retry.
   */
  private showFailFlash(): void {
    this.label.setText('Incorrect! Try again...');
    this.label.setColor('#ff4444');

    if (this.flashOverlay) {
      this.flashOverlay.setFillStyle(0xff0000, 0.3);
      this.scene.tweens.add({
        targets: this.flashOverlay,
        alpha: { from: 0.3, to: 0 },
        duration: 600,
        onComplete: () => {
          // Reset for retry
          this.playerSequence = [];
          this.updateInputSlots();
          this.label.setText('Input the pattern:');
          this.label.setColor('#c0c8e0');
          this.isActive = true;
          this.scene.events.emit('pattern:inputFail');
        },
      });
    } else {
      this.playerSequence = [];
      this.updateInputSlots();
      this.label.setText('Input the pattern:');
      this.label.setColor('#c0c8e0');
      this.isActive = true;
      this.scene.events.emit('pattern:inputFail');
    }
  }

  /**
   * Initialise the Web Audio context for tone playback.
   */
  private initAudio(): void {
    try {
      this.audioContext = new AudioContext();
    } catch {
      console.warn('PatternInput: Web Audio API not available');
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

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

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
   * Whether the input is currently active (accepting input).
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Get the player's current input sequence.
   */
  getPlayerSequence(): readonly number[] {
    return this.playerSequence;
  }

  /**
   * Show or hide the entire input UI.
   */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Clean up all game objects and audio resources.
   */
  destroy(): void {
    this.isActive = false;

    if (this.backspaceKey) {
      this.backspaceKey.removeAllListeners();
      this.scene.input.keyboard?.removeKey(this.backspaceKey);
      this.backspaceKey = null;
    }

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }

    this.container.destroy();
    this.buttonSprites = [];
    this.buttonBackgrounds = [];
    this.inputSlotSprites = [];
    this.inputSlotBackgrounds = [];
    this.submitButton = null;
    this.backspaceButton = null;
    this.flashOverlay = null;
  }
}
