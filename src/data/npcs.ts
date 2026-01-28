import { HotspotResponses } from './rooms';

/**
 * NPC definition — static data for a non-player character.
 *
 * Each NPC has a unique ID, display name, sprite configuration,
 * and verb responses (similar to hotspot responses).
 */
export interface NPCDefinition {
  id: string;
  name: string;
  /** Sprite sheet texture key (loaded in BootScene) */
  textureKey: string;
  /** Asset path relative to public/ */
  assetPath: string;
  /** Frame dimensions within the sprite sheet */
  frameWidth: number;
  frameHeight: number;
  /** Number of idle animation frames */
  idleFrames: number;
  /** Idle animation frame rate (fps) */
  idleFrameRate: number;
  /** Verb responses when the player interacts with this NPC */
  responses: HotspotResponses;
}

/**
 * NPC definitions registry — all NPCs indexed by ID.
 */
export const NPC_DEFINITIONS: Record<string, NPCDefinition> = {
  bubble: {
    id: 'bubble',
    name: 'Bubble',
    textureKey: 'npc-bubble-sheet',
    assetPath: 'assets/sprites/npc-bubble-sheet.png',
    frameWidth: 32,
    frameHeight: 48,
    idleFrames: 2,
    idleFrameRate: 2,
    responses: {
      look: 'Bubble is a cheerful young penguin with bright eyes. She waves at you enthusiastically.',
      talk: { action: 'startDialogue', data: { dialogueId: 'bubble-greeting' } },
      use: "You can't use Bubble. She's a penguin, not a tool!",
      take: "You can't pick up another penguin!",
    },
  },
};

/**
 * Look up an NPC definition by ID
 */
export function getNPCDefinition(npcId: string): NPCDefinition | null {
  return NPC_DEFINITIONS[npcId] ?? null;
}
