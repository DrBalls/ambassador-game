import { DialogueTree } from './types';

/**
 * Commander Frost's colony dialogue — the stern colony leader
 * addresses Pip at the gathering. He's gruff but fair, and
 * concerned about strange reports from the shore patrols.
 */
export const frostColony: DialogueTree = {
  id: 'frost-colony',
  startNodeId: 'greet',
  nodes: {
    greet: {
      id: 'greet',
      speaker: 'Commander Frost',
      text: "Ah, the little counter. You're late, as usual. The gathering is about to begin.",
      responses: [
        {
          text: "Sorry, Commander. I was observing the stars.",
          nextNodeId: 'stars-excuse',
        },
        {
          text: "What's this gathering about?",
          nextNodeId: 'gathering-topic',
        },
        {
          text: "I noticed something strange in the sky...",
          nextNodeId: 'strange-sky',
          condition: 'noticed_new_star',
        },
        {
          text: "I'll take my place, Commander.",
          nextNodeId: 'take-place',
        },
      ],
    },

    'stars-excuse': {
      id: 'stars-excuse',
      speaker: 'Commander Frost',
      text: "Stars. Always stars with you. Your grandfather was the same way. Pool spent more time looking up than looking where she was going.",
      next: 'frost-soften',
    },

    'frost-soften': {
      id: 'frost-soften',
      speaker: 'Commander Frost',
      text: "...But she had a good eye. The best. I suppose you take after her in that regard. Now pay attention — this meeting matters.",
      action: {
        type: 'setFlag',
        target: 'frost_mentioned_pool',
      },
    },

    'gathering-topic': {
      id: 'gathering-topic',
      speaker: 'Commander Frost',
      text: "Shore patrols found something... unusual near the southern ice shelf. Strange markings burned into the ice. Nothing natural could have made them.",
      next: 'gathering-detail',
    },

    'gathering-detail': {
      id: 'gathering-detail',
      speaker: 'Commander Frost',
      text: "I've declared the area off-limits until we understand what we're dealing with. The last thing this colony needs is curious penguins wandering into danger.",
      responses: [
        {
          text: "Burned into the ice? What kind of markings?",
          nextNodeId: 'markings-question',
        },
        {
          text: "I understand, Commander.",
          nextNodeId: 'take-place',
        },
      ],
    },

    'markings-question': {
      id: 'markings-question',
      speaker: 'Commander Frost',
      text: "Circles and lines, arranged in some kind of pattern. Riptide says they glow at night. I think he's exaggerating, but... something made those marks. And whatever it was, it wasn't a penguin.",
      action: {
        type: 'setFlag',
        target: 'frost_told_about_markings',
      },
      next: 'frost-warning',
    },

    'frost-warning': {
      id: 'frost-warning',
      speaker: 'Commander Frost',
      text: "I see that look in your eyes, little counter. Don't even think about investigating on your own. That's an order.",
    },

    'strange-sky': {
      id: 'strange-sky',
      speaker: 'Commander Frost',
      text: "Strange? Define strange.",
      next: 'pip-explains-star',
    },

    'pip-explains-star': {
      id: 'pip-explains-star',
      speaker: 'Pip',
      text: "There's a new star, Commander. Well, not a star exactly. Something green, getting brighter each night. I've been tracking it for weeks.",
      next: 'frost-considers',
    },

    'frost-considers': {
      id: 'frost-considers',
      speaker: 'Commander Frost',
      text: "Green, you say? Hmm. First the markings on the ice, now lights in the sky. I don't like coincidences.",
      action: {
        type: 'setFlag',
        target: 'frost_knows_about_star',
      },
      next: 'frost-reluctant-interest',
    },

    'frost-reluctant-interest': {
      id: 'frost-reluctant-interest',
      speaker: 'Commander Frost',
      text: "Keep watching that light, Pip. And report anything unusual to me directly. Not to the whole colony — we don't need a panic. Understood?",
      action: {
        type: 'setFlag',
        target: 'frost_assigned_pip',
      },
    },

    'take-place': {
      id: 'take-place',
      speaker: 'Commander Frost',
      text: "Good. Stand near the front — and try not to fidget this time.",
    },
  },
};
