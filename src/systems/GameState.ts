import Phaser from 'phaser';
import { DialogueAction } from '../data/dialogue';
import { getItemDefinition } from '../data/items';

/**
 * GameState — Centralized game state for flags, quests, and dialogue action execution.
 *
 * Listens for 'dialogue:action' events and dispatches the appropriate state changes:
 * - setFlag: sets a boolean flag in the flags map
 * - giveItem: adds an item to the player's inventory (via 'gamestate:giveItem' event)
 * - takeItem: removes an item from the player's inventory (via 'gamestate:takeItem' event)
 * - startQuest: records a quest as active in the quests map
 *
 * Inventory operations are communicated via events rather than direct coupling
 * to InventorySystem, keeping the two systems decoupled.
 */
export class GameState {
  private scene: Phaser.Scene;
  private flags: Map<string, boolean> = new Map();
  private quests: Map<string, string> = new Map(); // questId -> status

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Listen for dialogue actions emitted by DialogueSystem
    this.scene.events.on('dialogue:action', (action: DialogueAction) => {
      this.executeAction(action);
    });
  }

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

  /**
   * Set a boolean flag in the game state.
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

  /**
   * Give an item to the player's inventory by item ID.
   * Looks up the item definition and emits a 'gamestate:giveItem' event
   * for InventorySystem to handle.
   */
  private giveItem(itemId: string): void {
    const itemDef = getItemDefinition(itemId);
    if (!itemDef) {
      console.warn(`GameState: item definition not found for giveItem: ${itemId}`);
      return;
    }
    this.scene.events.emit('gamestate:giveItem', {
      id: itemDef.id,
      name: itemDef.name,
      description: itemDef.description,
      icon: itemDef.icon,
    });
  }

  /**
   * Remove an item from the player's inventory by item ID.
   * Emits a 'gamestate:takeItem' event for InventorySystem to handle.
   */
  private takeItem(itemId: string): void {
    this.scene.events.emit('gamestate:takeItem', itemId);
  }

  /**
   * Start a quest by ID. Records it as 'active' in the quests map.
   */
  private startQuest(questId: string): void {
    this.quests.set(questId, 'active');
    this.scene.events.emit('gamestate:questStarted', questId);
  }

  /**
   * Get quest status. Returns null if quest hasn't been started.
   */
  getQuestStatus(questId: string): string | null {
    return this.quests.get(questId) ?? null;
  }

  /**
   * Get all flags (for save/debug purposes).
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [key, value] of this.flags) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Get all quests (for save/debug purposes).
   */
  getAllQuests(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of this.quests) {
      result[key] = value;
    }
    return result;
  }
}
