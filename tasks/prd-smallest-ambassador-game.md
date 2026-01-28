# PRD: The Smallest Ambassador - A Sierra-Style Adventure Game

## Introduction

A classic point-and-click adventure game based on Wesley K. Alexander's novel "The Smallest Ambassador." Players take on the role of Pip, a tiny penguin who can't dive but sees mathematical patterns everywhere, as she becomes Earth's first ambassador to alien refugees from Europa. The game captures the nostalgic feel of 1990s Sierra and LucasArts adventures with VGA-style pixel art (320x200 resolution, 256-color palette), a SCUMM-style verb interface, inventory puzzles, and branching dialogue trees.

### Core Theme
*"Small doesn't mean less than. Different doesn't mean wrong."*

---

## Goals

- Create an authentic Sierra/LucasArts adventure game experience playable in web browsers
- Faithfully adapt the emotional journey and themes of the source novel
- Implement pattern-matching puzzles that represent base-7 mathematics without requiring calculation
- Build a reusable adventure game engine in Phaser 3

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Game Engine | Phaser 3.80+ | Core game framework, rendering, input |
| Language | TypeScript 5.x | Type safety, modern tooling |
| Build Tool | Vite | Fast HMR, ESM bundling |
| State Management | Custom + LocalStorage | Game saves, inventory, flags |
| Resolution | 320x200 native, 4x scale | Authentic VGA aesthetic |

---

## User Stories

Stories are organized in dependency order. Each story should be completable in one focused session.

### PHASE 1: Project Foundation

#### US-001: Initialize Phaser 3 Project
**Description:** As a developer, I need a working Phaser 3 + TypeScript + Vite project scaffold.

**Acceptance Criteria:**
- [ ] `npm create vite@latest` with TypeScript template
- [ ] Install phaser@3.80.0 as dependency
- [ ] Create `src/main.ts` with basic Phaser.Game config
- [ ] Configure game dimensions: 320x200 native, scaled 4x to 1280x800
- [ ] Set `pixelArt: true` and `roundPixels: true` in render config
- [ ] `npm run dev` launches game with colored background
- [ ] `npm run build` produces working production bundle
- [ ] TypeScript strict mode enabled, no errors

**Verification:** Run `npm run dev` and confirm 1280x800 window appears with game canvas.

---

#### US-002: Create Scene Structure
**Description:** As a developer, I need the basic scene architecture for the adventure game.

**Acceptance Criteria:**
- [ ] Create `src/scenes/BootScene.ts` - asset preloading
- [ ] Create `src/scenes/MenuScene.ts` - title screen placeholder
- [ ] Create `src/scenes/GameScene.ts` - main gameplay container
- [ ] Register all scenes in main.ts game config
- [ ] BootScene transitions to MenuScene after 1 second
- [ ] MenuScene shows "Click to Start" text, transitions to GameScene on click
- [ ] All files pass typecheck

**Verification:** Run game, see boot → menu → game scene transitions work.

---

#### US-003: Implement Pixel-Perfect Scaling
**Description:** As a player, I want crisp pixel graphics without blur at any window size.

**Acceptance Criteria:**
- [ ] Create `src/utils/PixelScale.ts` utility
- [ ] Implement integer scaling (1x, 2x, 3x, 4x based on window)
- [ ] Use CSS `image-rendering: pixelated` on canvas
- [ ] Handle window resize events, recalculate scale
- [ ] Center canvas in viewport with letterboxing
- [ ] No sub-pixel rendering artifacts
- [ ] Typecheck passes

**Verification:** Resize browser window, confirm pixels stay sharp and centered.

---

#### US-004: Add Placeholder Assets Structure
**Description:** As a developer, I need asset folders and placeholder files for development.

**Acceptance Criteria:**
- [ ] Create `public/assets/` directory structure:
  - `sprites/` - character sprite sheets
  - `backgrounds/` - room backgrounds
  - `ui/` - interface elements
  - `portraits/` - dialogue portraits
  - `audio/music/` - background tracks
  - `audio/sfx/` - sound effects
  - `fonts/` - pixel fonts
- [ ] Add placeholder 320x200 PNG background (solid blue with grid)
- [ ] Add placeholder 32x48 character sprite (colored rectangle)
- [ ] Add placeholder 16x16 UI button sprite
- [ ] Assets load successfully in BootScene

**Verification:** BootScene loads all placeholder assets without errors.

---

### PHASE 2: Core UI Systems

#### US-005: Create Verb Bar Component
**Description:** As a player, I want a SCUMM-style verb bar to select actions.

