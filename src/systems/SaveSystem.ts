import Phaser from 'phaser';
import { GameState, GameStateSnapshot } from './GameState';

/** Metadata stored alongside a game state snapshot in a save slot. */
export interface SaveSlotData {
  snapshot: GameStateSnapshot;
  timestamp: number;
  roomName: string;
}

/** localStorage key prefix for save slots */
const SAVE_KEY_PREFIX = 'ambassador-save-slot-';

/** Number of available save slots */
export const SAVE_SLOT_COUNT = 3;

/**
 * SaveSystem — Persists game state to localStorage.
 *
 * Features:
 * - Three save slots (0, 1, 2)
 * - Automatic save on room transitions
 * - Each save includes a timestamp and room name for display
 * - Serializes GameStateSnapshot to JSON via localStorage
 *
 * Usage:
 *   const saveSystem = new SaveSystem(scene);
 *   saveSystem.saveToSlot(0);           // manual save
 *   const data = saveSystem.loadSlot(0); // manual load
 *   saveSystem.getSlotInfo();            // slot summaries for UI
 */
export class SaveSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Auto-save to slot 0 on room transitions
    this.scene.events.on('gamestate:roomChanged', () => {
      this.autoSave();
    });
  }

  /**
   * Save current game state to a specific slot (0-based index).
   * Returns true if successful.
   */
  saveToSlot(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= SAVE_SLOT_COUNT) {
      console.warn(`SaveSystem: invalid slot index ${slotIndex}`);
      return false;
    }

    const gameState = GameState.getInstance();
    if (!gameState) {
      console.warn('SaveSystem: GameState not initialized');
      return false;
    }

    const snapshot = gameState.getSnapshot();
    const roomName = snapshot.currentRoomId ?? 'Unknown';

    const slotData: SaveSlotData = {
      snapshot,
      timestamp: Date.now(),
      roomName,
    };

    try {
      const key = SAVE_KEY_PREFIX + slotIndex;
      localStorage.setItem(key, JSON.stringify(slotData));
      console.log(`SaveSystem: saved to slot ${slotIndex} (${roomName})`);
      return true;
    } catch (e) {
      console.error(`SaveSystem: failed to save to slot ${slotIndex}`, e);
      return false;
    }
  }

  /**
   * Load game state from a specific slot.
   * Returns the SaveSlotData or null if the slot is empty.
   */
  loadSlot(slotIndex: number): SaveSlotData | null {
    if (slotIndex < 0 || slotIndex >= SAVE_SLOT_COUNT) {
      console.warn(`SaveSystem: invalid slot index ${slotIndex}`);
      return null;
    }

    try {
      const key = SAVE_KEY_PREFIX + slotIndex;
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const slotData = JSON.parse(raw) as SaveSlotData;
      return slotData;
    } catch (e) {
      console.error(`SaveSystem: failed to load slot ${slotIndex}`, e);
      return null;
    }
  }

  /**
   * Check if a save slot has data.
   */
  hasSlotData(slotIndex: number): boolean {
    const key = SAVE_KEY_PREFIX + slotIndex;
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get summary info for all save slots (for save/load menu UI).
   * Returns an array of { slotIndex, hasData, timestamp?, roomName? }.
   */
  getSlotInfo(): Array<{
    slotIndex: number;
    hasData: boolean;
    timestamp?: number;
    roomName?: string;
  }> {
    const slots = [];
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      const data = this.loadSlot(i);
      if (data) {
        slots.push({
          slotIndex: i,
          hasData: true,
          timestamp: data.timestamp,
          roomName: data.roomName,
        });
      } else {
        slots.push({ slotIndex: i, hasData: false });
      }
    }
    return slots;
  }

  /**
   * Check if any save slot has data (useful for "Continue" button visibility).
   */
  hasSaveData(): boolean {
    for (let i = 0; i < SAVE_SLOT_COUNT; i++) {
      if (this.hasSlotData(i)) return true;
    }
    return false;
  }

  /**
   * Auto-save to slot 0 (triggered on room transitions).
   */
  private autoSave(): void {
    this.saveToSlot(0);
  }

  /**
   * Clean up event listeners.
   */
  destroy(): void {
    this.scene.events.off('gamestate:roomChanged');
  }
}
