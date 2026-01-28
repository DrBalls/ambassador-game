import { DialogueTree } from './types';

/**
 * Europa Vision dialogue — triggered when Pip solves the pattern puzzle
 * and the probe opens, showing a vision of Europa.
 *
 * This is a linear cutscene-style dialogue with no player choices.
 * Sets 'probe_vision_seen' flag.
 */
export const forbiddenZoneVision: DialogueTree = {
  id: 'forbidden-zone-vision',
  startNodeId: 'vision-start',
  nodes: {
    'vision-start': {
      id: 'vision-start',
      speaker: 'Pip',
      text: "The probe's surface splits open with a soft hiss. Light pours out — not sunlight, not starlight, but something entirely new. Seven colors you've never seen before, swirling together...",
      next: 'vision-europa-1',
    },
    'vision-europa-1': {
      id: 'vision-europa-1',
      speaker: 'Pip',
      text: "A vision fills your mind: an ocean beneath a shell of ice. Not Antarctica — somewhere vast and dark and impossibly deep. Europa. Jupiter's moon. An ocean larger than anything on Earth.",
      next: 'vision-europa-2',
    },
    'vision-europa-2': {
      id: 'vision-europa-2',
      speaker: 'Pip',
      text: "In the vision, you see them — creatures of light moving through the dark water. They're not like anything you know. They communicate in pulses of seven colors, seven tones. Base-7. Everything in sevens.",
      next: 'vision-europa-3',
    },
    'vision-europa-3': {
      id: 'vision-europa-3',
      speaker: 'Pip',
      text: "The creatures are afraid. Their ocean is changing. The ice above them is cracking, their world flooding with radiation. They sent this probe as a message — a call for help. To anyone who could count to seven.",
      next: 'vision-europa-4',
    },
    'vision-europa-4': {
      id: 'vision-europa-4',
      speaker: 'Pip',
      text: "Pool understood. Your grandfather Pool understood their counting. He tried to tell the colony, but no one would listen. They called him crazy. And now... now you understand too.",
      next: 'vision-end',
      action: { type: 'setFlag', target: 'probe_vision_seen' },
    },
    'vision-end': {
      id: 'vision-end',
      speaker: 'Pip',
      text: "The vision fades. You're back on the ice, shaking, the probe still glowing before you. You understand now what Pool tried to tell everyone. These beings need help. And they chose penguins — they chose you.",
    },
  },
};

/**
 * Riptide arrival dialogue — Riptide bursts in after the vision,
 * sees the probe glowing, and reacts aggressively.
 * The probe goes defensive in response.
 */
export const forbiddenZoneRiptide: DialogueTree = {
  id: 'forbidden-zone-riptide',
  startNodeId: 'riptide-arrives',
  nodes: {
    'riptide-arrives': {
      id: 'riptide-arrives',
      speaker: 'Riptide',
      text: "PUDDLE! What are you doing in the Forbidden Zone?! I followed you here — I knew you were up to something!",
      next: 'riptide-sees-probe',
    },
    'riptide-sees-probe': {
      id: 'riptide-sees-probe',
      speaker: 'Riptide',
      text: "What in the deep is THAT?! That... that thing is GLOWING! You did something to it, didn't you?! You always were a freak, Puddle!",
      next: 'pip-responds',
    },
    'pip-responds': {
      id: 'pip-responds',
      speaker: 'Pip',
      text: "Riptide, listen! It's not dangerous — it's a message! From creatures living under the ice of Europa — Jupiter's moon! They need our help!",
      next: 'riptide-angry',
    },
    'riptide-angry': {
      id: 'riptide-angry',
      speaker: 'Riptide',
      text: "You've lost it. Completely lost it. Creatures on Jupiter? You sound just like your crazy grandfather Pool!",
      next: 'probe-defensive',
      action: { type: 'setFlag', target: 'riptide_at_probe' },
    },
    'probe-defensive': {
      id: 'probe-defensive',
      speaker: 'Pip',
      text: "The probe suddenly pulses with bright red light — a warning pattern. It detected Riptide's aggression. The seven colors shift to harsh, urgent rhythms. It's going defensive.",
      next: 'riptide-backs-off',
    },
    'riptide-backs-off': {
      id: 'riptide-backs-off',
      speaker: 'Riptide',
      text: "WHOA! Get that thing away from me! I'm getting Commander Frost. He'll know what to do with your alien nonsense!",
      next: 'riptide-leaves',
    },
    'riptide-leaves': {
      id: 'riptide-leaves',
      speaker: 'Pip',
      text: "Riptide waddles away at top speed, shouting for Commander Frost. The probe's warning colors slowly fade back to their gentle seven-color cycle. It recognized you. It trusts you.",
      action: { type: 'setFlag', target: 'riptide_fetched_frost' },
    },
  },
};

/**
 * Frost arrival dialogue — Commander Frost arrives with the colony.
 * Dramatic confrontation and Pip's moment of truth.
 * Pip touches the probe and receives the countdown message.
 * Sets 'act1_complete' flag.
 */
