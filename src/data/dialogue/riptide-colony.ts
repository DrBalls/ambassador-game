import { DialogueTree } from './types';

/**
 * Riptide's colony dialogue — the colony bully who mocks Pip
 * as "Puddle." He's aggressive, dismissive, and resentful
 * of Pip's intelligence and curiosity.
 */
export const riptideColony: DialogueTree = {
  id: 'riptide-colony',
  startNodeId: 'greet',
  nodes: {
    greet: {
      id: 'greet',
      speaker: 'Riptide',
      text: "Well, well. If it isn't little Puddle. Finished counting your precious stars yet?",
      responses: [
        {
          text: "My name is Pip, not Puddle.",
          nextNodeId: 'name-correction',
        },
        {
          text: "What do you want, Riptide?",
          nextNodeId: 'what-want',
        },
        {
          text: "I heard you found something on the ice shelf.",
          nextNodeId: 'found-something',
        },
        {
          text: "I'm not in the mood for this.",
          nextNodeId: 'walk-away',
        },
      ],
    },

    'name-correction': {
      id: 'name-correction',
      speaker: 'Riptide',
      text: "Pip, Puddle, what's the difference? You're the smallest penguin in the colony either way. Can barely see you over the ice shelf!",
      next: 'riptide-laughs',
    },

    'riptide-laughs': {
      id: 'riptide-laughs',
      speaker: 'Riptide',
      text: "Ha! Don't look so upset. I'm just having fun. Not like you'd know what fun is — too busy staring at the sky.",
    },

    'what-want': {
      id: 'what-want',
      speaker: 'Riptide',
      text: "Just making sure you know your place. This gathering is for real penguins — hunters, fighters, divers. Not... whatever you are.",
      next: 'riptide-boast',
    },

    'riptide-boast': {
      id: 'riptide-boast',
      speaker: 'Riptide',
      text: "I dove forty meters today. Forty! Bet you can't even make it past ten without squeaking for help.",
      responses: [
        {
          text: "Diving deep doesn't make you smart.",
          nextNodeId: 'pip-retort',
        },
        {
          text: "That's... actually impressive.",
          nextNodeId: 'compliment',
        },
      ],
    },

    'pip-retort': {
      id: 'pip-retort',
      speaker: 'Pip',
      text: "Anyone can hold their breath. Try counting twenty-one stars without losing track. That takes a different kind of skill.",
      next: 'riptide-annoyed',
    },

    'riptide-annoyed': {
      id: 'riptide-annoyed',
      speaker: 'Riptide',
      text: "Counting. Stars. What a waste. When the leopard seals come, your star-counting won't save you, Puddle.",
      action: {
        type: 'setFlag',
        target: 'argued_with_riptide',
      },
    },

    compliment: {
      id: 'compliment',
      speaker: 'Riptide',
      text: "Of course it is. Deepest dive in the colony this season. Even Frost was impressed. Unlike your little... hobby.",
    },

    'found-something': {
      id: 'found-something',
      speaker: 'Riptide',
      text: "Oh, you heard about that? Yeah, I found it. Strange circles melted right into the ice. Frost told everyone to stay away, but I went in for a closer look.",
      next: 'riptide-bravado',
    },

    'riptide-bravado': {
      id: 'riptide-bravado',
      speaker: 'Riptide',
      text: "The marks glowed. Actually glowed, like moonlight trapped in ice. But I wasn't scared. Not like the others.",
      responses: [
        {
          text: "Did the marks form any kind of pattern?",
          nextNodeId: 'marks-pattern',
        },
        {
          text: "You should have listened to Frost.",
          nextNodeId: 'should-listen',
        },
      ],
    },

    'marks-pattern': {
      id: 'marks-pattern',
      speaker: 'Riptide',
      text: "Pattern? I don't know... circles inside circles, with lines between them. Why, you think your counting brain can figure it out?",
      next: 'riptide-dare',
    },

    'riptide-dare': {
      id: 'riptide-dare',
      speaker: 'Riptide',
      text: "Tell you what, Puddle. If you're so clever, why don't YOU go take a look? Oh wait — Frost said it's forbidden. Guess you'll just have to wonder.",
      action: {
        type: 'setFlag',
        target: 'riptide_dared_pip',
      },
    },

    'should-listen': {
      id: 'should-listen',
      speaker: 'Riptide',
      text: "Listen to Frost? I'm the one who found the markings! If anyone should be investigating, it's me. Not some jumped-up pencil-pusher giving orders.",
      action: {
        type: 'setFlag',
        target: 'riptide_defies_frost',
      },
    },

    'walk-away': {
      id: 'walk-away',
      speaker: 'Riptide',
      text: "Running away? Typical Puddle. Go count something — maybe count how many penguins are braver than you. Spoiler: it's all of them.",
    },
  },
};
