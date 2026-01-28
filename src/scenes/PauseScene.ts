import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { SaveSystem, SaveSlotData, SAVE_SLOT_COUNT } from '../systems/SaveSystem';
import { GameState } from '../systems/GameState';

/** Colors used throughout the pause menu UI */
const COLORS = {
  OVERLAY: 0x000000,
  OVERLAY_ALPHA: 0.7,
  PANEL_BG: 0x1a1a2e,
  PANEL_BORDER: 0x4a4a6e,
  TEXT_NORMAL: '#aaaaaa',
  TEXT_HIGHLIGHT: '#ffffff',
  TEXT_TITLE: '#ffcc00',
  TEXT_SLOT_EMPTY: '#666666',
  TEXT_SLOT_FILLED: '#88aaff',
  SLOT_BG: 0x12122a,
  SLOT_BORDER: 0x3a3a5e,
  SLOT_HOVER: 0x2a2a4e,
};

/** Font style shared across menu items */
const MENU_FONT = { fontSize: '8px', fontFamily: 'Arial' };

type MenuView = 'main' | 'save' | 'load';

/**
 * PauseScene — Overlay pause menu with Save/Load/Quit functionality.
 *
 * Launched as an overlay on top of GameScene (scene.launch, not scene.start).
 * GameScene is paused while this scene is active.
 *
 * Menu options:
 * - Resume: Close pause menu, unpause GameScene
 * - Save Game: Show 3 save slots with timestamps, click to save
 * - Load Game: Show 3 save slots with timestamps, click to load
 * - Quit to Menu: Return to MenuScene (destroys GameScene)
 */
export class PauseScene extends Phaser.Scene {
  private currentView: MenuView = 'main';
  private menuItems: Phaser.GameObjects.Text[] = [];
  private slotItems: Phaser.GameObjects.Container[] = [];
  private titleText!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Rectangle;
  private panel!: Phaser.GameObjects.Rectangle;
  private panelBorder!: Phaser.GameObjects.Rectangle;
  private backText: Phaser.GameObjects.Text | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    this.currentView = 'main';

