import { DialogueTree } from './types';

/**
 * Bubble's greeting dialogue — a branching conversation with Pip's
 * cheerful friend. Demonstrates linear flow, branching choices,
 * conditional responses, and dialogue actions.
 */
export const bubbleGreeting: DialogueTree = {
  id: 'bubble-greeting',
  startNodeId: 'greet',
  nodes: {
    greet: {
      id: 'greet',
      speaker: 'Bubble',
      text: "Pip! There you are! I've been looking everywhere for you. The colony meeting is about to start!",
      responses: [
        {
          text: "What's the meeting about?",
          nextNodeId: 'meeting-info',
        },
        {
          text: "I was just counting the stars again.",
          nextNodeId: 'stars-response',
        },
        {
          text: "I found something strange at my counting spot.",
          nextNodeId: 'strange-thing',
          condition: 'found_probe_marks',
        },
        {
          text: "I need to go. See you later!",
          nextNodeId: 'goodbye',
        },
      ],
    },

    'meeting-info': {
      id: 'meeting-info',
      speaker: 'Bubble',
      text: "Commander Frost called everyone together. Something about the shore patrols finding unusual markings in the ice.",
      next: 'meeting-follow-up',
    },

    'meeting-follow-up': {
      id: 'meeting-follow-up',
      speaker: 'Pip',
      text: "Unusual markings? That sounds... familiar.",
      responses: [
        {
          text: "Tell me more about the markings.",
          nextNodeId: 'markings-detail',
        },
        {
          text: "We should head to the meeting.",
          nextNodeId: 'go-to-meeting',
        },
      ],
    },

    'markings-detail': {
      id: 'markings-detail',
      speaker: 'Bubble',
      text: "Riptide found them near the forbidden zone. Circles and lines that glow faintly at night. Nobody knows what made them.",
      next: 'markings-reaction',
    },

    'markings-reaction': {
      id: 'markings-reaction',
      speaker: 'Pip',
      text: "Glowing marks... just like the ones Pool used to draw when she was teaching me to count.",
      action: {
        type: 'setFlag',
        target: 'knows_about_markings',
      },
      next: 'go-to-meeting',
    },

    'go-to-meeting': {
      id: 'go-to-meeting',
      speaker: 'Bubble',
      text: "Come on, let's hurry! Oh, here — take this lucky shell. You'll need it at the meeting!",
      action: {
        type: 'giveItem',
        target: 'lucky-shell',
      },
    },

    'stars-response': {
      id: 'stars-response',
      speaker: 'Bubble',
      text: "You and your counting! How many this time?",
      next: 'stars-count',
    },

    'stars-count': {
      id: 'stars-count',
      speaker: 'Pip',
      text: "Twenty-one in the usual pattern. But one of them was the wrong colour. A new star, maybe?",
      next: 'stars-reaction',
    },

    'stars-reaction': {
      id: 'stars-reaction',
      speaker: 'Bubble',
      text: "A new star? That's exciting! Or maybe your eyes are just tired from squinting at the sky all night.",
      responses: [
        {
          text: "My eyes are fine! Something is different up there.",
          nextNodeId: 'pip-insists',
        },
        {
          text: "Maybe you're right. Let's go to the meeting.",
          nextNodeId: 'go-to-meeting',
        },
      ],
    },

    'pip-insists': {
      id: 'pip-insists',
      speaker: 'Pip',
      text: "Pool always said numbers don't lie. If there were twenty-one before and now there's something extra, it matters.",
      action: {
        type: 'setFlag',
        target: 'noticed_new_star',
      },
      next: 'bubble-believes',
    },

    'bubble-believes': {
      id: 'bubble-believes',
      speaker: 'Bubble',
      text: "Well, if anyone would notice, it's you. Pool taught you well. We can look together after the meeting, okay?",
    },

    'strange-thing': {
      id: 'strange-thing',
      speaker: 'Bubble',
      text: "Strange how? You're always finding odd things up there. Remember the perfectly round ice sphere?",
      next: 'strange-detail',
    },

    'strange-detail': {
      id: 'strange-detail',
      speaker: 'Pip',
      text: "This is different. There are marks scratched into the ice wall. They look like... patterns. Like the ones Pool drew.",
      action: {
        type: 'setFlag',
        target: 'told_bubble_about_marks',
      },
      next: 'strange-reaction',
    },

    'strange-reaction': {
      id: 'strange-reaction',
      speaker: 'Bubble',
      text: "Pool's patterns? Pip, are you sure? She's been gone for so long... Let's talk about it after the meeting. Promise me you won't go investigating alone!",
    },

    goodbye: {
      id: 'goodbye',
      speaker: 'Bubble',
      text: "Okay, but don't wander off too far! The meeting starts soon!",
    },
  },
};
