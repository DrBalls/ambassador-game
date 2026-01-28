import { RoomData } from './types';

/**
 * Pip's Counting Spot — the starting room of the game.
 *
 * A private ledge at the edge of the colony where Pip goes to count stars
 * and study the sky. Features a dawn sky with stars (21 normal + 1 wrong color),
 * a telescope on a tripod, and mysterious marks on the ice wall left by Pool.
 *
 * Connects south to Colony Gathering (colony-gathering).
 */
export const COUNTING_SPOT: RoomData = {
  id: 'counting-spot',
  name: "Pip's Counting Spot",
  background: 'bg-counting-spot',
  walkableArea: [
    { x: 16, y: 96 },
    { x: 304, y: 96 },
    { x: 304, y: 116 },
    { x: 16, y: 116 },
  ],
  hotspots: [
    {
      id: 'counting-spot-stars',
      name: 'Stars',
      bounds: {
        type: 'rect',
        x: 0,
        y: 0,
        width: 240,
        height: 70,
      },
      responses: {
        look: "You count carefully... twenty-one stars in the usual pattern. But wait — there's a twenty-second one, and it's the wrong color. A faint green glow where there should be nothing. You've been watching it for weeks now. It's getting brighter.",
        use: "You can't reach the stars, no matter how much you stretch your flippers.",
        take: "Even for an ambitious penguin, taking a star is a bit much.",
        talk: "You whisper a count to the stars. They don't answer, but you feel better having checked.",
      },
    },
    {
      id: 'counting-spot-telescope',
      name: 'Telescope',
      bounds: {
        type: 'rect',
        x: 240,
        y: 78,
        width: 40,
        height: 38,
      },
      responses: {
        look: "A salvaged telescope, carefully balanced on a tripod made from fish bones and ice. It's your most prized possession — the thing that lets you see what others can't be bothered to notice.",
        use: "You peer through the telescope at the strange green star. Through the lens, it looks less like a star and more like... something moving. Something coming closer.",
        take: "You could dismantle it, but you'd rather leave it set up. You never know when something interesting will appear in the sky.",
        talk: "You don't talk to telescopes. You're a scientist, not eccentric. Well... maybe a little eccentric.",
      },
    },
    {
      id: 'counting-spot-ice-marks',
      name: 'Ice Wall Marks',
      bounds: {
        type: 'rect',
        x: 32,
        y: 86,
        width: 64,
        height: 24,
      },
      responses: {
        look: "Scratched into the ice wall are strange marks — not penguin scratches, something more deliberate. Your grandfather Pool left these before he disappeared. They look almost like... counting marks, but in groups of seven. You've never been able to figure out what they mean.",
        use: "You trace the marks with your flipper tip. Seven groups of seven. Forty-nine marks total. Pool was counting something, but what?",
        take: "The marks are carved into the ice wall itself. They're not going anywhere.",
        talk: "You mutter Pool's old saying: 'Seven is the number that matters, little Pip. Everything important comes in sevens.' You never understood what he meant.",
      },
    },
  ],
  exits: [
    {
      id: 'exit-south-to-colony',
      targetRoomId: 'colony-gathering',
      spawnPosition: { x: 160, y: 48 },
      bounds: {
        type: 'rect',
        x: 120,
        y: 112,
        width: 80,
        height: 8,
      },
      name: 'Colony Gathering',
    },
  ],
  characters: [],
  ambientSound: 'amb-wind',
};
