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
  frost: {
    id: 'frost',
    name: 'Commander Frost',
    textureKey: 'npc-frost-sheet',
    assetPath: 'assets/sprites/npc-frost-sheet.png',
    frameWidth: 32,
    frameHeight: 48,
    idleFrames: 2,
    idleFrameRate: 2,
    portraitKey: 'portrait-frost',
    portraitPath: 'assets/portraits/frost.png',
    responses: {
      look: 'Commander Frost stands tall and broad, surveying the colony with sharp eyes. A pale scar runs across his left cheek — a souvenir from a leopard seal encounter. He commands respect without raising his voice.',
      talk: { action: 'startDialogue', data: { dialogueId: 'frost-colony' } },
      use: "Commander Frost gives you a withering look. You decide against it.",
      take: "You couldn't lift Commander Frost even if you tried. He's twice your size.",
    },
  },
  riptide: {
    id: 'riptide',
    name: 'Riptide',
    textureKey: 'npc-riptide-sheet',
    assetPath: 'assets/sprites/npc-riptide-sheet.png',
    frameWidth: 32,
    frameHeight: 48,
    idleFrames: 2,
    idleFrameRate: 2,
    portraitKey: 'portrait-riptide',
    portraitPath: 'assets/portraits/riptide.png',
    responses: {
      look: "Riptide is the biggest penguin in the colony. He flexes his flippers and sneers in your direction. He's never liked that you're different.",
      talk: { action: 'startDialogue', data: { dialogueId: 'riptide-colony' } },
      use: "Riptide shoves you away before you can even try. 'Back off, Puddle.'",
      take: "That's... not happening. Riptide is enormous.",
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
  'Commander Frost': { key: 'portrait-frost', path: 'assets/portraits/frost.png' },
  Riptide: { key: 'portrait-riptide', path: 'assets/portraits/riptide.png' },
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
