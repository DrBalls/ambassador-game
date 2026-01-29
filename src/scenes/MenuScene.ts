import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';
import { SAVE_SLOT_COUNT } from '../systems/SaveSystem';
import { GameState, GameStateSnapshot } from '../systems/GameState';
import { MusicSystem } from '../systems/MusicSystem';

/** localStorage key prefix (matches SaveSystem) */
const SAVE_KEY_PREFIX = 'ambassador-save-slot-';

/** Check if any save slot has data (without instantiating SaveSystem) */
function hasSaveData(): boolean {
  for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
    if (localStorage.getItem(SAVE_KEY_PREFIX + i) !== null) return true;
  }
  return false;
}

/** Colors used in the title screen UI */
const COLORS = {
  TITLE: '#ffffff',
  SUBTITLE: '#aaccff',
  BUTTON_NORMAL: '#8899bb',
  BUTTON_HIGHLIGHT: '#ffffff',
  BUTTON_DISABLED: '#444466',
  CREDITS_TEXT: '#8899bb',
  OVERLAY_BG: 0x0a0a1e,
};

/**
 * MenuScene - Title screen with animated aurora, menu buttons, and sub-views.
 *
 * Features:
 * - Antarctic vista background with aurora borealis
 * - Animated star twinkles and aurora shimmer
 * - Menu buttons: New Game, Continue (conditional), Options, Credits
 * - Sub-views for Options and Credits
 */
