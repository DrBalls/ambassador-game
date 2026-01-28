import { InventoryItem } from '../systems/InventorySystem';

/**
 * Item definition with combination recipes
 */
export interface ItemDefinition extends InventoryItem {
  combinesWith?: Record<string, string>; // sourceItemId -> resultItemId
}

/**
 * Combination result: defines what two items produce when combined
 */
export interface CombinationResult {
  resultItemId: string;
  removeSource: boolean; // Remove the item used (USE X)
  removeTarget: boolean; // Remove the item used ON (ON Y)
}

/**
 * Item combination registry
 * Key format: "sourceId+targetId" -> result item ID
 * Combinations are bidirectional: A+B and B+A both work
 */
export const ITEM_COMBINATIONS: Record<string, CombinationResult> = {
  'rope+weight': {
    resultItemId: 'weighted-rope',
    removeSource: true,
    removeTarget: true,
  },
  'weight+rope': {
    resultItemId: 'weighted-rope',
    removeSource: true,
    removeTarget: true,
  },
  'ice-lens+abalone-shell': {
    resultItemId: 'signal-mirror',
    removeSource: true,
    removeTarget: true,
  },
  'abalone-shell+ice-lens': {
    resultItemId: 'signal-mirror',
    removeSource: true,
    removeTarget: true,
  },
};

/**
 * All item definitions in the game
 */
export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  rope: {
    id: 'rope',
    name: 'Rope',
    description: 'A sturdy piece of kelp rope. Good for tying things together.',
    icon: 'item-rope',
  },
  weight: {
    id: 'weight',
    name: 'Fishing Weight',
    description: 'A heavy stone weight used for fishing nets.',
    icon: 'item-weight',
  },
  'weighted-rope': {
    id: 'weighted-rope',
    name: 'Weighted Rope',
    description: 'A rope with a weight attached. Perfect for the pulley system.',
    icon: 'item-weighted-rope',
  },
  'ice-lens': {
    id: 'ice-lens',
    name: 'Ice Lens',
    description: 'A carefully shaped piece of clear ice that focuses light.',
    icon: 'item-ice-lens',
  },
  'abalone-shell': {
    id: 'abalone-shell',
    name: 'Abalone Shell',
    description: 'A beautiful iridescent shell. The inside is very reflective.',
    icon: 'item-abalone-shell',
  },
  'signal-mirror': {
    id: 'signal-mirror',
    name: 'Signal Mirror',
    description: 'An ice lens mounted in an abalone shell. It catches and directs light beautifully.',
    icon: 'item-signal-mirror',
  },
  'lucky-shell': {
    id: 'lucky-shell',
    name: 'Lucky Shell',
    description: "A small pink shell from Bubble. She says it brings good luck at colony meetings.",
    icon: 'item-lucky-shell',
  },
};

/**
 * Look up a combination result for two items
 */
export function getCombinationResult(
  sourceItemId: string,
  targetItemId: string
): CombinationResult | null {
  const key = `${sourceItemId}+${targetItemId}`;
  return ITEM_COMBINATIONS[key] ?? null;
}

/**
 * Get an item definition by ID
 */
export function getItemDefinition(itemId: string): ItemDefinition | null {
  return ITEM_DEFINITIONS[itemId] ?? null;
}
