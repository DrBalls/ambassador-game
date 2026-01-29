import Phaser from 'phaser';
import { DialogueAction } from '../data/dialogue';
import { getItemDefinition } from '../data/items';
import { InventoryItem } from './InventorySystem';

/**
 * Serializable snapshot of the full game state.
 * Used by SaveSystem (US-022) and for debug inspection.
 */
export interface GameStateSnapshot {
  currentRoomId: string | null;
  playerPosition: { x: number; y: number };
  inventory: InventoryItem[];
  flags: Record<string, boolean>;
  quests: Record<string, string>;
}

/**
 * GameState — Centralized singleton managing all persistent game state.
 *
 * Tracks:
 * - Current room ID
 * - Player position (x, y)
 * - Inventory items (has/add/remove)
 * - Boolean flags (for game progression and dialogue conditions)
 * - Quest states (active, completed, etc.)
 *
 * All mutations emit scene events so UI systems can react:
 * - 'gamestate:roomChanged' (roomId: string)
 * - 'gamestate:playerMoved' (position: {x, y})
 * - 'gamestate:inventoryChanged' (items: InventoryItem[])
 * - 'gamestate:giveItem' (item: InventoryItem)
 * - 'gamestate:takeItem' (itemId: string)
 * - 'gamestate:flagChanged' (key: string, value: boolean)
 * - 'gamestate:questStarted' (questId: string)
 * - 'gamestate:questUpdated' (questId: string, status: string)
 *
 * Also listens for 'dialogue:action' to execute setFlag/giveItem/takeItem/startQuest.
 */
export class GameState {
  // Singleton instance
  private static instance: GameState | null = null;

  private scene: Phaser.Scene;
  private currentRoomId: string | null = null;
  private playerPosition: { x: number; y: number } = { x: 0, y: 0 };
  private inventory: InventoryItem[] = [];
  private flags: Map<string, boolean> = new Map();
  private quests: Map<string, string> = new Map(); // questId -> status

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Register as singleton
    GameState.instance = this;