export class MenuScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private menuButtons: Phaser.GameObjects.Text[] = [];
  private subViewItems: Phaser.GameObjects.GameObject[] = [];
  private auroraOverlays: Phaser.GameObjects.Rectangle[] = [];
  private starSprites: Phaser.GameObjects.Rectangle[] = [];
  private currentView: 'main' | 'options' | 'credits' = 'main';
  private musicSystem: MusicSystem | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.currentView = 'main';

    // Start title screen music
    this.musicSystem = new MusicSystem();
    this.musicSystem.playTrack('title');

    // Background image
    this.background = this.add.image(0, 0, 'bg-title-screen').setOrigin(0, 0);
    this.background.setDepth(0);

    // Create animated aurora overlays (semi-transparent colored bands)
    this.createAuroraAnimation();

    // Create twinkling star sprites
    this.createStarTwinkles();

    // Title text — large pixel-style font
    this.titleText = this.add.text(
      GAME_WIDTH / 2,
      42,
      'The Smallest Ambassador',
      {
        fontSize: '12px',
        color: COLORS.TITLE,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 0,
          fill: true,
        },
      }
    );
    this.titleText.setOrigin(0.5, 0.5);
    this.titleText.setDepth(10);

    // Subtitle text
    this.subtitleText = this.add.text(
      GAME_WIDTH / 2,
      56,
      'A Sierra-Style Adventure',
      {
        fontSize: '7px',
        color: COLORS.SUBTITLE,
        fontFamily: 'Arial',
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 0,
          fill: true,
        },
      }
    );
    this.subtitleText.setOrigin(0.5, 0.5);
    this.subtitleText.setDepth(10);

    // Add gentle float animation to title
    this.tweens.add({
      targets: this.titleText,
      y: 44,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Show main menu buttons
    this.showMainMenu();

    // ESC key in sub-views goes back to main menu
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.currentView !== 'main') {
        this.showMainMenu();
      }
    });
  }

  // ─── Main Menu ──────────────────────────────────────────────

  private showMainMenu(): void {
    this.currentView = 'main';
    this.clearMenuButtons();
    this.clearSubView();
    this.titleText.setVisible(true);
    this.subtitleText.setVisible(true);

    const saveExists = hasSaveData();

    // Build button list
    const buttons: Array<{ label: string; action: () => void; enabled: boolean }> = [
      { label: 'New Game', action: () => this.startNewGame(), enabled: true },
      { label: 'Continue', action: () => this.continueGame(), enabled: saveExists },
      { label: 'Options', action: () => this.showOptions(), enabled: true },
      { label: 'Credits', action: () => this.showCredits(), enabled: true },
    ];

    const startY = 120;
    const lineHeight = 16;

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]!;
      const y = startY + i * lineHeight;

      const text = this.add.text(GAME_WIDTH / 2, y, btn.label, {
        fontSize: '8px',
        fontFamily: 'Arial',
        color: btn.enabled ? COLORS.BUTTON_NORMAL : COLORS.BUTTON_DISABLED,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 0,
          fill: true,
        },
      });
      text.setOrigin(0.5, 0.5);
      text.setDepth(10);

      if (btn.enabled) {
        text.setInteractive({ useHandCursor: true });

        text.on('pointerover', () => {
          text.setColor(COLORS.BUTTON_HIGHLIGHT);
        });
        text.on('pointerout', () => {
          text.setColor(COLORS.BUTTON_NORMAL);
        });
        text.on('pointerdown', () => {
          btn.action();
        });
      }

      this.menuButtons.push(text);
    }

    // Add pulsing animation to "New Game" button
    if (this.menuButtons[0]) {
      this.tweens.add({
        targets: this.menuButtons[0],
        alpha: 0.6,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // ─── Actions ────────────────────────────────────────────────

  private startNewGame(): void {
    // Reset any existing GameState singleton so GameScene starts fresh
    const existing = GameState.getInstance();
    if (existing) {
      existing.reset();
    }
    // Stop title music (GameScene will start its own)
    this.musicSystem?.stopTrack();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  private continueGame(): void {
    // Load the most recent save slot (find the one with the latest timestamp)
    let latestSlot: { index: number; timestamp: number } | null = null;

    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      const raw = localStorage.getItem(SAVE_KEY_PREFIX + i);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw) as { timestamp?: number };
        if (data.timestamp && (!latestSlot || data.timestamp > latestSlot.timestamp)) {
          latestSlot = { index: i, timestamp: data.timestamp };
        }
      } catch {
        // Skip corrupt slots
      }
    }

    if (!latestSlot) return;

    // Load the snapshot into GameState
    const raw = localStorage.getItem(SAVE_KEY_PREFIX + latestSlot.index);
    if (!raw) return;

    try {
      const slotData = JSON.parse(raw) as { snapshot?: GameStateSnapshot };
      if (slotData.snapshot) {
        // Get or create GameState instance and load snapshot
        let gameState = GameState.getInstance();
        if (!gameState) {
          // Create a temporary GameState — it will be re-bound when GameScene starts
          gameState = new GameState(this);
        }
        gameState.loadSnapshot(slotData.snapshot);
      }
    } catch {
      // Skip corrupt data
    }

    // Stop title music (GameScene will start its own)
    this.musicSystem?.stopTrack();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  // ─── Options Sub-View ───────────────────────────────────────

  private showOptions(): void {
    this.currentView = 'options';
    this.clearMenuButtons();
    this.clearSubView();
    this.titleText.setVisible(true);
    this.subtitleText.setVisible(false);

    // Options title
    const title = this.add.text(GAME_WIDTH / 2, 70, 'OPTIONS', {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: '#ffcc00',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true },
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(10);
    this.subViewItems.push(title);

    // SFX Volume controls
    this.createVolumeControl(90, 'SFX Volume', 'ambassador-sfx-volume', 'ambassador-sfx-muted');

    // Music Volume controls
    this.createVolumeControl(108, 'Music Volume', 'ambassador-music-volume', 'ambassador-music-muted', this.musicSystem);

    // Hint about M key
    const hint = this.add.text(GAME_WIDTH / 2, 140, 'Press M in-game to toggle mute', {
      fontSize: '6px',
      fontFamily: 'Arial',
      color: '#666688',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true },
    });
    hint.setOrigin(0.5, 0.5);
    hint.setDepth(10);
    this.subViewItems.push(hint);

    this.addBackButton();
  }

  /**
   * Create a volume control row with label, bar, and mute toggle.
   * Reads/writes directly to localStorage (same keys as SoundSystem).
   */
  private createVolumeControl(y: number, label: string, volumeKey: string, muteKey: string, liveMusicSystem?: MusicSystem | null): void {
    const barWidth = 100;
    const barHeight = 8;
    const barX = GAME_WIDTH / 2 - barWidth / 2 + 30;

    // Label
    const labelText = this.add.text(barX - barWidth / 2 - 45, y, label, {
      fontSize: '7px',
      fontFamily: 'Arial',
      color: COLORS.CREDITS_TEXT,
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true },
    });
    labelText.setOrigin(0, 0.5);
    labelText.setDepth(10);
    this.subViewItems.push(labelText);

    // Read current values from localStorage
    let currentVol = 0.7;
    try {
      const stored = localStorage.getItem(volumeKey);
      if (stored !== null) currentVol = Math.max(0, Math.min(1, parseFloat(stored)));
    } catch { /* ignore */ }

    let isMuted = false;
    try { isMuted = localStorage.getItem(muteKey) === '1'; } catch { /* ignore */ }

    // Volume bar background
    const barBg = this.add.rectangle(barX, y, barWidth, barHeight, 0x222244);
    barBg.setStrokeStyle(1, 0x4a4a6e);
    barBg.setDepth(10);
    barBg.setInteractive({ useHandCursor: true });
    this.subViewItems.push(barBg);

    // Volume bar fill
    const fillWidth = currentVol * barWidth;
    const fillX = barX - barWidth / 2 + fillWidth / 2;
    const barFill = this.add.rectangle(fillX, y, fillWidth, barHeight - 2, isMuted ? 0x444466 : 0x4488cc);
    barFill.setDepth(11);
    this.subViewItems.push(barFill);

    // Volume percentage text
    const volText = this.add.text(barX + barWidth / 2 + 8, y, isMuted ? 'MUTE' : `${Math.round(currentVol * 100)}%`, {
      fontSize: '6px',
      fontFamily: 'Arial',
      color: isMuted ? '#666688' : '#aaccff',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true },
    });
    volText.setOrigin(0, 0.5);
    volText.setDepth(10);
    this.subViewItems.push(volText);

    // Click on bar to set volume
    barBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - (barX - barWidth / 2);
      const newVol = Math.max(0, Math.min(1, localX / barWidth));
      currentVol = newVol;
      try {
        localStorage.setItem(volumeKey, String(newVol));
        // Unmute when adjusting volume
        localStorage.setItem(muteKey, '0');
      } catch { /* ignore */ }

      // Update visual
      const newFillWidth = newVol * barWidth;
      barFill.setSize(newFillWidth, barHeight - 2);
      barFill.setPosition(barX - barWidth / 2 + newFillWidth / 2, y);
      barFill.setFillStyle(0x4488cc);
      volText.setText(`${Math.round(newVol * 100)}%`);
      volText.setColor('#aaccff');
      isMuted = false;
      muteBtn.setText('[O]');
      muteBtn.setColor('#88cc88');

      // Apply live update to music system if provided
      if (liveMusicSystem) {
        liveMusicSystem.setVolume(newVol);
        liveMusicSystem.setMuted(false);
      }
    });

    // Mute toggle button
    const muteBtn = this.add.text(barX - barWidth / 2 - 10, y, isMuted ? '[X]' : '[O]', {
      fontSize: '7px',
      fontFamily: 'Arial',
      color: isMuted ? '#666688' : '#88cc88',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true },
    });
    muteBtn.setOrigin(0.5, 0.5);
    muteBtn.setDepth(10);
    muteBtn.setInteractive({ useHandCursor: true });
    this.subViewItems.push(muteBtn);

    muteBtn.on('pointerdown', () => {
      const nowMuted = localStorage.getItem(muteKey) === '1';
      const newMuted = !nowMuted;
      isMuted = newMuted;
      try { localStorage.setItem(muteKey, newMuted ? '1' : '0'); } catch { /* ignore */ }
      muteBtn.setText(newMuted ? '[X]' : '[O]');
      muteBtn.setColor(newMuted ? '#666688' : '#88cc88');
      barFill.setFillStyle(newMuted ? 0x444466 : 0x4488cc);
      volText.setText(newMuted ? 'MUTE' : `${Math.round(currentVol * 100)}%`);
      volText.setColor(newMuted ? '#666688' : '#aaccff');

      // Apply live update to music system if provided
      if (liveMusicSystem) {
        liveMusicSystem.setMuted(newMuted);
      }
    });

    muteBtn.on('pointerover', () => { muteBtn.setColor('#ffffff'); });
    muteBtn.on('pointerout', () => {
      const m = localStorage.getItem(muteKey) === '1';
      muteBtn.setColor(m ? '#666688' : '#88cc88');
    });
  }

  // ─── Credits Sub-View ───────────────────────────────────────

  private showCredits(): void {
    this.currentView = 'credits';
    this.clearMenuButtons();
    this.clearSubView();
    this.titleText.setVisible(true);
    this.subtitleText.setVisible(false);

    // Credits title
    const title = this.add.text(GAME_WIDTH / 2, 70, 'CREDITS', {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: '#ffcc00',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true },
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(10);
    this.subViewItems.push(title);

    const creditsLines = [
      'The Smallest Ambassador',
      '',
      'Based on the novel by',
      'its original author',
      '',
      'Game Engine: Phaser 3',
      'Art Style: VGA Pixel Art',
      '',
      'A Sierra-Style Adventure',
    ];

    const creditsText = this.add.text(GAME_WIDTH / 2, 115, creditsLines.join('\n'), {
      fontSize: '6px',
      fontFamily: 'Arial',
      color: COLORS.CREDITS_TEXT,
      align: 'center',
      lineSpacing: 2,
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true },
    });
    creditsText.setOrigin(0.5, 0.5);
    creditsText.setDepth(10);
    this.subViewItems.push(creditsText);

    this.addBackButton();
  }

  // ─── Aurora Animation ───────────────────────────────────────

  private createAuroraAnimation(): void {
    // Create semi-transparent aurora band overlays that shimmer
    const bands = [
      { y: 30, width: 200, height: 12, color: 0x32dc64, alpha: 0.08 },
      { y: 42, width: 240, height: 10, color: 0x28c8b4, alpha: 0.06 },
      { y: 25, width: 160, height: 8, color: 0x2878c8, alpha: 0.05 },
    ];

    for (const band of bands) {
      const rect = this.add.rectangle(
        GAME_WIDTH / 2 - 20 + Math.random() * 40,
        band.y,
        band.width,
        band.height,
        band.color,
        band.alpha
      );
      rect.setDepth(1);
      this.auroraOverlays.push(rect);

      // Shimmer: oscillate alpha and x position
      this.tweens.add({
        targets: rect,
        alpha: band.alpha * 0.3,
        x: rect.x + 15,
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Slow vertical drift
      this.tweens.add({
        targets: rect,
        y: rect.y + 3,
        duration: 4000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // ─── Star Twinkles ─────────────────────────────────────────

  private createStarTwinkles(): void {
    // Create small white rectangles at star positions that twinkle
    const starPositions = [
      { x: 15, y: 8 }, { x: 48, y: 15 }, { x: 82, y: 5 },
      { x: 120, y: 22 }, { x: 155, y: 10 }, { x: 195, y: 18 },
      { x: 230, y: 7 }, { x: 265, y: 25 }, { x: 290, y: 12 },
      { x: 305, y: 20 }, { x: 35, y: 30 }, { x: 175, y: 4 },
      { x: 245, y: 30 }, { x: 70, y: 25 }, { x: 145, y: 35 },
    ];

    for (const pos of starPositions) {
      const star = this.add.rectangle(pos.x, pos.y, 1, 1, 0xffffff, 0.7);
      star.setDepth(2);
      this.starSprites.push(star);

      // Twinkle animation — randomized timing
      this.tweens.add({
        targets: star,
        alpha: 0.15,
        duration: 800 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000,
      });
    }
  }

  // ─── UI Helpers ─────────────────────────────────────────────

  private addBackButton(): void {
    const backText = this.add.text(GAME_WIDTH / 2, 165, '< Back', {
      fontSize: '8px',
      fontFamily: 'Arial',
      color: COLORS.BUTTON_NORMAL,
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 0, fill: true },
    });
    backText.setOrigin(0.5, 0.5);
    backText.setDepth(10);
    backText.setInteractive({ useHandCursor: true });

    backText.on('pointerover', () => {
      backText.setColor(COLORS.BUTTON_HIGHLIGHT);
    });
    backText.on('pointerout', () => {
      backText.setColor(COLORS.BUTTON_NORMAL);
    });
    backText.on('pointerdown', () => {
      this.showMainMenu();
    });

    this.subViewItems.push(backText);
  }

  private clearMenuButtons(): void {
    for (const btn of this.menuButtons) {
      this.tweens.killTweensOf(btn);
      btn.removeAllListeners();
      btn.destroy();
    }
    this.menuButtons = [];
  }

  private clearSubView(): void {
    for (const item of this.subViewItems) {
      if ('removeAllListeners' in item) {
        (item as Phaser.GameObjects.Text).removeAllListeners();
      }
      item.destroy();
    }
    this.subViewItems = [];
  }
}
