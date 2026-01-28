import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';
import { Verb, VERB_DISPLAY_TEXT } from './VerbSystem';

/**
 * Layout constants for the sentence line area
 *
 * UI Layout (320x200):
 * - Viewport: 0-120 (120px)
 * - Inventory: 120-160 (40px)
 * - Sentence line: 160-176 (16px) <- this panel
 * - Verb bar: 176-200 (24px)
 */
const SENTENCE_LINE = {
  HEIGHT: 16, // 16 pixels tall
  Y_OFFSET: 160, // Below inventory panel (GAME_HEIGHT - 40)
};

/**
 * Color constants for the sentence line
 */
const COLORS = {
  BACKGROUND: 0x1a1a2e, // Dark blue, matches verb bar
  TEXT: '#ffffff', // White text
};

/**
 * SentenceLineSystem - Displays current action as "[Verb] [Target]"
 *
 * Features:
 * - Shows current verb when selected (e.g., "Walk to")
 * - Updates to show "[Verb] [target]" when hovering over hotspots
 * - Clears target when mouse leaves hotspot
 * - Uses 8px pixel-style font
 */
export class SentenceLineSystem {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private sentenceText: Phaser.GameObjects.Text;
  private currentVerb: Verb = Verb.WALK;
  private currentTarget: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, SENTENCE_LINE.Y_OFFSET);
    this.sentenceText = this.createSentenceLine();
    this.setupEventListeners();
    this.updateDisplay();
  }

  /**
   * Create the sentence line UI elements
   */
  private createSentenceLine(): Phaser.GameObjects.Text {
    // Background bar
    const background = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      SENTENCE_LINE.HEIGHT / 2,
      GAME_WIDTH,
      SENTENCE_LINE.HEIGHT,
      COLORS.BACKGROUND
    );
    this.container.add(background);

    // Sentence text (8px pixel font, centered)
    const text = this.scene.add.text(
      GAME_WIDTH / 2,
      SENTENCE_LINE.HEIGHT / 2,
      '',
      {
        fontSize: '8px',
        fontFamily: 'Arial',
        color: COLORS.TEXT,
      }
    );
    text.setOrigin(0.5, 0.5);
    this.container.add(text);

    return text;
  }

  /**
   * Set up event listeners for verb and hotspot changes
   */
  private setupEventListeners(): void {
    // Listen for verb selection changes
    this.scene.events.on('verb:selected', (verb: Verb) => {
      this.currentVerb = verb;
      this.updateDisplay();
    });

    // Listen for hotspot hover events
    this.scene.events.on('hotspot:hover', (name: string) => {
      this.setTarget(name);
    });

    // Listen for hotspot leave events
    this.scene.events.on('hotspot:leave', () => {
      this.clearTarget();
    });
  }

  /**
   * Get the current verb display text
   */
  getVerbText(): string {
    return VERB_DISPLAY_TEXT[this.currentVerb];
  }

  /**
   * Set the current verb
   */
  setVerb(verb: Verb): void {
    this.currentVerb = verb;
    this.updateDisplay();
  }

  /**
   * Set the current target (hotspot name)
   */
  setTarget(target: string): void {
    this.currentTarget = target;
    this.updateDisplay();
  }

  /**
   * Clear the current target (when mouse leaves hotspot)
   */
  clearTarget(): void {
    this.currentTarget = null;
    this.updateDisplay();
  }

  /**
   * Update the displayed sentence text
   */
  private updateDisplay(): void {
    const verbText = VERB_DISPLAY_TEXT[this.currentVerb];

    if (this.currentTarget) {
      this.sentenceText.setText(`${verbText} ${this.currentTarget}`);
    } else {
      this.sentenceText.setText(verbText);
    }
  }

  /**
   * Get the full sentence text (for testing/debugging)
   */
  getSentenceText(): string {
    return this.sentenceText.text;
  }

  /**
   * Clean up resources when the system is destroyed
   */
  destroy(): void {
    this.scene.events.off('verb:selected');
    this.scene.events.off('hotspot:hover');
    this.scene.events.off('hotspot:leave');
    this.container.destroy();
  }
}
