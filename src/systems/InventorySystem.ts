import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';
import { getCombinationResult, getItemDefinition } from '../data/items';
import { Verb } from './VerbSystem';

/**
 * Layout constants for the inventory panel
 *
 * UI Layout (320x200):
 * - Viewport: 0-120 (120px)
 * - Inventory: 120-160 (40px) <- this panel
 * - Sentence line: 160-176 (16px)
 * - Verb bar: 176-200 (24px)
 */
const INVENTORY = {
  HEIGHT: 40, // Total height of inventory area
  Y_OFFSET: 120, // Below gameplay viewport (200 - 80 total UI)
  SLOT_SIZE: 32, // Each slot is 32x32 pixels
  SLOT_PADDING: 4, // 4px padding between slots
  VISIBLE_SLOTS: 8, // Number of visible slots at once
  ARROW_WIDTH: 16, // Width of scroll arrows
};

/**
 * Color constants for the inventory panel
 */
const COLORS = {
  BACKGROUND: 0x1a1a2e, // Dark blue, matches verb bar
  SLOT: 0x2a2a4e, // Slightly lighter for slots
  SLOT_HOVER: 0x3a3a6e, // Hover state
  SLOT_SELECTED: 0x5a5ace, // Selected item
  ARROW: 0x4a4a6e, // Arrow color
  ARROW_HOVER: 0x6a6a9e, // Arrow hover
  ARROW_DISABLED: 0x2a2a3e, // Arrow when can't scroll
  TEXT: '#ffffff',
};

/**
 * Inventory item structure
 */
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string; // Texture key for the item icon
}

/**
 * Inventory slot UI element
 */
interface InventorySlot {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image | null;
  item: InventoryItem | null;
  index: number; // Slot index (0-7)
}

/**
 * InventorySystem - SCUMM-style inventory panel for storing collected items
 *
 * Features:
 * - 8 visible slots with 32x32 pixel items
 * - Scroll arrows when more than 8 items
 * - Click item to select for USE/GIVE actions
 * - Right-click item shows LOOK description
 * - Selected item has highlight border
 */
