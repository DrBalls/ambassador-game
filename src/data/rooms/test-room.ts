import { RoomData } from './types';

/**
 * Test room for development and verification.
 *
 * A simple room with a few hotspots, one exit, and walkable area
 * covering most of the viewport (320x120).
 */
export const TEST_ROOM: RoomData = {
  id: 'test-room',
  name: 'Test Room',
  background: 'bg-placeholder',
  walkableArea: [
    { x: 16, y: 40 },
    { x: 304, y: 40 },
    { x: 304, y: 116 },
    { x: 16, y: 116 },
  ],
  hotspots: [
    {
      id: 'test-object',
      name: 'Strange Object',
      bounds: {
        type: 'rect',
        x: 60,
        y: 40,
        width: 48,
        height: 32,
      },
      responses: {
        look: 'A strange glowing object sits on the ice. It pulses with a faint blue light.',
        use: 'You poke at the object. It hums softly but nothing happens.',
        take: "It's firmly embedded in the ice. You can't move it.",
        talk: "You speak to the object. It doesn't respond. Obviously.",
      },
    },
    {
      id: 'ice-wall',
      name: 'Ice Wall',
      bounds: {
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 320, y: 0 },
          { x: 320, y: 36 },
          { x: 0, y: 36 },
        ],
      },
      responses: {
        look: 'A towering wall of ancient ice. Scratches and marks cover its surface.',
        use: "You press your flippers against the ice. It's cold. Very cold.",
        take: "You can't take an entire wall of ice.",
      },
    },
  ],
  exits: [
    {
      id: 'exit-south',
      targetRoomId: 'test-room-2',
      spawnPosition: { x: 160, y: 48 },
      bounds: {
        type: 'rect',
        x: 120,
        y: 112,
        width: 80,
        height: 8,
      },
      name: 'Second Test Room',
    },
  ],
  characters: [
    {
      id: 'bubble',
      position: { x: 240, y: 80 },
      facing: 'left',
    },
  ],
  ambientSound: 'amb-wind',
};
