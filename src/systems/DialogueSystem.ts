import Phaser from 'phaser';
import { DialogueTree, DialogueNode } from '../data/dialogue';
import { getDialogueTree } from '../data/dialogue';
import { getSpeakerPortraitKey } from '../data/npcs';

/**
 * Layout constants for the dialogue box.
 * The dialogue box sits at the bottom of the viewport area (320x60),
 * overlaying the game world but above the UI panels.
 */
const DIALOGUE_BOX = {
  WIDTH: 320,
  HEIGHT: 60,
  /** Y position of the dialogue box top edge (viewport bottom minus box height) */
  Y: 120 - 60, // 60px → Y=60, so box covers Y:60–120 in the viewport
  PORTRAIT_SIZE: 48,
  PORTRAIT_PADDING: 4,
  TEXT_PADDING: 6,
  NAME_FONT_SIZE: '7px',
  TEXT_FONT_SIZE: '7px',
  /** Characters per second for typewriter effect */
  TYPEWRITER_SPEED: 40,
};

const COLORS = {
  BOX_BG: 0x0a0a1e,
  BOX_BORDER: 0x4a4a8e,
  NAME_COLOR: '#ffcc44',
  TEXT_COLOR: '#ffffff',
};

/**
 * DialogueSystem — Renders dialogue UI with typewriter text, speaker portrait,
 * speaker name, and click-to-advance interaction.
 *
 * The dialogue box appears at the bottom of the viewport (320x60px) with:
 * - Speaker portrait on the left (48x48)
 * - Speaker name above the text
 * - Typewriter text reveal at 40 chars/second
 * - Click to complete typewriter instantly
 * - Click again to advance to next node
 * - Emits 'dialogue:start' / 'dialogue:end' for game state management
 */
export class DialogueSystem {
  private scene: Phaser.Scene;

  // UI container and elements
  private container: Phaser.GameObjects.Container;
  private boxBackground: Phaser.GameObjects.Rectangle;
  private boxBorder: Phaser.GameObjects.Rectangle;
  private portrait: Phaser.GameObjects.Image | null = null;
  private nameText: Phaser.GameObjects.Text;
  private dialogueText: Phaser.GameObjects.Text;

  // Dialogue state
  private currentTree: DialogueTree | null = null;
  private currentNode: DialogueNode | null = null;
  private isActive = false;

  // Typewriter state
  private fullText = '';
  private displayedChars = 0;
  private typewriterTimer: Phaser.Time.TimerEvent | null = null;
  private isTypewriterComplete = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(200); // Above all game content

    // Dialogue box background (filled rect)
    this.boxBackground = scene.add.rectangle(
      DIALOGUE_BOX.WIDTH / 2,
      DIALOGUE_BOX.Y + DIALOGUE_BOX.HEIGHT / 2,
      DIALOGUE_BOX.WIDTH,
      DIALOGUE_BOX.HEIGHT,
      COLORS.BOX_BG,
      0.92
    );
    this.container.add(this.boxBackground);

    // Border (unfilled rect drawn as 4 edge lines simulated via stroke)
    this.boxBorder = scene.add.rectangle(
      DIALOGUE_BOX.WIDTH / 2,
      DIALOGUE_BOX.Y + DIALOGUE_BOX.HEIGHT / 2,
      DIALOGUE_BOX.WIDTH - 2,
      DIALOGUE_BOX.HEIGHT - 2
    );
    this.boxBorder.setStrokeStyle(1, COLORS.BOX_BORDER);
    this.boxBorder.setFillStyle(); // No fill, border only
    this.container.add(this.boxBorder);

    // Speaker name text
    const textX = DIALOGUE_BOX.PORTRAIT_PADDING + DIALOGUE_BOX.PORTRAIT_SIZE + DIALOGUE_BOX.TEXT_PADDING;
    this.nameText = scene.add.text(
      textX,
      DIALOGUE_BOX.Y + DIALOGUE_BOX.PORTRAIT_PADDING,
      '',
      {
        fontSize: DIALOGUE_BOX.NAME_FONT_SIZE,
        fontFamily: 'Arial',
        color: COLORS.NAME_COLOR,
        fontStyle: 'bold',
      }
    );
    this.container.add(this.nameText);

    // Dialogue text (with word wrap)
    const maxTextWidth = DIALOGUE_BOX.WIDTH - textX - DIALOGUE_BOX.TEXT_PADDING;
    this.dialogueText = scene.add.text(
      textX,
      DIALOGUE_BOX.Y + DIALOGUE_BOX.PORTRAIT_PADDING + 10,
      '',
      {
        fontSize: DIALOGUE_BOX.TEXT_FONT_SIZE,
        fontFamily: 'Arial',
        color: COLORS.TEXT_COLOR,
        wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
        lineSpacing: 2,
      }
    );
    this.container.add(this.dialogueText);

    // Click handler — covers the entire dialogue box area
    this.boxBackground.setInteractive();
    this.boxBackground.on('pointerdown', () => {
      this.handleClick();
    });

    // Start hidden
    this.container.setVisible(false);