**Acceptance Criteria:**
- [ ] Create `src/systems/VerbSystem.ts`
- [ ] Render 6 verb buttons at bottom of screen: WALK, LOOK, TALK, USE, TAKE, GIVE
- [ ] Each verb is 48x16 pixels with pixel font text
- [ ] Verb bar background is dark blue (#1a1a2e)
- [ ] Highlight verb on hover (lighter color)
- [ ] Click verb to select it (stays highlighted)
- [ ] Track currently selected verb in state
- [ ] Default selected verb is WALK
- [ ] Typecheck passes

**Verification:** Click each verb, confirm it highlights and stays selected.

---

#### US-006: Add Sentence Line Display
**Description:** As a player, I want to see my current action described as I interact.

**Acceptance Criteria:**
- [ ] Add sentence line area above verb bar (320x16 pixels)
- [ ] Display current verb when selected: "Walk to"
- [ ] Update to show "Walk to [target]" when hovering hotspot
- [ ] Use pixel font (8px height)
- [ ] Text is white on dark background
- [ ] Clear target text when mouse leaves hotspot
- [ ] Typecheck passes

**Verification:** Select USE, hover over test hotspot, see "Use [hotspot name]" displayed.

---

#### US-007: Create Inventory Panel
**Description:** As a player, I want an inventory to store collected items.

**Acceptance Criteria:**
- [ ] Create `src/systems/InventorySystem.ts`
- [ ] Render 8-slot inventory row below verb bar (40px height)
- [ ] Each slot is 32x32 pixels with 4px padding
- [ ] Scroll arrows on left/right when >8 items
- [ ] Click item to select for USE/GIVE actions
- [ ] Right-click item shows LOOK description
- [ ] Selected item has highlight border
- [ ] Inventory state persists in memory
- [ ] Typecheck passes

**Verification:** Add test items via console, scroll inventory, select items.

---

#### US-008: Implement Item Combination
**Description:** As a player, I want to combine inventory items to solve puzzles.

**Acceptance Criteria:**
- [ ] USE selected item ON another inventory item triggers combination check
- [ ] Create `src/data/items.ts` with item definitions including `combinesWith` property
- [ ] Successful combination removes source items, adds result item
- [ ] Failed combination shows "That doesn't work" message
- [ ] Combination results defined in item data
- [ ] Typecheck passes

**Verification:** Combine two test items that should work, confirm new item appears.

---

### PHASE 3: Room System

#### US-009: Create Room Data Structure
**Description:** As a developer, I need a data format for defining adventure game rooms.

**Acceptance Criteria:**
- [ ] Create `src/data/rooms/types.ts` with RoomData interface:
  - `id: string`
  - `name: string`
  - `background: string` (asset key)
  - `walkableArea: number[][]` (polygon points)
  - `hotspots: Hotspot[]`
  - `exits: Exit[]`
  - `characters: CharacterPlacement[]`
  - `ambientSound?: string`
- [ ] Create `src/data/rooms/test-room.ts` with sample room data
- [ ] Export room registry object
- [ ] Typecheck passes

**Verification:** Import test room data, confirm TypeScript accepts the structure.

---

#### US-010: Render Room Background
**Description:** As a player, I want to see room backgrounds that establish the scene.

**Acceptance Criteria:**
- [ ] GameScene loads room data by ID
- [ ] Display background image at 0,0 (320x144 viewport area)
- [ ] Background scales with game canvas
- [ ] Create `loadRoom(roomId)` method on GameScene
- [ ] Room change clears previous background
- [ ] Typecheck passes

**Verification:** Call loadRoom with test room, see background appear.

---

#### US-011: Implement Hotspot System
**Description:** As a player, I want to interact with objects in the room.

**Acceptance Criteria:**
- [ ] Create `src/entities/Hotspot.ts` class
- [ ] Hotspots defined by polygon or rectangle bounds
- [ ] Mouse hover over hotspot changes cursor
- [ ] Hotspot name appears in sentence line on hover
- [ ] Click hotspot with verb triggers action
- [ ] Each hotspot has responses for: look, use, take, talk
- [ ] Responses can be text or trigger callbacks
- [ ] Typecheck passes

**Verification:** Hover test hotspot, see name. Click with LOOK, see description text.

---

#### US-012: Add Room Exits
**Description:** As a player, I want to move between rooms through exits.

**Acceptance Criteria:**
- [ ] Exits are special hotspots at room edges
- [ ] Walking to exit triggers room transition
- [ ] Exit data includes: target room ID, spawn position
- [ ] Room transition uses fade out/in effect (0.5s each)
- [ ] Player position set to spawn point in new room
- [ ] Typecheck passes

**Verification:** Walk to exit, see fade transition, appear in new room at correct position.

---

### PHASE 4: Character System

#### US-013: Create Player Character
**Description:** As a player, I want to control Pip and see her in the game world.

**Acceptance Criteria:**
- [ ] Create `src/entities/Character.ts` base class
- [ ] Create `src/entities/Player.ts` extending Character
- [ ] Player sprite renders at current position
- [ ] Sprite has idle animation (2 frames, 500ms each)
- [ ] Player faces direction of last movement
- [ ] Z-depth based on Y position (walk behind/in front)
- [ ] Typecheck passes

**Verification:** Player sprite visible, idle animation plays, depth sorting works.

---

#### US-014: Implement Click-to-Walk
**Description:** As a player, I want Pip to walk where I click.

**Acceptance Criteria:**
- [ ] Click on walkable area with WALK verb selected
- [ ] Player moves toward click position at 60 pixels/second
- [ ] Walking animation plays during movement (4 frames)
- [ ] Player stops at destination
- [ ] Click during walk updates destination
- [ ] Cannot walk outside walkable area polygon
- [ ] Typecheck passes

**Verification:** Click various points, Pip walks to them, stops at boundaries.

---

#### US-015: Add Pathfinding
**Description:** As a player, I want Pip to navigate around obstacles.

**Acceptance Criteria:**
- [ ] Implement A* pathfinding in `src/systems/WalkSystem.ts`
- [ ] Walkable area converted to navigation mesh
- [ ] Player follows path around obstacles
- [ ] Path recalculates if blocked
- [ ] Visual debug mode to show walkable area (toggle with F1)
- [ ] Typecheck passes

**Verification:** Place obstacle in path, Pip walks around it. F1 shows mesh.

---

#### US-016: Create NPC Characters
**Description:** As a developer, I need NPCs that can appear in rooms.

**Acceptance Criteria:**
- [ ] NPCs use Character base class
- [ ] Room data specifies NPC placements (id, position, facing)
- [ ] NPCs render with idle animations
- [ ] NPCs are hotspots (can LOOK, TALK)
- [ ] NPC dialogue triggers on TALK action
- [ ] Typecheck passes

**Verification:** Test room has NPC, can look at and talk to them.

---

### PHASE 5: Dialogue System

#### US-017: Create Dialogue Data Format
**Description:** As a developer, I need a format for branching dialogue trees.

**Acceptance Criteria:**
- [ ] Create `src/data/dialogue/types.ts` with:
  - `DialogueNode`: id, speaker, text, responses?, next?, condition?, action?
  - `DialogueResponse`: text, nextNode, condition?
  - `DialogueTree`: nodes map, startNode
- [ ] Create sample dialogue tree in `src/data/dialogue/test-dialogue.ts`
- [ ] Typecheck passes

**Verification:** Sample dialogue compiles, has multiple branches.

---

#### US-018: Render Dialogue UI
**Description:** As a player, I want to see character dialogue in a text box.

**Acceptance Criteria:**
- [ ] Create `src/systems/DialogueSystem.ts`
- [ ] Dialogue box appears at bottom of viewport (320x60 pixels)
- [ ] Speaker portrait on left (48x48 pixels)
- [ ] Speaker name above text
- [ ] Text appears with typewriter effect (40 chars/second)
- [ ] Click to complete typewriter instantly
- [ ] Click again to advance to next node
- [ ] Game interaction disabled during dialogue
- [ ] Typecheck passes

**Verification:** Trigger test dialogue, see portrait, typewriter text, click to advance.

---

#### US-019: Implement Dialogue Choices
**Description:** As a player, I want to choose responses in conversations.

**Acceptance Criteria:**
- [ ] When node has responses, display choice list
- [ ] Up to 4 choices displayed as clickable text
- [ ] Hover highlights choice
- [ ] Click choice advances to its nextNode
- [ ] Choices can have conditions (only show if flag is true)
- [ ] Typecheck passes

**Verification:** Reach choice node, see options, click one, dialogue continues correctly.

---

#### US-020: Add Dialogue Actions
**Description:** As a developer, I need dialogue to trigger game state changes.

**Acceptance Criteria:**
- [ ] Dialogue nodes can have `action` property
- [ ] Actions supported: setFlag, giveItem, takeItem, startQuest
- [ ] Create `src/systems/GameState.ts` for flags and state
- [ ] Actions execute when node is displayed
- [ ] Typecheck passes

**Verification:** Dialogue gives item, item appears in inventory.

---

### PHASE 6: Save System

#### US-021: Implement Game State Manager
**Description:** As a developer, I need centralized game state management.

**Acceptance Criteria:**
- [ ] `GameState.ts` manages: current room, player position, inventory, flags, quest states
- [ ] State is a singleton accessible throughout app
- [ ] Methods: getFlag, setFlag, hasItem, addItem, removeItem
- [ ] State changes emit events for UI updates
- [ ] Typecheck passes

**Verification:** Set flags and inventory via console, values persist during session.

---

#### US-022: Save to LocalStorage
**Description:** As a player, I want my game progress saved automatically.

**Acceptance Criteria:**
- [ ] Create `src/systems/SaveSystem.ts`
- [ ] Serialize GameState to JSON
- [ ] Save to localStorage on room transitions
- [ ] Save includes timestamp
- [ ] Three save slots available
- [ ] Typecheck passes

**Verification:** Play, close tab, reopen, confirm state is saved in localStorage.

---

#### US-023: Load Game and Save Menu
**Description:** As a player, I want to save/load from a menu.

**Acceptance Criteria:**
- [ ] ESC key opens pause menu
- [ ] Menu shows: Resume, Save Game, Load Game, Quit to Menu
- [ ] Save Game shows 3 slots with timestamps
- [ ] Load Game restores full state
- [ ] Quit returns to MenuScene
- [ ] Typecheck passes

**Verification:** Save to slot 2, quit, load slot 2, game state restored.

---

### PHASE 7: Pattern Puzzle System

#### US-024: Define Seven Sacred Elements
**Description:** As a developer, I need the visual/audio elements for base-7 patterns.

**Acceptance Criteria:**
- [ ] Create `src/systems/PatternPuzzle.ts`
- [ ] Define 7 colors: ice-white, deep-blue, aurora-green, sunset-orange, shadow-purple, starlight-silver, quantum-gold
- [ ] Define 7 tones: C4, D4, E4, F4, G4, A4, B4 (pleasant scale)
- [ ] Define 7 shapes: dot, line, triangle, square, pentagon, hexagon, heptagon
- [ ] Create sprite sheet with 7 colored shape icons (32x32 each)
- [ ] Typecheck passes

**Verification:** All 7 elements defined, sprites created.

---

#### US-025: Create Pattern Display Component
**Description:** As a player, I want to see pattern sequences displayed visually.

**Acceptance Criteria:**
- [ ] Pattern display shows sequence of colored shapes
- [ ] Shapes appear one at a time with 500ms delay
- [ ] Each shape plays its corresponding tone
- [ ] Sequence can be replayed on demand
- [ ] Display supports 3, 5, or 7 element sequences
- [ ] Typecheck passes

**Verification:** Display test pattern, see shapes appear with sounds.

---

#### US-026: Implement Pattern Input
**Description:** As a player, I want to input pattern sequences to solve puzzles.

**Acceptance Criteria:**
- [ ] Show 7 clickable shape buttons during puzzle
- [ ] Click adds shape to player sequence
- [ ] Player sequence displayed above buttons
- [ ] Backspace removes last input
- [ ] Submit button checks against target pattern
- [ ] Success: green flash, puzzle complete callback
- [ ] Failure: red flash, sequence clears, can retry
- [ ] Typecheck passes

**Verification:** See pattern, input matching sequence, puzzle succeeds.

---

### PHASE 8: Act 1 Content

#### US-027: Create Pip's Counting Spot Room
**Description:** As a player, I want to start the game at Pip's private counting spot.

**Acceptance Criteria:**
- [ ] Background: Dawn sky with stars, ice edge, telescope
- [ ] Hotspots: Stars (LOOK triggers counting), Telescope, Ice Wall with marks
- [ ] LOOK at stars reveals 21 normal, 1 wrong color
- [ ] LOOK at marks shows Pool's mysterious writing
- [ ] Exit south to Colony Gathering
- [ ] Ambient: Wind, distant colony sounds
- [ ] Typecheck passes

**Verification:** Explore room, examine all hotspots, read descriptions.

---

#### US-028: Create Colony Gathering Room
**Description:** As a player, I want to explore the main colony area.

**Acceptance Criteria:**
- [ ] Background: Colony spiral formation, many penguins, ice shelves
- [ ] NPCs: Commander Frost, Riptide, Bubble (with dialogue trees)
- [ ] Hotspots: Gathering area, depth call board, various ice features
- [ ] Exits: North to Counting Spot, East to Shore Duty, West to Pool's Marker
- [ ] Bubble greets Pip warmly, offers to help
- [ ] Riptide mocks Pip as "Puddle"
- [ ] Typecheck passes

**Verification:** Talk to all NPCs, explore all exits.

---

#### US-029: Create Shore Duty Station Room
**Description:** As a player, I want to visit Pip's workshop area.

**Acceptance Criteria:**
- [ ] Background: Pulley system, kelp, shells, work area
- [ ] Hotspots: Pulley (interactive), Shell pile, Ice crystals, Kelp
- [ ] Inventory items obtainable: Ice Lens, Abalone Shells, Fishing Weight
- [ ] Pulley puzzle: combine weight + rope to fix
- [ ] LOOK descriptions show Pip's ingenuity
- [ ] Exit west to Colony Gathering
- [ ] Typecheck passes

**Verification:** Collect all items, fix pulley.

---

#### US-030: Create Forbidden Zone Room
**Description:** As a player, I want to discover the crashed probe.

**Acceptance Criteria:**
- [ ] Background: Twisted ice, melted circle with probe, steam
- [ ] The Probe is central hotspot
- [ ] LOOK at probe describes base-7 light patterns
- [ ] USE ice crystals on probe triggers pattern puzzle
- [ ] Success: Probe opens, shows Europa vision (cutscene)
- [ ] Riptide arrives after vision, probe goes defensive
- [ ] Frost arrives with colony, dramatic dialogue
- [ ] Pip touches probe, receives countdown message
- [ ] End of Act 1 triggers
- [ ] Typecheck passes

**Verification:** Complete first contact sequence, see countdown.

---

### PHASE 9: Polish and Menus

#### US-031: Create Title Screen
**Description:** As a player, I want an attractive title screen.

**Acceptance Criteria:**
- [ ] Background: Antarctic vista with aurora
- [ ] Title: "The Smallest Ambassador" in pixel font
- [ ] Subtitle: "A Sierra-Style Adventure"
- [ ] Menu: New Game, Continue, Options, Credits
- [ ] Continue only shows if save exists
- [ ] Animated elements (aurora shimmer, stars)
- [ ] Typecheck passes

**Verification:** Title screen displays, all buttons work.

---

#### US-032: Add Sound Effects
**Description:** As a player, I want audio feedback for actions.

**Acceptance Criteria:**
- [ ] Create/source 8-bit style sound effects
- [ ] Effects for: footsteps, item pickup, UI click, dialogue blip, door/exit, puzzle success, puzzle fail
- [ ] Volume control in options
- [ ] Mute toggle (M key)
- [ ] Typecheck passes

**Verification:** All interactions have appropriate sounds.

---

#### US-033: Add Background Music
**Description:** As a player, I want atmospheric music for each area.

**Acceptance Criteria:**
- [ ] Create/source retro-style background tracks
- [ ] Tracks for: Title, Colony, Shore Duty, Forbidden Zone, Tense moment
- [ ] Music loops seamlessly
- [ ] Cross-fade between tracks on room change
- [ ] Volume control in options
- [ ] Typecheck passes

**Verification:** Music plays and changes appropriately between rooms.

---

## Functional Requirements

- **FR-001**: Game renders at native 320x200, scaled with nearest-neighbor filtering
- **FR-002**: Verb bar provides six actions: WALK, LOOK, TALK, USE, TAKE, GIVE
- **FR-003**: Inventory supports up to 24 items with scrolling display
- **FR-004**: Dialogue system supports branching, conditions, and actions
- **FR-005**: Pattern puzzles use visual colors and audio tones for base-7
- **FR-006**: Save system stores complete game state in LocalStorage
- **FR-007**: Room transitions use fade effects
- **FR-008**: No player death or permanently missable items

---

## Non-Goals (Out of Scope)

- Full voice acting
- Mobile touch controls (desktop first)
- Multiple endings
- Player death states
- Acts 2-5 content (future phases)

---

## Art Asset Notes

### Using image-generator Agent

For backgrounds:
```
"Create a pixel art background in 1990s Sierra adventure game style.
Scene: [DESCRIPTION]. Antarctic setting. 320x200 VGA aesthetic.
Limited 32-64 color palette. Dithering for gradients. No anti-aliasing."
```

For sprites:
```
"Create pixel art character sprite for point-and-click adventure.
Character: [DESCRIPTION]. 32x48 pixels. 4 direction walk cycle.
Sierra/LucasArts style circa 1992."
```

Post-process: Resize with nearest-neighbor, reduce palette, cleanup in Aseprite.

---

## Success Metrics

- All 33 user stories completed and passing
- Game runs at 60fps
- Load time under 3 seconds
- Act 1 playable start to finish

---

## Open Questions

1. Original music composition vs royalty-free tracks?
2. Should pattern puzzles have difficulty settings?
