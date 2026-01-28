/**
 * Room data types for The Smallest Ambassador
 *
 * Rooms are the primary content unit in the adventure game.
 * Each room defines a background, interactive hotspots, exits,
 * walkable areas, NPC placements, and ambient sound.
 */

/**
 * A 2D point in game coordinates (320x200 native resolution)
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangular bounds for hotspot collision detection
 */
export interface RectBounds {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Polygon bounds for hotspot collision detection
 */
export interface PolygonBounds {
  type: 'polygon';
  points: Point[];
}

/**
 * Hotspot bounds can be either rectangular or polygonal
 */
export type HotspotBounds = RectBounds | PolygonBounds;

/**
 * Response to a verb action on a hotspot.
 * - string: Display text message
 * - HotspotCallback: Execute a named callback with optional data
 */
export interface HotspotCallback {
  action: string; // Named callback (e.g., 'giveItem', 'setFlag', 'startDialogue')
  data?: Record<string, unknown>;
}

export type HotspotResponse = string | HotspotCallback;

/**
 * Verb-specific responses for a hotspot
 */
export interface HotspotResponses {
  look?: HotspotResponse;
  use?: HotspotResponse;
  take?: HotspotResponse;
  talk?: HotspotResponse;
  walk?: HotspotResponse;
}

/**
 * Interactive hotspot within a room
 */
export interface HotspotData {
  id: string;
  name: string; // Display name for sentence line
  bounds: HotspotBounds;
  responses: HotspotResponses;
  /** Optional condition flag — hotspot only visible/active when this flag is true */
  condition?: string;
}

/**
 * Exit connecting this room to another
 */
export interface ExitData {
  id: string;
  /** Target room to transition to */
  targetRoomId: string;
  /** Where the player spawns in the target room */
  spawnPosition: Point;
  /** Hotspot bounds that trigger the exit (typically at room edges) */
  bounds: HotspotBounds;
  /** Display name for sentence line (e.g., "Colony Gathering") */
  name: string;
  /** Optional condition flag — exit only available when this flag is true */
  condition?: string;
}

/**
 * NPC placement within a room
 */
export interface CharacterPlacement {
  id: string; // Character definition ID
  position: Point;
  facing: 'left' | 'right';
  /** Optional condition flag — NPC only present when this flag is true */
  condition?: string;
}

/**
 * Complete room definition
 */
export interface RoomData {
  id: string;
  name: string;
  /** Background image asset key */
  background: string;
  /** Polygon defining the area the player can walk in */
  walkableArea: Point[];
  /** Interactive objects in the room */
  hotspots: HotspotData[];
  /** Exits to other rooms */
  exits: ExitData[];
  /** NPCs placed in this room */
  characters: CharacterPlacement[];
  /** Ambient sound asset key (optional) */
  ambientSound?: string;
}