    // Listen for dialogue actions emitted by DialogueSystem
    this.scene.events.on('dialogue:action', (action: DialogueAction) => {
      this.executeAction(action);
    });
  }

  /**
   * Get the singleton instance.
   * Returns null if GameState hasn't been constructed yet.
   */
  static getInstance(): GameState | null {
    return GameState.instance;
  }

  /**
   * Reset all game state to initial values.
   * Used when starting a new game from the title screen.
   */
  reset(): void {
    this.currentRoomId = null;
    this.playerPosition = { x: 0, y: 0 };
    this.inventory = [];
    this.flags.clear();
    this.quests.clear();
  }

  /**
   * Update the scene reference (e.g., when restarting scenes).
   */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;

    // Re-bind dialogue:action listener on new scene
    this.scene.events.on('dialogue:action', (action: DialogueAction) => {
      this.executeAction(action);
    });
  }

  // ─── Dialogue Action Execution ─────────────────────────────

  /**
   * Execute a dialogue action — dispatches to the appropriate handler.
   */
  executeAction(action: DialogueAction): void {
    switch (action.type) {
      case 'setFlag':
        this.setFlag(action.target, action.value ?? true);
        break;
      case 'giveItem':
        this.giveItem(action.target);
        break;
      case 'takeItem':
        this.takeItem(action.target);
        break;
      case 'startQuest':
        this.startQuest(action.target);
        break;
    }
  }

  // ─── Room State ────────────────────────────────────────────

  /**
   * Get the current room ID.
   */
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  /**
   * Set the current room ID. Emits 'gamestate:roomChanged'.
   */
  setCurrentRoomId(roomId: string): void {
    this.currentRoomId = roomId;
    this.scene.events.emit('gamestate:roomChanged', roomId);
  }

  // ─── Player Position ───────────────────────────────────────

  /**
   * Get the player's current position.
   */
  getPlayerPosition(): { x: number; y: number } {
    return { ...this.playerPosition };
  }

  /**
   * Set the player's position. Emits 'gamestate:playerMoved'.
   */
  setPlayerPosition(x: number, y: number): void {
    this.playerPosition = { x, y };
    this.scene.events.emit('gamestate:playerMoved', this.playerPosition);
  }

  // ─── Inventory ─────────────────────────────────────────────

  /**
   * Check if the player has an item by ID.
   */
  hasItem(itemId: string): boolean {
    return this.inventory.some(item => item.id === itemId);
  }

  /**
   * Add an item to inventory by InventoryItem object.
   * Emits 'gamestate:giveItem' and 'gamestate:inventoryChanged'.
   */
  addItem(item: InventoryItem): void {
    this.inventory.push(item);
    this.scene.events.emit('gamestate:giveItem', item);
    this.scene.events.emit('gamestate:inventoryChanged', this.getInventory());
  }

  /**
   * Remove an item from inventory by ID.
   * Emits 'gamestate:takeItem' and 'gamestate:inventoryChanged'.
   * Returns true if the item was found and removed.
   */
  removeItem(itemId: string): boolean {
    const index = this.inventory.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    this.inventory.splice(index, 1);
    this.scene.events.emit('gamestate:takeItem', itemId);
    this.scene.events.emit('gamestate:inventoryChanged', this.getInventory());
    return true;
  }

  /**
   * Get a copy of the current inventory items.
   */
  getInventory(): InventoryItem[] {
    return [...this.inventory];
  }

  /**
   * Sync inventory state from InventorySystem.
   * Called when InventorySystem changes directly (e.g., item combinations).
   */
  syncInventory(items: InventoryItem[]): void {
    this.inventory = [...items];
  }

  // ─── Flags ─────────────────────────────────────────────────

  /**
   * Set a boolean flag in the game state.
   * Emits 'gamestate:flagChanged'.
   */
  setFlag(key: string, value: boolean): void {
    this.flags.set(key, value);
    this.scene.events.emit('gamestate:flagChanged', key, value);
  }

  /**
   * Get a flag value. Returns false if the flag has not been set.
   */
  getFlag(key: string): boolean {
    return this.flags.get(key) ?? false;
  }

  // ─── Quests ────────────────────────────────────────────────

  /**
   * Start a quest by ID. Records it as 'active'.
   * Emits 'gamestate:questStarted'.
   */
  startQuest(questId: string): void {
    this.quests.set(questId, 'active');
    this.scene.events.emit('gamestate:questStarted', questId);
  }

  /**
   * Update a quest's status.
   * Emits 'gamestate:questUpdated'.
   */
  setQuestStatus(questId: string, status: string): void {
    this.quests.set(questId, status);
    this.scene.events.emit('gamestate:questUpdated', questId, status);
  }

  /**
   * Get quest status. Returns null if quest hasn't been started.
   */
  getQuestStatus(questId: string): string | null {
    return this.quests.get(questId) ?? null;
  }

  // ─── Dialogue Action Helpers (private) ─────────────────────

  /**
   * Give an item to inventory via dialogue action (looks up by item ID).
   */
  private giveItem(itemId: string): void {
    const itemDef = getItemDefinition(itemId);
    if (!itemDef) {
      console.warn(`GameState: item definition not found for giveItem: ${itemId}`);
      return;
    }
    this.addItem({
      id: itemDef.id,
      name: itemDef.name,
      description: itemDef.description,
      icon: itemDef.icon,
    });
  }

  /**
   * Remove an item from inventory via dialogue action.
   */
  private takeItem(itemId: string): void {
    this.removeItem(itemId);
  }

  // ─── Serialization ─────────────────────────────────────────

  /**
   * Get a full snapshot of game state for save/debug.
   */
  getSnapshot(): GameStateSnapshot {
    return {
      currentRoomId: this.currentRoomId,
      playerPosition: { ...this.playerPosition },
      inventory: [...this.inventory],
      flags: this.getAllFlags(),
      quests: this.getAllQuests(),
    };
  }

  /**
   * Restore game state from a snapshot (for loading saves).
   */
  loadSnapshot(snapshot: GameStateSnapshot): void {
    this.currentRoomId = snapshot.currentRoomId;
    this.playerPosition = { ...snapshot.playerPosition };
    this.inventory = [...snapshot.inventory];

    this.flags.clear();
    for (const [key, value] of Object.entries(snapshot.flags)) {
      this.flags.set(key, value);
    }

    this.quests.clear();
    for (const [key, value] of Object.entries(snapshot.quests)) {
      this.quests.set(key, value);
    }
  }

  /**
   * Get all flags as a plain object (for save/debug).
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [key, value] of this.flags) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Get all quests as a plain object (for save/debug).
   */
  getAllQuests(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of this.quests) {
      result[key] = value;
    }
    return result;
  }
}
