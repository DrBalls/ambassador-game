import { RoomData } from './types';

/**
 * Forbidden Zone — the alien probe crash site.
 *
 * A dangerous area of twisted, melted ice where the alien probe landed.
 * Features a central impact crater with the metallic probe, wisps of steam,
 * and warped ice pillars. This is where Act 1's climax takes place.
 *
 * Key progression:
 * 1. LOOK at probe describes base-7 light patterns
 * 2. USE ice crystals on probe → triggers pattern puzzle
 * 3. Success → probe opens, Europa vision cutscene
 * 4. Riptide arrives, probe goes defensive
 * 5. Frost arrives with colony, dramatic dialogue
 * 6. Pip touches probe, receives countdown message
 * 7. End of Act 1 flag set
 *
 * Connects south to Colony Gathering (colony-gathering).
 */
export const FORBIDDEN_ZONE: RoomData = {
  id: 'forbidden-zone',
  name: 'Forbidden Zone',
  background: 'bg-forbidden-zone',
  walkableArea: [
    { x: 16, y: 80 },
    { x: 304, y: 80 },
    { x: 304, y: 116 },
    { x: 16, y: 116 },
  ],
  hotspots: [
    {
      id: 'fz-probe',
      name: 'The Probe',
      bounds: {
        type: 'rect',
        x: 130,
        y: 65,
        width: 60,
        height: 30,
      },
      responses: {
        look: "A smooth metallic object half-buried in the melted ice. Its surface shimmers with faint patterns of light — seven distinct colors cycling in a rhythm you almost recognize. The patterns match Pool's marks... base-7 counting. It's not from Earth.",
        use: {
          action: 'useProbe',
          data: {},
        },
        take: "You can't lift the probe — it's far too heavy and partially fused into the ice. Besides, it feels... alive somehow.",
        talk: "You lean close and whisper to the probe. For a moment, the light patterns seem to pulse faster, as if responding. Then they settle back to their slow rhythm.",
      },
    },
    {
      id: 'fz-twisted-ice',
      name: 'Twisted Ice',
      bounds: {
        type: 'rect',
        x: 10,
        y: 35,
        width: 80,
        height: 50,
      },
      responses: {
        look: "The ice here has been warped and twisted by incredible heat, then refrozen into impossible shapes. Jagged pillars spiral upward like frozen flames. Whatever crashed here generated tremendous energy.",
        use: "You touch the twisted ice. It's strangely warm, even now. Heat from the impact still lingering in the frozen structure.",
        take: "The twisted ice is fused to the ground. You couldn't break it free even with tools.",
        talk: "The ice groans softly, settling. It sounds almost like a voice.",
      },
    },
    {
      id: 'fz-melted-crater',
      name: 'Melted Crater',
      bounds: {
        type: 'rect',
        x: 110,
        y: 95,
        width: 100,
        height: 20,
      },
      responses: {
        look: "A perfectly circular area where the ice has been melted and re-solidified into dark, glassy rock. The crater radiates outward in concentric rings — each ring exactly seven times wider than the last. Even the destruction follows base-7.",
        use: "You kneel and touch the crater floor. It's warm and smooth, like glass. Your flipper leaves no mark on it.",
        take: "The melted floor is fused solid. Nothing to take here.",
        talk: "You speak into the crater. Your voice echoes oddly, as if the sound bounces seven times before fading.",
      },
    },
    {
      id: 'fz-steam-wisps',
      name: 'Steam',
      bounds: {
        type: 'rect',
        x: 120,
        y: 55,
        width: 80,
        height: 20,
      },
      responses: {
        look: "Wisps of steam rise from cracks in the melted ice, carrying a faint smell of ozone and something else — something that doesn't belong to Antarctica. The steam moves in spiraling patterns, always in groups of seven.",
        use: "You wave your flipper through the steam. It curls around you briefly, warm and strange, before dissipating.",
        take: "You can't take steam. It slips through your flippers like... well, like steam.",
        talk: "You blow into the steam and watch it swirl. For a moment it forms a shape — seven points, like a star.",
      },
    },
  ],
  exits: [
    {
      id: 'exit-south-to-colony',
      targetRoomId: 'colony-gathering',
      spawnPosition: { x: 160, y: 80 },
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
  ambientSound: 'amb-forbidden',
};