export class InventorySystem {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private slots: InventorySlot[] = [];
  private items: InventoryItem[] = [];
  private scrollOffset: number = 0; // First visible item index
  private selectedIndex: number | null = null; // Index in items array
  private leftArrow: Phaser.GameObjects.Container | null = null;
  private rightArrow: Phaser.GameObjects.Container | null = null;
  private currentVerb: Verb = Verb.WALK;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, INVENTORY.Y_OFFSET);
    this.createInventoryPanel();
    this.setupEventListeners();
  }

  /**
   * Get all items in the inventory
   */
  getItems(): InventoryItem[] {
    return [...this.items];
  }

  /**
   * Check if the inventory has an item by ID
   */
  hasItem(itemId: string): boolean {
    return this.items.some((item) => item.id === itemId);
  }

  /**
   * Add an item to the inventory
   */
  addItem(item: InventoryItem): void {
    this.items.push(item);
    this.updateSlots();
    this.updateArrows();
    this.scene.events.emit('inventory:changed', this.items);
  }

  /**
   * Remove an item from the inventory by ID
   */
  removeItem(itemId: string): boolean {
    const index = this.items.findIndex((item) => item.id === itemId);
    if (index === -1) return false;

    this.items.splice(index, 1);

    // Clear selection if removed item was selected
    if (this.selectedIndex === index) {
      this.selectedIndex = null;
      this.scene.events.emit('inventory:deselected');
    } else if (this.selectedIndex !== null && this.selectedIndex > index) {
      // Adjust selection index if it was after the removed item
      this.selectedIndex--;
    }

    // Adjust scroll offset if needed
    if (this.scrollOffset > 0 && this.scrollOffset >= this.items.length) {
      this.scrollOffset = Math.max(0, this.items.length - INVENTORY.VISIBLE_SLOTS);
    }

    this.updateSlots();
    this.updateArrows();
    this.scene.events.emit('inventory:changed', this.items);
    return true;
  }

  /**
   * Get the currently selected item
   */
  getSelectedItem(): InventoryItem | null {
    if (this.selectedIndex === null) return null;
    return this.items[this.selectedIndex] ?? null;
  }

  /**
   * Clear the current selection
   */
  clearSelection(): void {
    this.selectedIndex = null;
    this.updateSlots();
    this.scene.events.emit('inventory:deselected');
  }

  /**
   * Create the inventory panel UI
   */
  private createInventoryPanel(): void {
    // Background bar
    const background = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      INVENTORY.HEIGHT / 2,
      GAME_WIDTH,
      INVENTORY.HEIGHT,
      COLORS.BACKGROUND
    );
    this.container.add(background);

    // Create scroll arrows
    this.createScrollArrows();

    // Create 8 inventory slots
    const totalSlotsWidth =
      INVENTORY.VISIBLE_SLOTS * INVENTORY.SLOT_SIZE +
      (INVENTORY.VISIBLE_SLOTS - 1) * INVENTORY.SLOT_PADDING;
    const startX =
      (GAME_WIDTH - totalSlotsWidth) / 2 + INVENTORY.SLOT_SIZE / 2;

    for (let i = 0; i < INVENTORY.VISIBLE_SLOTS; i++) {
      const x =
        startX + i * (INVENTORY.SLOT_SIZE + INVENTORY.SLOT_PADDING);
      const slot = this.createSlot(x, INVENTORY.HEIGHT / 2, i);
      this.slots.push(slot);
    }
  }

  /**
   * Create a single inventory slot
   */
  private createSlot(x: number, y: number, index: number): InventorySlot {
    const slotContainer = this.scene.add.container(x, y);

    // Slot background
    const slotBg = this.scene.add.rectangle(
      0,
      0,
      INVENTORY.SLOT_SIZE,
      INVENTORY.SLOT_SIZE,
      COLORS.SLOT
    );
    slotBg.setInteractive({ useHandCursor: true });
    slotContainer.add(slotBg);

    const slot: InventorySlot = {
      container: slotContainer,
      background: slotBg,
      icon: null,
      item: null,
      index,
    };

    // Set up slot events
    this.setupSlotEvents(slot);

    this.container.add(slotContainer);
    return slot;
  }

  /**
   * Set up events for an inventory slot
   */
  private setupSlotEvents(slot: InventorySlot): void {
    const { background, index } = slot;

    background.on('pointerover', () => {
      const itemIndex = this.scrollOffset + index;
      const item = this.items[itemIndex];
      if (item) {
        // Update slot visual
        if (this.selectedIndex !== itemIndex) {
          background.setFillStyle(COLORS.SLOT_HOVER);
        }
        // Emit hover event for sentence line
        this.scene.events.emit('hotspot:hover', item.name);
      }
    });

    background.on('pointerout', () => {
      const itemIndex = this.scrollOffset + index;
      if (this.selectedIndex !== itemIndex) {
        background.setFillStyle(COLORS.SLOT);
      }
      this.scene.events.emit('hotspot:leave');
    });

    // Left click to select item
    background.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const itemIndex = this.scrollOffset + index;
      const item = this.items[itemIndex];
      if (!item) return;

      if (pointer.rightButtonDown()) {
        // Right-click: LOOK at item (show description)
        this.scene.events.emit('inventory:look', item);
      } else {
        // Check if USE verb is active and an item is already selected
        if (
          this.currentVerb === Verb.USE &&
          this.selectedIndex !== null &&
          this.selectedIndex !== itemIndex
        ) {
          // Attempt item combination
          const sourceItem = this.items[this.selectedIndex];
          if (sourceItem) {
            this.attemptCombination(sourceItem, item);
          }
        } else {
          // Normal select/deselect behavior
          if (this.selectedIndex === itemIndex) {
            // Deselect if already selected
            this.selectedIndex = null;
            this.scene.events.emit('inventory:deselected');
          } else {
            this.selectedIndex = itemIndex;
            this.scene.events.emit('inventory:selected', item);
          }
          this.updateSlots();
        }
      }
    });
  }

  /**
   * Create scroll arrows on left and right
   */
  private createScrollArrows(): void {
    // Left arrow
    this.leftArrow = this.createArrow(
      INVENTORY.ARROW_WIDTH / 2 + 4,
      INVENTORY.HEIGHT / 2,
      '<',
      () => this.scrollLeft()
    );

    // Right arrow
    this.rightArrow = this.createArrow(
      GAME_WIDTH - INVENTORY.ARROW_WIDTH / 2 - 4,
      INVENTORY.HEIGHT / 2,
      '>',
      () => this.scrollRight()
    );

    this.updateArrows();
  }

  /**
   * Create a single scroll arrow
   */
  private createArrow(
    x: number,
    y: number,
    text: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const arrowContainer = this.scene.add.container(x, y);

    const arrowBg = this.scene.add.rectangle(
      0,
      0,
      INVENTORY.ARROW_WIDTH,
      INVENTORY.SLOT_SIZE,
      COLORS.ARROW
    );
    arrowBg.setInteractive({ useHandCursor: true });

    const arrowText = this.scene.add.text(0, 0, text, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: COLORS.TEXT,
    });
    arrowText.setOrigin(0.5, 0.5);

    arrowContainer.add(arrowBg);
    arrowContainer.add(arrowText);

    // Store references for enabling/disabling
    arrowContainer.setData('background', arrowBg);
    arrowContainer.setData('text', arrowText);

    arrowBg.on('pointerover', () => {
      if (arrowContainer.getData('enabled')) {
        arrowBg.setFillStyle(COLORS.ARROW_HOVER);
      }
    });

    arrowBg.on('pointerout', () => {
      if (arrowContainer.getData('enabled')) {
        arrowBg.setFillStyle(COLORS.ARROW);
      }
    });

    arrowBg.on('pointerdown', () => {
      if (arrowContainer.getData('enabled')) {
        onClick();
      }
    });

    this.container.add(arrowContainer);
    return arrowContainer;
  }

  /**
   * Scroll inventory left
   */
  private scrollLeft(): void {
    if (this.scrollOffset > 0) {
      this.scrollOffset--;
      this.updateSlots();
      this.updateArrows();
    }
  }

  /**
   * Scroll inventory right
   */
  private scrollRight(): void {
    const maxOffset = Math.max(0, this.items.length - INVENTORY.VISIBLE_SLOTS);
    if (this.scrollOffset < maxOffset) {
      this.scrollOffset++;
      this.updateSlots();
      this.updateArrows();
    }
  }

  /**
   * Update scroll arrow states (enabled/disabled)
   */
  private updateArrows(): void {
    const canScrollLeft = this.scrollOffset > 0;
    const canScrollRight =
      this.scrollOffset < this.items.length - INVENTORY.VISIBLE_SLOTS;

    this.setArrowEnabled(this.leftArrow, canScrollLeft);
    this.setArrowEnabled(this.rightArrow, canScrollRight);
  }

  /**
   * Enable or disable a scroll arrow
   */
  private setArrowEnabled(
    arrow: Phaser.GameObjects.Container | null,
    enabled: boolean
  ): void {
    if (!arrow) return;

    arrow.setData('enabled', enabled);
    const bg = arrow.getData('background') as Phaser.GameObjects.Rectangle;

    if (enabled) {
      bg.setFillStyle(COLORS.ARROW);
      bg.setInteractive({ useHandCursor: true });
    } else {
      bg.setFillStyle(COLORS.ARROW_DISABLED);
      bg.disableInteractive();
    }
  }

  /**
   * Update all slot visuals based on current items and scroll position
   */
  private updateSlots(): void {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot) continue;

      const itemIndex = this.scrollOffset + i;
      const item = this.items[itemIndex];

      // Remove existing icon if any
      if (slot.icon) {
        slot.icon.destroy();
        slot.icon = null;
      }

      slot.item = item ?? null;

      if (item) {
        // Check if texture exists before creating sprite
        if (this.scene.textures.exists(item.icon)) {
          slot.icon = this.scene.add.image(0, 0, item.icon);
          slot.icon.setDisplaySize(
            INVENTORY.SLOT_SIZE - 4,
            INVENTORY.SLOT_SIZE - 4
          );
          slot.container.add(slot.icon);
        }

        // Update selection visual
        if (this.selectedIndex === itemIndex) {
          slot.background.setFillStyle(COLORS.SLOT_SELECTED);
        } else {
          slot.background.setFillStyle(COLORS.SLOT);
        }
      } else {
        slot.background.setFillStyle(COLORS.SLOT);
      }
    }
  }

  /**
   * Attempt to combine two inventory items
   */
  private attemptCombination(
    sourceItem: InventoryItem,
    targetItem: InventoryItem
  ): void {
    const result = getCombinationResult(sourceItem.id, targetItem.id);

    if (result) {
      const resultItem = getItemDefinition(result.resultItemId);
      if (!resultItem) return;

      // Remove source items
      if (result.removeSource) {
        this.removeItem(sourceItem.id);
      }
      if (result.removeTarget) {
        this.removeItem(targetItem.id);
      }

      // Add result item
      this.addItem({
        id: resultItem.id,
        name: resultItem.name,
        description: resultItem.description,
        icon: resultItem.icon,
      });

      // Emit combination success
      this.scene.events.emit('combination:success', resultItem);
    } else {
      // Emit combination failure
      this.scene.events.emit('combination:fail', sourceItem, targetItem);
    }

    // Clear selection after combination attempt
    this.selectedIndex = null;
    this.updateSlots();
    this.scene.events.emit('inventory:deselected');
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Enable right-click context menu prevention on game canvas
    this.scene.input.mouse?.disableContextMenu();

    // Track the current verb for combination logic
    this.scene.events.on('verb:selected', (verb: Verb) => {
      this.currentVerb = verb;
    });
  }

  /**
   * Clean up resources when the system is destroyed
   */
  destroy(): void {
    this.container.destroy();
    this.slots = [];
    this.items = [];
  }
}
