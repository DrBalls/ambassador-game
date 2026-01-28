import { RoomData } from './types';
import { TEST_ROOM } from './test-room';
import { TEST_ROOM_2 } from './test-room-2';
import { COUNTING_SPOT } from './counting-spot';
import { COLONY_GATHERING } from './colony-gathering';
import { SHORE_DUTY } from './shore-duty';

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
  [TEST_ROOM_2.id]: TEST_ROOM_2,
  [COUNTING_SPOT.id]: COUNTING_SPOT,
  [COLONY_GATHERING.id]: COLONY_GATHERING,
  [SHORE_DUTY.id]: SHORE_DUTY,
};

/**
 * Look up a room definition by ID
 */
export function getRoom(roomId: string): RoomData | null {
  return ROOMS[roomId] ?? null;
}