    // Semi-transparent overlay covering the entire game
    this.overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      COLORS.OVERLAY, COLORS.OVERLAY_ALPHA
    );
    this.overlay.setDepth(300);

    // Menu panel (centered, smaller than full screen)
    const panelW = 200;
    const panelH = 120;
    const panelX = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT / 2;

    this.panelBorder = this.add.rectangle(panelX, panelY, panelW + 2, panelH + 2, COLORS.PANEL_BORDER);
    this.panelBorder.setDepth(301);

    this.panel = this.add.rectangle(panelX, panelY, panelW, panelH, COLORS.PANEL_BG);
    this.panel.setDepth(302);

    // Title text at top of panel
    this.titleText = this.add.text(panelX, panelY - panelH / 2 + 12, 'PAUSED', {
      ...MENU_FONT,
      fontSize: '10px',
      color: COLORS.TEXT_TITLE,
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.titleText.setDepth(303);

    // Show main menu
    this.showMainMenu();

    // ESC key to resume (close pause menu)
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.currentView === 'main') {
        this.resumeGame();
      } else {
        this.showMainMenu();
      }
    });
  }

  // ─── Main Menu ──────────────────────────────────────────────

  private showMainMenu(): void {
    this.currentView = 'main';
    this.clearMenuItems();
    this.clearSlots();
    this.clearBack();
    this.clearFeedback();

    this.titleText.setText('PAUSED');

    const items = ['Resume', 'Save Game', 'Load Game', 'Quit to Menu'];
    const startY = GAME_HEIGHT / 2 - 20;
    const lineHeight = 16;

    for (let i = 0; i < items.length; i++) {
      const label = items[i]!;
      const y = startY + i * lineHeight;

      const text = this.add.text(GAME_WIDTH / 2, y, label, {
        ...MENU_FONT,
        color: COLORS.TEXT_NORMAL,
      });
      text.setOrigin(0.5, 0.5);
      text.setDepth(303);
      text.setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        text.setColor(COLORS.TEXT_HIGHLIGHT);
      });
      text.on('pointerout', () => {
        text.setColor(COLORS.TEXT_NORMAL);
      });
      text.on('pointerdown', () => {
        this.handleMainMenuClick(i);
      });

      this.menuItems.push(text);
    }
  }

  private handleMainMenuClick(index: number): void {
    switch (index) {
      case 0: // Resume
        this.resumeGame();
        break;
      case 1: // Save Game
        this.showSaveSlots();
        break;
      case 2: // Load Game
        this.showLoadSlots();
        break;
      case 3: // Quit to Menu
        this.quitToMenu();
        break;
    }
  }

  // ─── Save/Load Slot Views ───────────────────────────────────

  private showSaveSlots(): void {
    this.currentView = 'save';
    this.clearMenuItems();
    this.clearFeedback();
    this.titleText.setText('SAVE GAME');
    this.renderSlots('save');
    this.addBackButton();
  }

  private showLoadSlots(): void {
    this.currentView = 'load';
    this.clearMenuItems();
    this.clearFeedback();
    this.titleText.setText('LOAD GAME');
    this.renderSlots('load');
    this.addBackButton();
  }

  private renderSlots(mode: 'save' | 'load'): void {
    this.clearSlots();

    const saveSystem = this.getSaveSystem();
    if (!saveSystem) return;

    const slotInfo = saveSystem.getSlotInfo();
    const startY = GAME_HEIGHT / 2 - 28;
    const slotHeight = 22;
    const slotWidth = 170;

    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      const info = slotInfo[i]!;
      const y = startY + i * (slotHeight + 4);

      const container = this.add.container(GAME_WIDTH / 2, y);
      container.setDepth(303);

      // Slot background
      const bg = this.add.rectangle(0, 0, slotWidth, slotHeight, COLORS.SLOT_BG);
      const border = this.add.rectangle(0, 0, slotWidth + 1, slotHeight + 1, COLORS.SLOT_BORDER);
      border.setDepth(-1);
      container.add(border);
      container.add(bg);

      // Slot label
      const slotLabel = `Slot ${i + 1}`;
      let detailStr: string;

      if (info.hasData && info.timestamp) {
        const date = new Date(info.timestamp);
        const dateStr = date.toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        detailStr = `${info.roomName ?? 'Unknown'} - ${dateStr}`;
      } else {
        detailStr = '- Empty -';
      }

      const labelText = this.add.text(-slotWidth / 2 + 6, -6, slotLabel, {
        ...MENU_FONT,
        fontSize: '7px',
        color: COLORS.TEXT_HIGHLIGHT,
      });
      container.add(labelText);

      const detailText = this.add.text(-slotWidth / 2 + 6, 3, detailStr, {
        ...MENU_FONT,
        fontSize: '6px',
        color: info.hasData ? COLORS.TEXT_SLOT_FILLED : COLORS.TEXT_SLOT_EMPTY,
      });
      container.add(detailText);

      // Interactivity
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.setFillStyle(COLORS.SLOT_HOVER);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(COLORS.SLOT_BG);
      });
      bg.on('pointerdown', () => {
        if (mode === 'save') {
          this.handleSaveSlotClick(i);
        } else {
          this.handleLoadSlotClick(i);
        }
      });

      this.slotItems.push(container);
    }
  }

  private handleSaveSlotClick(slotIndex: number): void {
    const saveSystem = this.getSaveSystem();
    if (!saveSystem) return;

    const success = saveSystem.saveToSlot(slotIndex);
    if (success) {
      this.showSlotFeedback(`Saved to Slot ${slotIndex + 1}!`);
      // Refresh slot display after save
      this.time.delayedCall(800, () => {
        if (this.currentView === 'save') {
          this.showSaveSlots();
        }
      });
    } else {
      this.showSlotFeedback('Save failed.');
    }
  }

  private handleLoadSlotClick(slotIndex: number): void {
    const saveSystem = this.getSaveSystem();
    if (!saveSystem) return;

    const slotData = saveSystem.loadSlot(slotIndex);
    if (!slotData) {
      this.showSlotFeedback('Slot is empty.');
      return;
    }

    // Load the snapshot into GameState
    const gameState = GameState.getInstance();
    if (!gameState) {
      this.showSlotFeedback('Load failed.');
      return;
    }

    this.showSlotFeedback(`Loading Slot ${slotIndex + 1}...`);

    this.time.delayedCall(400, () => {
      this.loadGameFromSlot(slotData);
    });
  }

  /**
   * Load game state from a save slot — restores GameState snapshot
   * and restarts GameScene at the saved room/position.
   */
  private loadGameFromSlot(slotData: SaveSlotData): void {
    const gameState = GameState.getInstance();
    if (!gameState) return;

    // Load the snapshot into GameState
    gameState.loadSnapshot(slotData.snapshot);

    // Stop PauseScene, restart GameScene with loaded state
    this.scene.stop('PauseScene');
    this.scene.stop('GameScene');
    this.scene.start('GameScene');
  }

  // ─── Actions ────────────────────────────────────────────────

  private resumeGame(): void {
    this.scene.resume('GameScene');
    this.scene.stop('PauseScene');
  }

  private quitToMenu(): void {
    this.scene.stop('GameScene');
    this.scene.stop('PauseScene');
    this.scene.start('MenuScene');
  }

  // ─── UI Helpers ─────────────────────────────────────────────

  private addBackButton(): void {
    this.clearBack();
    this.backText = this.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 + 48,
      '< Back',
      { ...MENU_FONT, color: COLORS.TEXT_NORMAL }
    );
    this.backText.setOrigin(0.5, 0.5);
    this.backText.setDepth(303);
    this.backText.setInteractive({ useHandCursor: true });
    this.backText.on('pointerover', () => {
      this.backText?.setColor(COLORS.TEXT_HIGHLIGHT);
    });
    this.backText.on('pointerout', () => {
      this.backText?.setColor(COLORS.TEXT_NORMAL);
    });
    this.backText.on('pointerdown', () => {
      this.showMainMenu();
    });
  }

  private showSlotFeedback(message: string): void {
    this.clearFeedback();
    this.feedbackText = this.add.text(
      GAME_WIDTH / 2, GAME_HEIGHT / 2 + 38,
      message,
      { ...MENU_FONT, fontSize: '7px', color: COLORS.TEXT_TITLE }
    );
    this.feedbackText.setOrigin(0.5, 0.5);
    this.feedbackText.setDepth(304);
  }

  private clearMenuItems(): void {
    for (const item of this.menuItems) {
      item.removeAllListeners();
      item.destroy();
    }
    this.menuItems = [];
  }

  private clearSlots(): void {
    for (const container of this.slotItems) {
      container.each((child: Phaser.GameObjects.GameObject) => {
        if ('removeAllListeners' in child) {
          (child as Phaser.GameObjects.Rectangle).removeAllListeners();
        }
      });
      container.destroy();
    }
    this.slotItems = [];
  }

  private clearBack(): void {
    if (this.backText) {
      this.backText.removeAllListeners();
      this.backText.destroy();
      this.backText = null;
    }
  }

  private clearFeedback(): void {
    if (this.feedbackText) {
      this.feedbackText.destroy();
      this.feedbackText = null;
    }
  }

  /**
   * Get the SaveSystem from the GameScene.
   * GameScene is paused but still accessible via scene manager.
   */
  private getSaveSystem(): SaveSystem | null {
    const gameScene = this.scene.get('GameScene') as
      | (Phaser.Scene & { getSaveSystem(): SaveSystem })
      | undefined;
    if (gameScene && typeof gameScene.getSaveSystem === 'function') {
      return gameScene.getSaveSystem();
    }
    return null;
  }
}
