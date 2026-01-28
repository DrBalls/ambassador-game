import { RoomData } from './types';
import { TEST_ROOM } from './test-room';

export type { RoomData } from './types';
export type {
  Point,
  RectBounds,
  PolygonBounds,
  HotspotBounds,
  HotspotCallback,
  HotspotResponse,
  HotspotResponses,
  HotspotData,
  ExitData,
  CharacterPlacement,
} from './types';

/**
 * Room registry — all rooms indexed by ID.
 * New rooms are added here as they are created.
 */
export const ROOMS: Record<string, RoomData> = {
  [TEST_ROOM.id]: TEST_ROOM,
};

/**
 * Look up a room definition by ID
 */
export function getRoom(roomId: string): RoomData | null {
  return ROOMS[roomId] ?? null;
}
