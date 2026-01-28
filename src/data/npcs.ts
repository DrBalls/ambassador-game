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
  /** Portrait texture key for dialogue box (loaded in BootScene) */
  portraitKey: string;
  /** Portrait asset path relative to public/ */
  portraitPath: string;
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
    portraitKey: 'portrait-bubble',
    portraitPath: 'assets/portraits/bubble.png',
    responses: {
      look: 'Bubble is a cheerful young penguin with bright eyes. She waves at you enthusiastically.',
      talk: { action: 'startDialogue', data: { dialogueId: 'bubble-greeting' } },
      use: "You can't use Bubble. She's a penguin, not a tool!",
      take: "You can't pick up another penguin!",
    },
  },
};

/**
 * Speaker portraits — maps speaker display names to portrait texture keys.
 * Used by DialogueSystem to show the correct portrait for each dialogue node.
 * Includes player character and all NPCs.
 */
export const SPEAKER_PORTRAITS: Record<string, { key: string; path: string }> = {
  Pip: { key: 'portrait-pip', path: 'assets/portraits/pip.png' },
  Bubble: { key: 'portrait-bubble', path: 'assets/portraits/bubble.png' },
};

/**
 * Look up a portrait texture key by speaker name
 */
export function getSpeakerPortraitKey(speakerName: string): string | null {
  return SPEAKER_PORTRAITS[speakerName]?.key ?? null;
}

/**
 * Look up an NPC definition by ID
 */
export function getNPCDefinition(npcId: string): NPCDefinition | null {
  return NPC_DEFINITIONS[npcId] ?? null;
}
