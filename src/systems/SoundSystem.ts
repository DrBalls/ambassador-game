/**
 * SoundSystem — Centralized 8-bit style sound effects using Web Audio API.
 *
 * All sounds are procedurally generated (no external audio files).
 * Volume and mute state persist to localStorage.
 *
 * Sound effects:
 * - footstep: soft tap (walking)
 * - itemPickup: ascending chirp (collecting items)
 * - uiClick: short click/blip (verb/button selection)
 * - dialogueBlip: character voice blip (typewriter text)
 * - doorExit: whoosh/sweep (room transition)
 * - puzzleSuccess: triumphant ascending arpeggio
 * - puzzleFail: descending buzz
 *
 * Usage:
 *   const sound = new SoundSystem(scene);
 *   sound.play('uiClick');
 *   sound.setVolume(0.5);
 *   sound.toggleMute();
 */

/** localStorage keys for audio preferences */
const STORAGE_KEYS = {
  SFX_VOLUME: 'ambassador-sfx-volume',
  SFX_MUTED: 'ambassador-sfx-muted',
} as const;

/** Default volume (0-1) */
const DEFAULT_VOLUME = 0.7;

/** Available sound effect names */
export type SoundEffect =
  | 'footstep'
  | 'itemPickup'
  | 'uiClick'
  | 'dialogueBlip'
  | 'doorExit'
  | 'puzzleSuccess'
  | 'puzzleFail';

/**
 * SoundSystem — Generates and plays 8-bit style sound effects.
 */
export class SoundSystem {
  private audioContext: AudioContext | null = null;
  private volume: number;
  private muted: boolean;
  private footstepAlternate = false;

  constructor(_scene: Phaser.Scene) {
    this.volume = this.loadVolume();
    this.muted = this.loadMuted();
    this.initAudio();
  }

  /**
   * Play a named sound effect.
   */
  play(effect: SoundEffect): void {
    if (this.muted || this.volume <= 0) return;
    if (!this.audioContext) this.initAudio();
    if (!this.audioContext) return;

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }

    switch (effect) {
      case 'footstep':
        this.playFootstep();
        break;
      case 'itemPickup':
        this.playItemPickup();
        break;
      case 'uiClick':
        this.playUIClick();
        break;
      case 'dialogueBlip':
        this.playDialogueBlip();
        break;
      case 'doorExit':
        this.playDoorExit();
        break;
      case 'puzzleSuccess':
        this.playPuzzleSuccess();
        break;
      case 'puzzleFail':
        this.playPuzzleFail();
        break;
    }
  }

  // ─── Volume Control ──────────────────────────────────────────

  /**
   * Get the current SFX volume (0-1).
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Set the SFX volume (0-1). Persists to localStorage.
   */
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem(STORAGE_KEYS.SFX_VOLUME, String(this.volume));
    } catch { /* ignore quota errors */ }
  }

  /**
   * Whether SFX are currently muted.
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Toggle mute state. Returns the new muted value. Persists to localStorage.
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(STORAGE_KEYS.SFX_MUTED, this.muted ? '1' : '0');
    } catch { /* ignore */ }
    return this.muted;
  }

  /**
   * Set mute state directly. Persists to localStorage.
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem(STORAGE_KEYS.SFX_MUTED, this.muted ? '1' : '0');
    } catch { /* ignore */ }
  }

  // ─── Audio Context ───────────────────────────────────────────

  private initAudio(): void {
    try {
      this.audioContext = new AudioContext();
    } catch {
      console.warn('SoundSystem: Web Audio API not available');
    }
  }

  // ─── Sound Effect Implementations ────────────────────────────

  /**
   * Footstep: short noise burst with bandpass filter — alternating pitch.
   */
  private playFootstep(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const osc = ctx.createOscillator();

    // Alternate between two slightly different pitches for left/right foot
    this.footstepAlternate = !this.footstepAlternate;
    const freq = this.footstepAlternate ? 180 : 160;

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(2, now);

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Item pickup: ascending two-note chirp.
   */
  private playItemPickup(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Note 1
    this.playNote(ctx, now, 523.25, 0.08, 'square', 0.2); // C5
    // Note 2 (higher)
    this.playNote(ctx, now + 0.08, 783.99, 0.12, 'square', 0.2); // G5
  }

  /**
   * UI click: short blip.
   */
  private playUIClick(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Dialogue blip: very short pitched blip for typewriter text.
   */
  private playDialogueBlip(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Slight random pitch variation for natural feel
    const baseFreq = 440 + (Math.random() * 80 - 40);

    osc.type = 'square';
    osc.frequency.setValueAtTime(baseFreq, now);

    gain.gain.setValueAtTime(0.06 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Door/exit: sweeping whoosh using filtered noise-like oscillator.
   */
  private playDoorExit(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.linearRampToValueAtTime(0.15 * this.volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Puzzle success: triumphant ascending three-note arpeggio.
   */
  private playPuzzleSuccess(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    this.playNote(ctx, now, 523.25, 0.12, 'square', 0.25);        // C5
    this.playNote(ctx, now + 0.12, 659.25, 0.12, 'square', 0.25); // E5
    this.playNote(ctx, now + 0.24, 783.99, 0.2, 'square', 0.25);  // G5
  }

  /**
   * Puzzle fail: descending buzz.
   */
  private playPuzzleFail(): void {
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.linearRampToValueAtTime(0.12 * this.volume, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // ─── Helpers ─────────────────────────────────────────────────

  /**
   * Play a single note at a given time offset.
   */
  private playNote(
    ctx: AudioContext,
    startTime: number,
    frequency: number,
    duration: number,
    waveType: OscillatorType,
    peakGain: number,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain * this.volume, startTime + 0.01);
    gain.gain.linearRampToValueAtTime(peakGain * this.volume, startTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // ─── Persistence ─────────────────────────────────────────────

  private loadVolume(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SFX_VOLUME);
      if (stored !== null) {
        const val = parseFloat(stored);
        if (!isNaN(val)) return Math.max(0, Math.min(1, val));
      }
    } catch { /* ignore */ }
    return DEFAULT_VOLUME;
  }

  private loadMuted(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SFX_MUTED);
      return stored === '1';
    } catch { /* ignore */ }
    return false;
  }

  // ─── Cleanup ─────────────────────────────────────────────────

  destroy(): void {
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}
