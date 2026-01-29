import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';
import { VerbSystem } from '../systems/VerbSystem';
import { SentenceLineSystem } from '../systems/SentenceLineSystem';
import { InventorySystem, InventoryItem } from '../systems/InventorySystem';
import { WalkSystem } from '../systems/WalkSystem';
import { DialogueSystem } from '../systems/DialogueSystem';
import { GameState } from '../systems/GameState';
import { SaveSystem } from '../systems/SaveSystem';
import { ItemDefinition, getItemDefinition } from '../data/items';
import { RoomData, HotspotData, HotspotCallback, ExitData, Point, getRoom } from '../data/rooms';
import { Hotspot } from '../entities/Hotspot';
import { Verb } from '../systems/VerbSystem';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { NPCDefinition, getNPCDefinition } from '../data/npcs';
import { PatternDisplay, PatternInput } from '../systems/PatternPuzzle';
import { SoundSystem } from '../systems/SoundSystem';

/** Height of the gameplay viewport area (above UI panels) */
const VIEWPORT_HEIGHT = 120;

/**
 * GameScene - Main gameplay container
 *
 * This scene will contain the main game loop, room rendering,
 * verb interface, inventory, and player interactions.
 */
export class GameScene extends Phaser.Scene {
  private verbSystem!: VerbSystem;
  private sentenceLineSystem!: SentenceLineSystem;
  private inventorySystem!: InventorySystem;
  private dialogueSystem!: DialogueSystem;
  private gameState!: GameState;
  private saveSystem!: SaveSystem;
  private feedbackText!: Phaser.GameObjects.Text;
  private currentRoom: RoomData | null = null;
  private roomBackground: Phaser.GameObjects.Image | null = null;
  private hotspots: Hotspot[] = [];
  private exitZones: Phaser.GameObjects.Zone[] = [];
  private npcs: NPC[] = [];
  private isTransitioning = false;
  private isDialogueActive = false;
  private player!: Player;
  private walkablePolygon: Phaser.Geom.Polygon | null = null;
  private walkSystem!: WalkSystem;
  private soundSystem!: SoundSystem;
  private footstepTimer = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Initialize walk system (covers the 320x120 viewport area)
    this.walkSystem = new WalkSystem(this, GAME_WIDTH, VIEWPORT_HEIGHT);

    // Check if GameState already has a loaded snapshot (from save/load)
    const existingState = GameState.getInstance();
    const restoredRoomId = existingState?.getCurrentRoomId();
    const restoredPosition = existingState?.getPlayerPosition();

    // Determine initial room and player position
    const startRoomId = restoredRoomId ?? 'counting-spot';
    const startX = restoredPosition && restoredRoomId ? restoredPosition.x : GAME_WIDTH / 2;
    const startY = restoredPosition && restoredRoomId ? restoredPosition.y : 100;

    // Load the starting room
    this.loadRoom(startRoomId);

    // Create the player character at initial position
    this.player = new Player(this, startX, startY);

