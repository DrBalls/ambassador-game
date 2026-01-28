import { RoomData } from './types';

/**
 * Shore Duty Station — Pip's assigned work area near the colony's shore.
 *
 * A rocky ice shelf overlooking the ocean, where Pip tinkers with salvaged
 * items and tends to the colony's pulley system. Features a broken pulley,
 * piles of kelp, scattered shells, and ice crystals.
 *
 * Inventory items obtainable here:
 * - Ice Lens (from ice crystals)
 * - Abalone Shells (from shell pile)
 * - Fishing Weight (from work area)
 *
 * Puzzle: Combine weight + rope to fix the pulley system.
 *
 * Connects west to Colony Gathering (colony-gathering).
 */
export const SHORE_DUTY: RoomData = {
  id: 'shore-duty',
  name: 'Shore Duty Station',
  background: 'bg-shore-duty',
  walkableArea: [
    { x: 16, y: 75 },
    { x: 304, y: 75 },
    { x: 304, y: 116 },
    { x: 16, y: 116 },
  ],
  hotspots: [
    {
      id: 'shore-pulley',
      name: 'Pulley System',
      bounds: {
        type: 'rect',
        x: 180,
        y: 60,
        width: 40,
        height: 55,
      },
      responses: {
        look: "A wooden pulley frame built over the ice edge — used to haul up fishing nets from the water below. The rope has snapped, leaving the bucket dangling uselessly. The pulley wheel still turns, but without a weighted rope, it's no good.",
        use: {
          action: 'usePulley',
          data: {},
        },
        take: "The pulley is bolted to the ice. You'd need to dismantle the whole frame.",
        talk: "You mutter encouraging words to the broken pulley. 'Don't worry, I'll fix you.'",
      },
    },
    {
      id: 'shore-shell-pile',
      name: 'Shell Pile',
      bounds: {
        type: 'rect',
        x: 245,
        y: 85,
        width: 55,
        height: 30,
      },
      responses: {
        look: "A pile of shells washed up from the deep water — mostly broken fragments, but a few abalone shells gleam with iridescent color. Their insides are so smooth and reflective, you can almost see your face.",
        use: "You sort through the shells, arranging them by size. Old habits.",
        take: {
          action: 'giveItem',
          data: { itemId: 'abalone-shell' },
        },
        talk: "You hold a shell to your ear. You hear... the ocean. Which is right there. Not very enlightening.",
      },
    },
    {
      id: 'shore-ice-crystals',
      name: 'Ice Crystals',
      bounds: {
        type: 'rect',
        x: 115,
        y: 75,
        width: 45,
        height: 30,
      },
      responses: {
        look: "A cluster of ice crystals has formed here, catching the light beautifully. One crystal is particularly clear — almost like glass. It's naturally curved into a lens shape. Pool would have called it 'ice that remembers light.'",
        use: "You hold a crystal up to your eye. The world bends and shifts through it — everything appears magnified.",
        take: {
          action: 'giveItem',
          data: { itemId: 'ice-lens' },
        },
        talk: "You whisper Pool's old saying to the crystals: 'Ice remembers everything, little Pip.' You miss her.",
      },
    },
    {
      id: 'shore-kelp',
      name: 'Kelp Pile',
      bounds: {
        type: 'rect',
        x: 25,
        y: 80,
        width: 60,
        height: 35,
      },
      responses: {
        look: "Thick strands of kelp drying on the ice — you collected them yourself during shore patrol. Some strands are braided into rope, a trick Pool taught you. The braided kelp is surprisingly strong.",
        use: "You test the braided kelp rope by tugging on it. Strong and flexible — perfect for rigging.",
        take: {
          action: 'giveItem',
          data: { itemId: 'rope' },
        },
        talk: "You talk to the kelp as you braid it. 'Over, under, through... just like Pool showed me.'",
      },
    },
    {
      id: 'shore-work-area',
      name: 'Work Area',
      bounds: {
        type: 'rect',
        x: 85,
        y: 100,
        width: 85,
        height: 16,
      },
      responses: {
        look: "Your personal work area — a flat section of ice where you tinker with salvaged objects. Scattered around are bits of fishing line, bone tools, and a heavy stone weight from an old net. This is where you feel most at home, building and fixing things while the others dive.",
        use: "You sit at your work area and fiddle with some bone tools. It feels good to work with your flippers.",
        take: {
          action: 'giveItem',
          data: { itemId: 'weight' },
        },
        talk: "You hum to yourself while examining the scattered bits and pieces. 'Everything has a purpose, if you look closely enough.'",
      },
    },
  ],
  exits: [
    {
      id: 'exit-west-to-colony',
      targetRoomId: 'colony-gathering',
      spawnPosition: { x: 280, y: 100 },
      bounds: {
        type: 'rect',
        x: 0,
        y: 75,
        width: 12,
        height: 41,
      },
      name: 'Colony Gathering',
    },
  ],
  characters: [],
  ambientSound: 'amb-shore',
};
