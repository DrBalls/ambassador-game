/**
 * Dialogue registry and barrel exports
 */

export type {
  DialogueAction,
  DialogueNode,
  DialogueResponse,
  DialogueTree,
} from './types';

import { DialogueTree } from './types';
import { bubbleGreeting } from './test-dialogue';
import { frostColony } from './frost-colony';
import { riptideColony } from './riptide-colony';
import { forbiddenZoneVision, forbiddenZoneRiptide, forbiddenZoneFrost } from './forbidden-zone-vision';

/**
 * All dialogue trees in the game, keyed by dialogue ID.
 * Add new dialogues here when created.
 */
export const DIALOGUE_TREES: Record<string, DialogueTree> = {
  [bubbleGreeting.id]: bubbleGreeting,
  [frostColony.id]: frostColony,
  [riptideColony.id]: riptideColony,
  [forbiddenZoneVision.id]: forbiddenZoneVision,
  [forbiddenZoneRiptide.id]: forbiddenZoneRiptide,
  [forbiddenZoneFrost.id]: forbiddenZoneFrost,
};

/**
 * Look up a dialogue tree by ID
 */
export function getDialogueTree(dialogueId: string): DialogueTree | null {
  return DIALOGUE_TREES[dialogueId] ?? null;
}