    // Handle click-to-walk: pointer down in the viewport area
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleViewportClick(pointer);
    });

    // F1 key toggles walkable area debug overlay
    this.input.keyboard?.on('keydown-F1', () => {
      const visible = this.walkSystem.toggleDebug();
      console.log(`Walk debug overlay: ${visible ? 'ON' : 'OFF'}`);
    });

    // ESC key opens pause menu (launches PauseScene as overlay)
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.isTransitioning || this.isDialogueActive) return;
      this.scene.pause('GameScene');
      this.scene.launch('PauseScene');
    });

    // M key toggles sound mute
    this.input.keyboard?.on('keydown-M', () => {
      const muted = this.soundSystem.toggleMute();
      this.showFeedback(muted ? 'Sound: OFF' : 'Sound: ON');
    });

    // Initialize UI systems in order (bottom to top visually, but create order doesn't matter)
    // UI Layout:
    // - Viewport: 0-120 (120px)
    // - Inventory: 120-160 (40px)
    // - Sentence line: 160-176 (16px)
    // - Verb bar: 176-200 (24px)
    this.inventorySystem = new InventorySystem(this);
    this.sentenceLineSystem = new SentenceLineSystem(this);
    this.verbSystem = new VerbSystem(this);

    // Initialize dialogue system (must be after other UI systems so it renders on top)
    this.dialogueSystem = new DialogueSystem(this);

    // Initialize or re-bind game state manager (singleton, tracks room/position/inventory/flags/quests)
    const existingGameState = GameState.getInstance();
    if (existingGameState) {
      // Scene restart (e.g., after loading a save) — re-bind to new scene
      existingGameState.setScene(this);
      this.gameState = existingGameState;

      // Restore inventory into InventorySystem from GameState
      const savedInventory = this.gameState.getInventory();
      for (const item of savedInventory) {
        if (!this.inventorySystem.hasItem(item.id)) {
          this.inventorySystem.addItem(item);
        }
      }
    } else {
      this.gameState = new GameState(this);
    }

    // Initialize save system (must be after GameState so it can listen for room changes)
    this.saveSystem = new SaveSystem(this);

    // Initialize sound system (procedural 8-bit sound effects)
    this.soundSystem = new SoundSystem(this);

    // Track initial room and player position in GameState (only if not already restored)
    if (!restoredRoomId && this.currentRoom) {
      this.gameState.setCurrentRoomId(this.currentRoom.id);
    }
    this.gameState.setPlayerPosition(this.player.getX(), this.player.getY());

    // Listen for game state events that affect inventory UI
    this.events.on('gamestate:giveItem', (item: InventoryItem) => {
      // Only add to InventorySystem if it doesn't already have the item
      // (prevents double-add when GameState.addItem triggers this event)
      if (!this.inventorySystem.hasItem(item.id)) {
        this.inventorySystem.addItem(item);
      }
      this.showFeedback(`Received ${item.name}!`);
      this.soundSystem.play('itemPickup');
    });
    this.events.on('gamestate:takeItem', (itemId: string) => {
      if (this.inventorySystem.hasItem(itemId)) {
        this.inventorySystem.removeItem(itemId);
      }
      this.showFeedback(`Lost item.`);
    });

    // Sync GameState inventory when InventorySystem changes directly (e.g., item combinations)
    this.events.on('inventory:changed', (items: InventoryItem[]) => {
      this.gameState.syncInventory(items);
    });

    // Listen for dialogue start/end to block/unblock game interaction
    this.events.on('dialogue:start', () => {
      this.isDialogueActive = true;
      this.player.stopWalking();
    });
    this.events.on('dialogue:end', () => {
      this.isDialogueActive = false;
    });

    // Dialogue typewriter blip sound
    this.events.on('dialogue:blip', () => {
      this.soundSystem.play('dialogueBlip');
    });

    // Listen for hotspot clicks — dispatch verb action
    this.events.on('hotspot:click', (hotspotData: HotspotData) => {
      this.handleHotspotClick(hotspotData);
    });

    // Listen for NPC clicks — dispatch verb action using NPC responses
    this.events.on('npc:click', (npcDef: NPCDefinition) => {
      this.handleNPCClick(npcDef);
    });

    // Listen for hotspot actions — route giveItem, setFlag, and usePulley to game state
    // (startDialogue is already handled by DialogueSystem)
    this.events.on('hotspot:action', (action: string, data?: Record<string, unknown>) => {
      this.handleHotspotAction(action, data);
    });

    // Listen for verb selection events — play UI click sound
    this.events.on('verb:selected', (verb: string) => {
      console.log(`Verb selected: ${verb}`);
      this.soundSystem.play('uiClick');
    });

    // Listen for inventory events (useful for debugging and testing)
    this.events.on('inventory:selected', (item: InventoryItem) => {
      console.log(`Inventory item selected: ${item.name}`);
    });

    this.events.on('inventory:deselected', () => {
      console.log('Inventory item deselected');
    });

    this.events.on('inventory:look', (item: InventoryItem) => {
      console.log(`Look at inventory item: ${item.name} - ${item.description}`);
    });

    // Create feedback text for combination results (centered in viewport area)
    this.feedbackText = this.add.text(GAME_WIDTH / 2, 60, '', {
      fontSize: '8px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    this.feedbackText.setOrigin(0.5, 0.5);
    this.feedbackText.setDepth(100);
    this.feedbackText.setVisible(false);

    // Listen for combination events
    this.events.on(
      'combination:success',
      (resultItem: ItemDefinition) => {
        this.showFeedback(`Created ${resultItem.name}!`);
        this.soundSystem.play('puzzleSuccess');
      }
    );

    this.events.on(
      'combination:fail',
      (_source: InventoryItem, _target: InventoryItem) => {
        this.showFeedback("That doesn't work.");
        this.soundSystem.play('puzzleFail');
      }
    );

    // Pattern puzzle sound effects
    this.events.on('pattern:inputSuccess', () => {
      this.soundSystem.play('puzzleSuccess');
    });
    this.events.on('pattern:inputFail', () => {
      this.soundSystem.play('puzzleFail');
    });

    // Expose systems globally for console testing
    // Usage: window.gameState.getSnapshot(), window.gameState.setFlag('test', true), etc.
    // Usage: window.saveSystem.saveToSlot(1), window.saveSystem.getSlotInfo(), etc.
    (window as unknown as { gameState: GameState }).gameState = this.gameState;
    (window as unknown as { testInventory: InventorySystem }).testInventory = this.inventorySystem;
    (window as unknown as { saveSystem: SaveSystem }).saveSystem = this.saveSystem;
    (window as unknown as { soundSystem: SoundSystem }).soundSystem = this.soundSystem;
    (window as unknown as { gameScene: GameScene }).gameScene = this;
    // Test helper: window.testPattern([0,2,4]) creates and plays a PatternDisplay
    (window as unknown as { testPattern: (indices: number[]) => PatternDisplay }).testPattern = (indices: number[]) => {
      const display = new PatternDisplay(this, indices);
      display.play();
      return display;
    };
    // Test helper: window.testPatternInput([0,2,4]) creates a PatternInput puzzle
    (window as unknown as { testPatternInput: (indices: number[]) => PatternInput }).testPatternInput = (indices: number[]) => {
      const input = new PatternInput(this, indices);
      return input;
    };
  }

  /**
   * Handle a hotspot click — resolve the active verb's response
   */
  private handleHotspotClick(hotspotData: HotspotData): void {
    if (this.isDialogueActive) return;
    const verb = this.verbSystem.getSelectedVerb();
    const hotspot = this.hotspots.find(h => h.getData().id === hotspotData.id);
    if (!hotspot) return;

    const response = hotspot.getResponse(verb);

    if (!response) {
      // No specific response defined for this verb
      this.showFeedback("Nothing happens.");
      return;
    }

    if (typeof response === 'string') {
      // Text response — show as feedback
      this.showFeedback(response);
    } else {
      // Callback response — emit event with action data
      const callback = response as HotspotCallback;
      this.events.emit('hotspot:action', callback.action, callback.data);
      console.log(`Hotspot action: ${callback.action}`, callback.data);
    }
  }

  /**
   * Handle an NPC click — resolve the active verb's response from NPC definition
   */
  private handleNPCClick(npcDef: NPCDefinition): void {
    if (this.isDialogueActive) return;
    const verb = this.verbSystem.getSelectedVerb();

    // Map verb to response key (same mapping as hotspots)
    const VERB_TO_KEY: Record<Verb, keyof NPCDefinition['responses']> = {
      [Verb.WALK]: 'walk',
      [Verb.LOOK]: 'look',
      [Verb.TALK]: 'talk',
      [Verb.USE]: 'use',
      [Verb.TAKE]: 'take',
      [Verb.GIVE]: 'look',
    };

    const key = VERB_TO_KEY[verb];
    const response = npcDef.responses[key];

    if (!response) {
      this.showFeedback('Nothing happens.');
      return;
    }

    if (typeof response === 'string') {
      this.showFeedback(response);
    } else {
      this.events.emit('hotspot:action', response.action, response.data);
      console.log(`NPC action: ${response.action}`, response.data);
    }
  }

  /**
   * Handle a hotspot action callback — routes game-state-changing actions
   * like giveItem, setFlag, and usePulley from hotspot interactions.
   * (startDialogue is handled by DialogueSystem's own listener.)
   */
  private handleHotspotAction(action: string, data?: Record<string, unknown>): void {
    switch (action) {
      case 'giveItem': {
        const itemId = data?.itemId as string | undefined;
        if (!itemId) break;

        // Don't give duplicate items
        if (this.gameState.hasItem(itemId)) {
          this.showFeedback("You already have that.");
          return;
        }

        const itemDef = getItemDefinition(itemId);
        if (!itemDef) {
          console.warn(`Item definition not found: ${itemId}`);
          break;
        }

        this.gameState.addItem({
          id: itemDef.id,
          name: itemDef.name,
          description: itemDef.description,
          icon: itemDef.icon,
        });
        break;
      }

      case 'setFlag': {
        const flagKey = data?.flag as string | undefined;
        const flagValue = (data?.value as boolean) ?? true;
        if (flagKey) {
          this.gameState.setFlag(flagKey, flagValue);
        }
        break;
      }

      case 'usePulley': {
        // Pulley puzzle: use weighted-rope on pulley to fix it
        if (this.gameState.getFlag('pulley_fixed')) {
          this.showFeedback("The pulley is already working. The rope holds firm and the bucket swings freely.");
          return;
        }
        if (this.gameState.hasItem('weighted-rope')) {
          // Fix the pulley!
          this.gameState.removeItem('weighted-rope');
          this.gameState.setFlag('pulley_fixed', true);
          this.showFeedback("You attach the weighted rope to the pulley. It works! The bucket descends smoothly into the water below.");
        } else if (this.gameState.hasItem('rope')) {
          this.showFeedback("The rope alone won't hold. You need something to weigh it down.");
        } else {
          this.showFeedback("The pulley needs a new rope. A weighted one would work best.");
        }
        break;
      }

      case 'useProbe': {
        this.handleUseProbe();
        break;
      }

      // startDialogue is handled by DialogueSystem — no case needed here
    }
  }

  /**
   * Handle the probe interaction in the Forbidden Zone.
   * Multi-stage sequence:
   * 1. Check if player has ice crystals (ice-lens)
   * 2. Show pattern display (base-7 sequence)
   * 3. Show pattern input (player must reproduce the sequence)
   * 4. On success: start Europa vision dialogue
   * 5. After vision: start Riptide arrival dialogue
   * 6. After Riptide: start Frost arrival + countdown dialogue
   */
  private handleUseProbe(): void {
    // Already completed Act 1
    if (this.gameState.getFlag('act1_complete')) {
      this.showFeedback("The probe sits quietly now, its countdown message delivered. Forty-nine days...");
      return;
    }

    // Already seen the vision — Frost arrival dialogue
    if (this.gameState.getFlag('riptide_fetched_frost')) {
      this.events.emit('hotspot:action', 'startDialogue', { dialogueId: 'forbidden-zone-frost' });
      return;
    }

    // Vision seen, Riptide not yet arrived
    if (this.gameState.getFlag('probe_vision_seen') && !this.gameState.getFlag('riptide_at_probe')) {
      this.events.emit('hotspot:action', 'startDialogue', { dialogueId: 'forbidden-zone-riptide' });
      return;
    }

    // Probe opened but vision not yet triggered
    if (this.gameState.getFlag('probe_opened')) {
      this.events.emit('hotspot:action', 'startDialogue', { dialogueId: 'forbidden-zone-vision' });
      return;
    }

    // First attempt: need ice crystals (ice-lens)
    if (!this.gameState.hasItem('ice-lens')) {
      this.showFeedback("The probe's surface shimmers with light patterns. You need something to focus the light — a lens or crystal...");
      return;
    }

    // Player has ice lens — start the pattern puzzle!
    this.gameState.removeItem('ice-lens');
    this.showFeedback("You hold the ice lens up to the probe. The light patterns focus into a clear sequence...");

    // After a brief delay, show the pattern display
    this.time.delayedCall(2000, () => {
      // The probe's pattern: a 3-element base-7 sequence
      const probePattern = [0, 2, 4]; // ice-white, aurora-green, shadow-purple

      const display = new PatternDisplay(this, probePattern);
      display.play();

      // When display completes, show the input puzzle
      this.events.once('pattern:displayComplete', () => {
        this.time.delayedCall(500, () => {
          display.destroy();

          // Show pattern input for the player to reproduce the sequence
          const input = new PatternInput(this, probePattern, (success: boolean) => {
            if (success) {
              // Pattern solved — probe opens!
              this.time.delayedCall(800, () => {
                input.destroy();
                this.gameState.setFlag('probe_opened', true);

                // Chain: vision → riptide → frost dialogues
                this.startProbeCutsceneChain();
              });
            }
            // Failure: PatternInput handles retry internally
          });
        });
      });
    });
  }

  /**
   * Start the chain of dialogues for the probe cutscene.
   * Vision → Riptide arrival → Frost arrival + countdown.
   */
  private startProbeCutsceneChain(): void {
    // Start with the Europa vision
    this.events.emit('hotspot:action', 'startDialogue', { dialogueId: 'forbidden-zone-vision' });

    // After vision dialogue ends, start Riptide arrival
    const onVisionEnd = () => {
      if (!this.gameState.getFlag('probe_vision_seen')) return;
      this.events.off('dialogue:end', onVisionEnd);

      this.time.delayedCall(1000, () => {
        this.events.emit('hotspot:action', 'startDialogue', { dialogueId: 'forbidden-zone-riptide' });

        // After Riptide dialogue ends, start Frost arrival
        const onRiptideEnd = () => {
          if (!this.gameState.getFlag('riptide_fetched_frost')) return;
          this.events.off('dialogue:end', onRiptideEnd);

          this.time.delayedCall(1000, () => {
            this.events.emit('hotspot:action', 'startDialogue', { dialogueId: 'forbidden-zone-frost' });
          });
        };
        this.events.on('dialogue:end', onRiptideEnd);
      });
    };
    this.events.on('dialogue:end', onVisionEnd);
  }

  /**
   * Get the verb system for external access
   */
  getVerbSystem(): VerbSystem {
    return this.verbSystem;
  }

  /**
   * Get the sentence line system for external access
   */
  getSentenceLineSystem(): SentenceLineSystem {
    return this.sentenceLineSystem;
  }

  /**
   * Get the inventory system for external access
   */
  getInventorySystem(): InventorySystem {
    return this.inventorySystem;
  }

  /**
   * Get the dialogue system for external access
   */
  getDialogueSystem(): DialogueSystem {
    return this.dialogueSystem;
  }

  /**
   * Get the game state manager for external access
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Get the save system for external access
   */
  getSaveSystem(): SaveSystem {
    return this.saveSystem;
  }

  /**
   * Get the sound system for external access
   */
  getSoundSystem(): SoundSystem {
    return this.soundSystem;
  }

  /**
   * Get the player character
   */
  getPlayer(): Player {
    return this.player;
  }

  /**
   * Show temporary feedback text in the viewport area
   */
  private showFeedback(message: string): void {
    this.feedbackText.setText(message);
    this.feedbackText.setVisible(true);
    this.feedbackText.setAlpha(1);

    // Fade out after 2 seconds
    this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      duration: 500,
      delay: 1500,
      onComplete: () => {
        this.feedbackText.setVisible(false);
      },
    });
  }

  /**
   * Load a room by ID — sets background and stores room data.
   * Clears any previous room background before rendering the new one.
   */
  loadRoom(roomId: string): void {
    const room = getRoom(roomId);
    if (!room) {
      console.warn(`Room not found: ${roomId}`);
      return;
    }

    // Clear previous background
    if (this.roomBackground) {
      this.roomBackground.destroy();
      this.roomBackground = null;
    }

    // Clear previous hotspots, exit zones, NPCs, and debug overlay
    this.clearHotspots();
    this.clearExitZones();
    this.clearNPCs();
    this.walkSystem.clearDebug();

    this.currentRoom = room;

    // Track room in GameState (if initialized)
    if (this.gameState) {
      this.gameState.setCurrentRoomId(roomId);
    }

    // Render background at top-left of viewport (320x120 area)
    this.roomBackground = this.add.image(0, 0, room.background).setOrigin(0, 0);
    // Ensure background renders behind everything else
    this.roomBackground.setDepth(-1);

    // Build walkable area polygon for point-in-polygon tests
    if (room.walkableArea.length >= 3) {
      const phaserPoints = room.walkableArea.map(p => new Phaser.Geom.Point(p.x, p.y));
      this.walkablePolygon = new Phaser.Geom.Polygon(phaserPoints);
      // Build navigation grid for A* pathfinding
      this.walkSystem.buildGrid(room.walkableArea);
    } else {
      this.walkablePolygon = null;
    }

    // Create hotspot entities from room data
    this.createHotspots(room);

    // Create exit zones from room data
    this.createExitZones(room);

    // Create NPC entities from room data
    this.createNPCs(room);

    console.log(`Loaded room: ${room.name} (${room.id})`);
  }

  /**
   * Create Hotspot entities from room data
   */
  private createHotspots(room: RoomData): void {
    for (const hotspotData of room.hotspots) {
      const hotspot = new Hotspot(this, hotspotData);
      this.hotspots.push(hotspot);
    }
  }

  /**
   * Destroy all current hotspot entities
   */
  private clearHotspots(): void {
    for (const hotspot of this.hotspots) {
      hotspot.destroy();
    }
    this.hotspots = [];
  }

  /**
   * Create NPC entities from room data character placements
   */
  private createNPCs(room: RoomData): void {
    for (const placement of room.characters) {
      const npcDef = getNPCDefinition(placement.id);
      if (!npcDef) {
        console.warn(`NPC definition not found: ${placement.id}`);
        continue;
      }

      const npc = new NPC(
        this,
        placement.position.x,
        placement.position.y,
        placement.facing,
        npcDef
      );
      this.npcs.push(npc);
    }
  }

  /**
   * Destroy all current NPC entities
   */
  private clearNPCs(): void {
    for (const npc of this.npcs) {
      npc.destroy();
    }
    this.npcs = [];
  }

  /**
   * Create interactive exit zones from room data.
   * Exits behave like hotspots: they show their name in the sentence line on hover
   * and trigger a room transition when clicked with the WALK verb.
   */
  private createExitZones(room: RoomData): void {
    for (const exit of room.exits) {
      const zone = this.createExitZone(exit);
      this.exitZones.push(zone);
    }
  }

  /**
   * Create a single exit zone with interactive events
   */
  private createExitZone(exit: ExitData): Phaser.GameObjects.Zone {
    const { bounds } = exit;
    let zone: Phaser.GameObjects.Zone;

    if (bounds.type === 'rect') {
      zone = this.add.zone(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        bounds.width,
        bounds.height
      );
      zone.setInteractive({ useHandCursor: true });
    } else {
      // Polygon exit bounds
      const { points } = bounds;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      const width = maxX - minX;
      const height = maxY - minY;
      zone = this.add.zone(minX + width / 2, minY + height / 2, width, height);

      const localPoints = points.map(p => new Phaser.Geom.Point(p.x - minX, p.y - minY));
      const polygon = new Phaser.Geom.Polygon(localPoints);
      zone.setInteractive({
        hitArea: polygon,
        hitAreaCallback: Phaser.Geom.Polygon.Contains,
        useHandCursor: true,
      });
    }

    // Hover events — show exit name in sentence line
    zone.on('pointerover', () => {
      this.events.emit('hotspot:hover', exit.name);
    });
    zone.on('pointerout', () => {
      this.events.emit('hotspot:leave');
    });

    // Click — trigger room transition if WALK verb is active
    zone.on('pointerdown', () => {
      if (this.isDialogueActive) return;
      const verb = this.verbSystem.getSelectedVerb();
      if (verb === Verb.WALK) {
        this.transitionToRoom(exit.targetRoomId, exit.spawnPosition);
      } else {
        this.showFeedback(`You can walk to ${exit.name}.`);
      }
    });

    return zone;
  }

  /**
   * Destroy all current exit zones
   */
  private clearExitZones(): void {
    for (const zone of this.exitZones) {
      zone.removeAllListeners();
      zone.destroy();
    }
    this.exitZones = [];
  }

  /**
   * Transition to a new room with a fade out/in effect.
   * Fade out (0.5s) → load new room → fade in (0.5s).
   */
  private transitionToRoom(targetRoomId: string, spawnPosition: { x: number; y: number }): void {
    if (this.isTransitioning) return;

    const targetRoom = getRoom(targetRoomId);
    if (!targetRoom) {
      console.warn(`Exit target room not found: ${targetRoomId}`);
      return;
    }

    this.isTransitioning = true;
    this.player.stopWalking();
    this.soundSystem.play('doorExit');

    // Fade out (500ms)
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Load the new room (clears old background, hotspots, exit zones)
      this.loadRoom(targetRoomId);

      // Set player position to spawn point in the new room
      this.player.setPosition(spawnPosition.x, spawnPosition.y);
      this.gameState.setPlayerPosition(spawnPosition.x, spawnPosition.y);

      // Fade in (500ms)
      this.cameras.main.fadeIn(500, 0, 0, 0);

      this.cameras.main.once('camerafadeincomplete', () => {
        this.isTransitioning = false;
      });
    });
  }

  /**
   * Get the current room data
   */
  getCurrentRoom(): RoomData | null {
    return this.currentRoom;
  }

  /**
   * Handle a click in the viewport area for walking.
   * Uses A* pathfinding to navigate around obstacles.
   * Only triggers when WALK verb is selected and the click is in the viewport.
   */
  private handleViewportClick(pointer: Phaser.Input.Pointer): void {
    if (this.isTransitioning) return;
    if (this.isDialogueActive) return;

    const verb = this.verbSystem.getSelectedVerb();
    if (verb !== Verb.WALK) return;

    // Only handle clicks in the viewport area (above UI)
    if (pointer.y >= VIEWPORT_HEIGHT) return;

    let targetX = pointer.x;
    let targetY = pointer.y;

    // If click is outside walkable area, clamp to nearest walkable point
    if (!this.isPointInWalkableArea(targetX, targetY)) {
      const clamped = this.clampToWalkableArea(targetX, targetY);
      if (!clamped) return;
      targetX = clamped.x;
      targetY = clamped.y;
    }

    // Use A* pathfinding to find a path
    const path = this.walkSystem.findPath(
      this.player.getX(), this.player.getY(),
      targetX, targetY
    );

    if (path && path.length >= 2) {
      this.player.followPath(path);
    } else if (path && path.length === 1) {
      // Already at destination
    } else {
      // Fallback: direct walk (no path found, shouldn't normally happen)
      this.player.walkTo(targetX, targetY);
    }
  }

  /**
   * Test whether a point is inside the current room's walkable area polygon.
   */
  private isPointInWalkableArea(x: number, y: number): boolean {
    if (!this.walkablePolygon) return false;
    return Phaser.Geom.Polygon.Contains(this.walkablePolygon, x, y);
  }

  /**
   * Find the nearest point on the walkable area boundary to the given point.
   * Projects the point onto each edge of the polygon and returns the closest result.
   */
  private clampToWalkableArea(x: number, y: number): Point | null {
    if (!this.currentRoom) return null;
    const points = this.currentRoom.walkableArea;
    if (points.length < 2) return null;

    let bestDist = Infinity;
    let bestPoint: Point | null = null;

    for (let i = 0; i < points.length; i++) {
      const a = points[i]!;
      const b = points[(i + 1) % points.length]!;

      // Project (x,y) onto segment ab
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const apx = x - a.x;
      const apy = y - a.y;
      const abLenSq = abx * abx + aby * aby;

      let t = 0;
      if (abLenSq > 0) {
        t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
      }

      const px = a.x + t * abx;
      const py = a.y + t * aby;
      const dx = x - px;
      const dy = y - py;
      const dist = dx * dx + dy * dy;

      if (dist < bestDist) {
        bestDist = dist;
        bestPoint = { x: px, y: py };
      }
    }

    return bestPoint;
  }

  update(_time: number, delta: number): void {
    // Update player walking movement
    const wasWalking = this.player.getIsWalking();
    this.player.updateMovement(delta);

    // Sync player position to GameState when walking
    if (wasWalking || this.player.getIsWalking()) {
      this.gameState.setPlayerPosition(this.player.getX(), this.player.getY());
    }

    // Play footstep sounds while walking (every 250ms)
    if (this.player.getIsWalking()) {
      this.footstepTimer += delta;
      if (this.footstepTimer >= 250) {
        this.footstepTimer = 0;
        this.soundSystem.play('footstep');
      }
    } else {
      this.footstepTimer = 0;
    }
  }
}
