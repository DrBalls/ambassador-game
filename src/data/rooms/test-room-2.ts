import { RoomData } from './types';

/**
 * Second test room for verifying room exits and transitions.
 *
 * Connects back to test-room via a north exit, allowing
 * bidirectional navigation testing.
 */
export const TEST_ROOM_2: RoomData = {
  id: 'test-room-2',
  name: 'Second Test Room',
  background: 'bg-placeholder',
  walkableArea: [
    { x: 16, y: 40 },
    { x: 304, y: 40 },
    { x: 304, y: 116 },
    { x: 16, y: 116 },
  ],
  hotspots: [
    {
      id: 'crate',
      name: 'Wooden Crate',
      bounds: {
        type: 'rect',
        x: 200,
        y: 60,
        width: 40,
        height: 32,
      },
      responses: {
        look: 'A weathered crate. The markings have faded beyond recognition.',
        use: 'You push the crate but it barely budges.',
        take: "It's far too heavy to carry.",
      },
    },
  ],
  exits: [
    {
      id: 'exit-north',
      targetRoomId: 'test-room',
      spawnPosition: { x: 160, y: 100 },
      bounds: {
        type: 'rect',
        x: 120,
        y: 0,
        width: 80,
        height: 8,
      },
      name: 'Test Room',
    },
  ],
  characters: [],
};
