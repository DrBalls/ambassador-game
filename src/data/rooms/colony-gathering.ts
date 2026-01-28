import { RoomData } from './types';

/**
 * Colony Gathering — the main colony area where penguins gather.
 *
 * A wide ice plain with penguins arranged in their traditional spiral formation.
 * Features Commander Frost overseeing the colony, Riptide posturing near the
 * ice shelf, and Bubble waiting near the gathering area. A depth call board
 * stands on the right side, and various ice features dot the landscape.
 *
 * Connects:
 *   North → Counting Spot (counting-spot)
 *   East  → Shore Duty (shore-duty)
 *   West  → Pool's Marker (pools-marker)
 */
export const COLONY_GATHERING: RoomData = {
  id: 'colony-gathering',
  name: 'Colony Gathering',
  background: 'bg-colony-gathering',
  walkableArea: [
    { x: 16, y: 70 },
    { x: 304, y: 70 },
    { x: 304, y: 116 },
    { x: 16, y: 116 },
  ],
  hotspots: [
    {
      id: 'colony-gathering-area',
      name: 'Gathering Area',
      bounds: {
        type: 'rect',
        x: 100,
        y: 70,
        width: 120,
        height: 30,
      },
      responses: {
        look: "The colony's traditional gathering circle — a wide, worn patch of ice where generations of penguins have assembled. The spiral formation is ancient, passed down from the First Colony. Even the youngest chicks know where to stand.",
        use: "You shuffle into your usual spot at the edge of the spiral. As the smallest penguin, you're always at the outer ring.",
        take: "You can't take a gathering area. It's more of a concept than a thing.",
        talk: "You clear your throat, but nobody notices. Being small has its disadvantages.",
      },
    },
    {
      id: 'colony-depth-call-board',
      name: 'Depth Call Board',
      bounds: {
        type: 'rect',
        x: 220,
        y: 55,
        width: 40,
        height: 30,
      },
      responses: {
        look: "A weathered wooden board listing today's dive assignments and depths. Riptide's name is near the top — 40 meters. Your name... isn't on the board at all. Shore duty, as always.",
        use: "You trace the listings with your flipper. The deepest dive today was 40 meters. You've never been deeper than 12.",
        take: "The board is frozen solid to its post. It's not going anywhere.",
        talk: "You read the board aloud to yourself: 'Riptide — 40m, Kelp — 35m, Drift — 32m...' Your name is conspicuously absent.",
      },
    },
    {
      id: 'colony-ice-shelves',
      name: 'Ice Shelves',
      bounds: {
        type: 'rect',
        x: 0,
        y: 55,
        width: 60,
        height: 20,
      },
      responses: {
        look: "Raised ice shelves line the colony's western edge, sculpted by wind and time into smooth platforms. The older penguins like to rest on them between dives. Pool used to sit up there, watching the colony with that knowing look of hers.",
        use: "You try to hop up onto the ice shelf, but it's a bit too high for your short legs. Embarrassing.",
        take: "The ice shelves are part of the landscape. You'd need a volcano to take them.",
        talk: "You whisper to the ice shelf: 'Pool, I wish you were still here.' The ice doesn't answer, but the wind seems to sigh.",
      },
    },
  ],
  exits: [
    {
      id: 'exit-north-to-counting-spot',
      targetRoomId: 'counting-spot',
      spawnPosition: { x: 160, y: 108 },
      bounds: {
        type: 'rect',
        x: 120,
        y: 55,
        width: 80,
        height: 8,
      },
      name: "Pip's Counting Spot",
    },
    {
      id: 'exit-east-to-shore-duty',
      targetRoomId: 'shore-duty',
      spawnPosition: { x: 30, y: 100 },
      bounds: {
        type: 'rect',
        x: 308,
        y: 70,
        width: 12,
        height: 46,
      },
      name: 'Shore Duty Station',
    },
    {
      id: 'exit-west-to-pools-marker',
      targetRoomId: 'pools-marker',
      spawnPosition: { x: 290, y: 100 },
      bounds: {
        type: 'rect',
        x: 0,
        y: 70,
        width: 12,
        height: 46,
      },
      name: "Pool's Marker",
    },
    {
      id: 'exit-south-to-forbidden-zone',
      targetRoomId: 'forbidden-zone',
      spawnPosition: { x: 160, y: 90 },
      bounds: {
        type: 'rect',
        x: 120,
        y: 112,
        width: 80,
        height: 8,
      },
      name: 'Forbidden Zone',
    },
  ],
  characters: [
    {
      id: 'frost',
      position: { x: 160, y: 85 },
      facing: 'right',
    },
    {
      id: 'riptide',
      position: { x: 270, y: 90 },
      facing: 'left',
    },
    {
      id: 'bubble',
      position: { x: 80, y: 95 },
      facing: 'right',
    },
  ],
  ambientSound: 'amb-colony',
};
