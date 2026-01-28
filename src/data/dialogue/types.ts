/**
 * Dialogue data types for The Smallest Ambassador
 *
 * Dialogue trees are branching conversations between the player and NPCs.
 * Each tree is a collection of nodes; each node displays text and optionally
 * presents the player with response choices that lead to other nodes.
 */

/**
 * Action that a dialogue node can trigger when displayed.
 * These modify game state (flags, inventory, quests) as a side-effect
 * of reaching the node.
 */
export interface DialogueAction {
  type: 'setFlag' | 'giveItem' | 'takeItem' | 'startQuest';
  /** Key for flags, item ID for give/take, quest ID for startQuest */
  target: string;
  /** Value for setFlag (defaults to true) */
  value?: boolean;
}

/**
 * A player response option within a dialogue node.
 * When a node has responses, the player picks one to continue.
 */
export interface DialogueResponse {
  /** Display text the player sees as a choice */
  text: string;
  /** ID of the next DialogueNode to jump to */
  nextNodeId: string;
  /** Optional flag condition — only show this response if the flag is truthy */
  condition?: string;
}

/**
 * A single node in a dialogue tree.
 *
 * Nodes are the atomic unit of dialogue. Each node shows a speaker's line
 * of text. After the text, the node either:
 * - Advances to `next` (linear flow),
 * - Presents `responses` for the player to choose (branching flow), or
 * - Ends the conversation (neither `next` nor `responses`).
 */
export interface DialogueNode {
  /** Unique ID within the dialogue tree */
  id: string;
  /** Speaker name displayed above the text (e.g., "Bubble", "Pip") */
  speaker: string;
  /** The dialogue text to display with typewriter effect */
  text: string;
  /** Player response choices — mutually exclusive with `next` */
  responses?: DialogueResponse[];
  /** Next node ID for linear progression — mutually exclusive with `responses` */
  next?: string;
  /** Optional flag condition — skip this node if condition is not met */
  condition?: string;
  /** Optional action to execute when this node is displayed */
  action?: DialogueAction;
}

/**
 * A complete dialogue tree — a named collection of nodes.
 *
 * The tree has a single entry point (`startNodeId`) and can branch
 * arbitrarily through its nodes. Trees are referenced by ID from
 * NPC definitions (e.g., { action: 'startDialogue', data: { dialogueId: 'bubble-greeting' } }).
 */
export interface DialogueTree {
  /** Unique ID matching the dialogueId referenced by NPCs */
  id: string;
  /** ID of the first node to display */
  startNodeId: string;
  /** All nodes in this dialogue tree, keyed by node ID */
  nodes: Record<string, DialogueNode>;
}