    // Listen for startDialogue actions from hotspot/NPC system
    this.scene.events.on('hotspot:action', (action: string, data?: { dialogueId?: string }) => {
      if (action === 'startDialogue' && data?.dialogueId) {
        this.startDialogue(data.dialogueId);
      }
    });
  }

  /**
   * Is the dialogue system currently showing a dialogue?
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Start a dialogue tree by ID.
   * Shows the dialogue box and displays the first node.
   */
  startDialogue(dialogueId: string): void {
    const tree = getDialogueTree(dialogueId);
    if (!tree) {
      console.warn(`Dialogue tree not found: ${dialogueId}`);
      return;
    }

    this.currentTree = tree;
    this.isActive = true;
    this.container.setVisible(true);

    // Notify the game that dialogue has started (blocks other interaction)
    this.scene.events.emit('dialogue:start');

    // Display the starting node
    const startNode = tree.nodes[tree.startNodeId];
    if (startNode) {
      this.displayNode(startNode);
    } else {
      console.warn(`Start node not found: ${tree.startNodeId}`);
      this.endDialogue();
    }
  }

  /**
   * Display a single dialogue node — sets portrait, name, and starts typewriter.
   */
  private displayNode(node: DialogueNode): void {
    this.currentNode = node;

    // Execute action if present (setFlag, giveItem, etc.)
    if (node.action) {
      this.scene.events.emit('dialogue:action', node.action);
    }

    // Set speaker portrait
    this.setPortrait(node.speaker);

    // Set speaker name
    this.nameText.setText(node.speaker);

    // Start typewriter effect for dialogue text
    this.startTypewriter(node.text);
  }

  /**
   * Set the speaker portrait image. Creates or updates the portrait image.
   */
  private setPortrait(speakerName: string): void {
    const portraitKey = getSpeakerPortraitKey(speakerName);

    // Remove old portrait if it exists
    if (this.portrait) {
      this.portrait.destroy();
      this.portrait = null;
    }

    if (portraitKey && this.scene.textures.exists(portraitKey)) {
      this.portrait = this.scene.add.image(
        DIALOGUE_BOX.PORTRAIT_PADDING + DIALOGUE_BOX.PORTRAIT_SIZE / 2,
        DIALOGUE_BOX.Y + DIALOGUE_BOX.HEIGHT / 2,
        portraitKey
      );
      // Scale portrait to fit the 48x48 area
      this.portrait.setDisplaySize(DIALOGUE_BOX.PORTRAIT_SIZE, DIALOGUE_BOX.PORTRAIT_SIZE);
      this.container.add(this.portrait);
    }
  }

  /**
   * Start the typewriter effect — reveals text one character at a time.
   */
  private startTypewriter(text: string): void {
    this.fullText = text;
    this.displayedChars = 0;
    this.isTypewriterComplete = false;
    this.dialogueText.setText('');

    // Cancel any existing typewriter timer
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }

    // Calculate interval: 1000ms / chars_per_second
    const interval = 1000 / DIALOGUE_BOX.TYPEWRITER_SPEED; // 25ms per char at 40 cps

    this.typewriterTimer = this.scene.time.addEvent({
      delay: interval,
      callback: () => {
        this.displayedChars++;
        this.dialogueText.setText(this.fullText.substring(0, this.displayedChars));

        if (this.displayedChars >= this.fullText.length) {
          this.completeTypewriter();
        }
      },
      repeat: this.fullText.length - 1,
    });
  }

  /**
   * Complete the typewriter effect instantly — shows all text.
   */
  private completeTypewriter(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }
    this.displayedChars = this.fullText.length;
    this.dialogueText.setText(this.fullText);
    this.isTypewriterComplete = true;
  }

  /**
   * Handle a click on the dialogue box.
   * - If typewriter is running, complete it instantly.
   * - If typewriter is done, advance to next node or end dialogue.
   */
  private handleClick(): void {
    if (!this.isActive || !this.currentNode) return;

    if (!this.isTypewriterComplete) {
      // First click: complete typewriter instantly
      this.completeTypewriter();
      return;
    }

    // Second click: advance
    this.advanceDialogue();
  }

  /**
   * Advance to the next dialogue node based on current node's progression.
   * - If node has `next`, go to that node.
   * - If node has `responses`, those are handled by US-019 (DialogueChoices).
   *   For now, we just end the dialogue when we hit a node with responses or no next.
   * - If neither, end dialogue.
   */
  private advanceDialogue(): void {
    if (!this.currentTree || !this.currentNode) {
      this.endDialogue();
      return;
    }

    if (this.currentNode.next) {
      // Linear progression — go to next node
      const nextNode = this.currentTree.nodes[this.currentNode.next];
      if (nextNode) {
        this.displayNode(nextNode);
      } else {
        console.warn(`Next node not found: ${this.currentNode.next}`);
        this.endDialogue();
      }
    } else if (this.currentNode.responses && this.currentNode.responses.length > 0) {
      // Branching — emit event for dialogue choices system (US-019)
      // For now, end dialogue at choice points
      this.scene.events.emit('dialogue:choices', this.currentNode.responses);
      this.endDialogue();
    } else {
      // Terminal node — end dialogue
      this.endDialogue();
    }
  }

  /**
   * End the current dialogue — hides the box and re-enables game interaction.
   */
  private endDialogue(): void {
    this.isActive = false;
    this.currentTree = null;
    this.currentNode = null;

    // Stop typewriter if still running
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = null;
    }

    // Clean up portrait
    if (this.portrait) {
      this.portrait.destroy();
      this.portrait = null;
    }

    this.container.setVisible(false);

    // Notify the game that dialogue has ended (re-enables interaction)
    this.scene.events.emit('dialogue:end');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    this.container.destroy();
  }
}
