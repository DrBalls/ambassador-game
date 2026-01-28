import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

/**
 * Verb types available in the SCUMM-style interface
 */
export enum Verb {
  WALK = 'WALK',
  LOOK = 'LOOK',
  TALK = 'TALK',
  USE = 'USE',
  TAKE = 'TAKE',
  GIVE = 'GIVE',
}

/**
 * Display text for each verb (what shows in the sentence line)
 */
export const VERB_DISPLAY_TEXT: Record<Verb, string> = {
  [Verb.WALK]: 'Walk to',
  [Verb.LOOK]: 'Look at',
  [Verb.TALK]: 'Talk to',
  [Verb.USE]: 'Use',
  [Verb.TAKE]: 'Take',
  [Verb.GIVE]: 'Give',
};

/**
 * Color constants for the verb bar
 */
const COLORS = {
  BACKGROUND: 0x1a1a2e, // Dark blue background
  NORMAL: 0x4a4a6e, // Normal verb color
  HOVER: 0x6a6a9e, // Lighter on hover
  SELECTED: 0x8a8ace, // Brightest when selected
  TEXT_NORMAL: '#aaaacc',
  TEXT_HOVER: '#ccccee',
  TEXT_SELECTED: '#ffffff',
};

/**
 * Verb button dimensions
 */
const VERB_BUTTON = {
  WIDTH: 48,
  HEIGHT: 16,
  PADDING: 4,
};

/**
 * Verb bar layout constants
 */
const VERB_BAR = {
  HEIGHT: 24, // Total height of verb bar area
  Y_OFFSET: GAME_HEIGHT - 24, // Position from top
};

interface VerbButton {
  verb: Verb;
  background: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

/**
 * VerbSystem - SCUMM-style verb bar for selecting player actions
 *
 * Features:
 * - 6 verb buttons: WALK, LOOK, TALK, USE, TAKE, GIVE
 * - Hover highlighting
 * - Click to select (stays highlighted)
 * - Default selected verb is WALK
 */
export class VerbSystem {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private buttons: VerbButton[] = [];
  private selectedVerb: Verb = Verb.WALK;
  private hoveredVerb: Verb | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, VERB_BAR.Y_OFFSET);
    this.createVerbBar();
  }

  /**
   * Get the currently selected verb
   */
  getSelectedVerb(): Verb {
    return this.selectedVerb;
  }

  /**
   * Get the display text for the current verb
   */
  getSelectedVerbText(): string {
    return VERB_DISPLAY_TEXT[this.selectedVerb];
  }

  /**
   * Set the selected verb programmatically
   */
  setSelectedVerb(verb: Verb): void {
    this.selectedVerb = verb;
    this.updateButtonStates();
  }

  /**
   * Create the verb bar UI
   */
  private createVerbBar(): void {
    // Background bar
    const background = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      VERB_BAR.HEIGHT / 2,
      GAME_WIDTH,
      VERB_BAR.HEIGHT,
      COLORS.BACKGROUND
    );
    this.container.add(background);

    // Create verb buttons
    const verbs = Object.values(Verb);
    const totalWidth = verbs.length * (VERB_BUTTON.WIDTH + VERB_BUTTON.PADDING) - VERB_BUTTON.PADDING;
    const startX = (GAME_WIDTH - totalWidth) / 2 + VERB_BUTTON.WIDTH / 2;

    verbs.forEach((verb, index) => {
      const x = startX + index * (VERB_BUTTON.WIDTH + VERB_BUTTON.PADDING);
      const y = VERB_BAR.HEIGHT / 2;

      // Button background
      const buttonBg = this.scene.add.rectangle(
        x,
        y,
        VERB_BUTTON.WIDTH,
        VERB_BUTTON.HEIGHT,
        COLORS.NORMAL
      );
      buttonBg.setInteractive({ useHandCursor: true });

      // Button text
      const buttonText = this.scene.add.text(x, y, verb, {
        fontSize: '8px',
        fontFamily: 'Arial',
        color: COLORS.TEXT_NORMAL,
      });
      buttonText.setOrigin(0.5, 0.5);

      // Store button reference
      const button: VerbButton = {
        verb,
        background: buttonBg,
        text: buttonText,
      };
      this.buttons.push(button);

      // Add to container
      this.container.add(buttonBg);
      this.container.add(buttonText);

      // Set up event handlers
      this.setupButtonEvents(button);
    });

    // Set initial state (WALK selected)
    this.updateButtonStates();
  }

  /**
   * Set up pointer events for a verb button
   */
  private setupButtonEvents(button: VerbButton): void {
    const { background, verb } = button;

    background.on('pointerover', () => {
      this.hoveredVerb = verb;
      this.updateButtonStates();
    });

    background.on('pointerout', () => {
      if (this.hoveredVerb === verb) {
        this.hoveredVerb = null;
        this.updateButtonStates();
      }
    });

    background.on('pointerdown', () => {
      this.selectedVerb = verb;
      this.updateButtonStates();
      this.scene.events.emit('verb:selected', verb);
    });
  }

  /**
   * Update visual states for all buttons based on selection and hover
   */
  private updateButtonStates(): void {
    this.buttons.forEach((button) => {
      const { verb, background, text } = button;
      const isSelected = verb === this.selectedVerb;
      const isHovered = verb === this.hoveredVerb;

      if (isSelected) {
        background.setFillStyle(COLORS.SELECTED);
        text.setColor(COLORS.TEXT_SELECTED);
      } else if (isHovered) {
        background.setFillStyle(COLORS.HOVER);
        text.setColor(COLORS.TEXT_HOVER);
      } else {
        background.setFillStyle(COLORS.NORMAL);
        text.setColor(COLORS.TEXT_NORMAL);
      }
    });
  }

  /**
   * Clean up resources when the system is destroyed
   */
  destroy(): void {
    this.container.destroy();
    this.buttons = [];
  }
}