export const forbiddenZoneFrost: DialogueTree = {
  id: 'forbidden-zone-frost',
  startNodeId: 'frost-arrives',
  nodes: {
    'frost-arrives': {
      id: 'frost-arrives',
      speaker: 'Commander Frost',
      text: "PIP. Step away from that object. NOW.",
      next: 'frost-colony',
    },
    'frost-colony': {
      id: 'frost-colony',
      speaker: 'Pip',
      text: "Commander Frost arrives with half the colony behind him. Riptide is at his side, pointing and sputtering. Bubble pushes through the crowd, eyes wide with worry.",
      next: 'frost-demands',
    },
    'frost-demands': {
      id: 'frost-demands',
      speaker: 'Commander Frost',
      text: "This area is forbidden for a reason. Explain yourself. What have you done?",
      responses: [
        {
          text: "It's a probe from Europa. They need our help!",
          nextNodeId: 'pip-explains-truth',
        },
        {
          text: "Pool was right about everything. The marks, the sevens — it's all real.",
          nextNodeId: 'pip-explains-pool',
        },
      ],
    },
    'pip-explains-truth': {
      id: 'pip-explains-truth',
      speaker: 'Pip',
      text: "Creatures living under the ice of Jupiter's moon sent this probe! They communicate in base-7 — the same patterns Pool discovered! Their ocean is dying and they're asking for help!",
      next: 'frost-skeptical',
    },
    'pip-explains-pool': {
      id: 'pip-explains-pool',
      speaker: 'Pip',
      text: "Pool's marks on the ice wall — they were base-7 counting! The same system this probe uses! Pool understood what this was before anyone else. He wasn't crazy — he was right!",
      next: 'frost-skeptical',
    },
    'frost-skeptical': {
      id: 'frost-skeptical',
      speaker: 'Commander Frost',
      text: "Pool was a respected elder who lost his mind. And you... you're the smallest penguin in the colony, playing with things you don't understand.",
      next: 'bubble-defends',
    },
    'bubble-defends': {
      id: 'bubble-defends',
      speaker: 'Bubble',
      text: "Wait, Commander! Look at the probe — look at the light patterns! They really do come in groups of seven. Pip might be telling the truth!",
      next: 'frost-considers',
    },
    'frost-considers': {
      id: 'frost-considers',
      speaker: 'Commander Frost',
      text: "...The patterns are... organized. This is no natural phenomenon. Everyone stay back.",
      next: 'pip-choice',
    },
    'pip-choice': {
      id: 'pip-choice',
      speaker: 'Pip',
      text: "The probe's colors shift — it's been waiting for this. Waiting for someone to bridge the gap. You feel it calling to you. What do you do?",
      responses: [
        {
          text: "Touch the probe — answer its call.",
          nextNodeId: 'pip-touches-probe',
        },
        {
          text: "Step forward and place your flipper on the probe.",
          nextNodeId: 'pip-touches-probe',
        },
      ],
    },
    'pip-touches-probe': {
      id: 'pip-touches-probe',
      speaker: 'Pip',
      text: "You step forward. The colony gasps. Frost reaches out to stop you, but something holds him back — maybe the light, maybe instinct. You press your flipper against the warm metal surface...",
      next: 'countdown-message',
    },
    'countdown-message': {
      id: 'countdown-message',
      speaker: 'Pip',
      text: "A voice fills your mind — not words, but patterns. Seven colors pulsing in sequence. You understand: a countdown. Seven cycles of seven days. Forty-nine days until the Europan ice cracks forever. They need an ambassador. They need YOU.",
      next: 'colony-reaction',
      action: { type: 'setFlag', target: 'received_countdown' },
    },
    'colony-reaction': {
      id: 'colony-reaction',
      speaker: 'Commander Frost',
      text: "Pip... your eyes. They're glowing with the same seven colors. What happened? What did it show you?",
      next: 'pip-announces',
    },
    'pip-announces': {
      id: 'pip-announces',
      speaker: 'Pip',
      text: "Forty-nine days. We have forty-nine days to answer them. They chose our colony — they chose a penguin — because we understand ice, and cold, and survival. Commander... I have to go to them. I have to be their ambassador.",
      next: 'frost-final',
    },
    'frost-final': {
      id: 'frost-final',
      speaker: 'Commander Frost',
      text: "...The smallest penguin in the colony. Pool's grandchild. An ambassador to aliens from Jupiter's moon. The world has gone mad.",
      next: 'act1-end',
    },
    'act1-end': {
      id: 'act1-end',
      speaker: 'Pip',
      text: "The probe pulses one final time — a warm golden light that washes over the entire colony. For a moment, every penguin sees what you saw: Europa's ocean, the creatures of light, the cracking ice. Then silence. The countdown has begun.",
      action: { type: 'setFlag', target: 'act1_complete' },
    },
  },
};
