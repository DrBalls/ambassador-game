/**
 * MusicSystem — Procedural retro-style background music using Web Audio API.
 *
 * All music is generated procedurally (no external audio files).
 * Volume and mute state persist to localStorage.
 *
 * Tracks:
 * - title: Gentle atmospheric pad with slow arpeggios (title screen)
 * - colony: Warm community melody with steady rhythm (Colony Gathering)
 * - shore: Breezy work theme with rhythmic pulse (Shore Duty Station)
 * - forbidden: Dark mysterious pad with tension (Forbidden Zone)
 * - tense: Urgent pulsing theme (dramatic moments)
 * - counting-spot: Quiet contemplative melody (Pip's Counting Spot)
 *
 * Features:
 * - Seamless looping
 * - Cross-fade between tracks on room change
 * - Independent volume control from SFX
 * - Mute toggle
 *
 * Usage:
 *   const music = new MusicSystem();
 *   music.playTrack('colony');
 *   music.crossFadeTo('forbidden', 1.0);
 *   music.setVolume(0.5);
 *   music.toggleMute();
 */

/** localStorage keys for music preferences */
const STORAGE_KEYS = {
  MUSIC_VOLUME: 'ambassador-music-volume',
  MUSIC_MUTED: 'ambassador-music-muted',
} as const;

/** Exported for MenuScene localStorage access */
export const MUSIC_STORAGE_KEYS = STORAGE_KEYS;

/** Default music volume (0-1) */
const DEFAULT_VOLUME = 0.5;

/** Cross-fade duration in seconds */
const CROSS_FADE_DURATION = 1.0;

/** Available music track names */
export type MusicTrack =
  | 'title'
  | 'colony'
  | 'shore'
  | 'forbidden'
  | 'tense'
  | 'counting-spot';

/** Map room IDs to music track names */
const ROOM_MUSIC_MAP: Record<string, MusicTrack> = {
  'counting-spot': 'counting-spot',
  'colony-gathering': 'colony',
  'shore-duty': 'shore',
  'forbidden-zone': 'forbidden',
  'test-room': 'colony',
  'test-room-2': 'colony',
};

/**
 * Get the music track for a given room ID.
 */
export function getRoomMusic(roomId: string): MusicTrack | null {
  return ROOM_MUSIC_MAP[roomId] ?? null;
}

// ─── Note frequency helpers ──────────────────────────────────

/** Note names → frequencies (octave 3-5) */
const NOTE_FREQ: Record<string, number> = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
};

/** Simple note definition for melody sequences */
interface NoteEvent {
  freq: number;      // Frequency in Hz
  duration: number;  // Duration in seconds
  delay: number;     // Start time offset from loop start
}

/** Track definition: set of oscillator layers that loop */
interface TrackLayer {
  waveType: OscillatorType;
  notes: NoteEvent[];
  gain: number;          // Base gain for this layer (0-1)
  filterFreq?: number;   // Optional lowpass filter cutoff
  filterQ?: number;      // Optional filter Q
}

interface TrackDefinition {
  layers: TrackLayer[];
  loopDuration: number;  // Total loop length in seconds
}

// ─── Track Definitions ───────────────────────────────────────

function buildTitleTrack(): TrackDefinition {
  const loopDuration = 8.0;
  const layers: TrackLayer[] = [];

  // Layer 1: Slow pad (sustained chords)
  const padNotes: NoteEvent[] = [];
  const padChords = [
    [NOTE_FREQ['E3']!, NOTE_FREQ['B3']!, NOTE_FREQ['E4']!],
    [NOTE_FREQ['C3']!, NOTE_FREQ['G3']!, NOTE_FREQ['C4']!],
    [NOTE_FREQ['A3']!, NOTE_FREQ['E4']!, NOTE_FREQ['A4']!],
    [NOTE_FREQ['D3']!, NOTE_FREQ['A3']!, NOTE_FREQ['D4']!],
  ];
  for (let i = 0; i < padChords.length; i++) {
    const chord = padChords[i]!;
    for (const freq of chord) {
      padNotes.push({ freq, duration: 1.8, delay: i * 2.0 });
    }
  }
  layers.push({ waveType: 'sine', notes: padNotes, gain: 0.06, filterFreq: 800 });

  // Layer 2: Gentle arpeggio
  const arpNotes: NoteEvent[] = [];
  const arpSequence = ['E4', 'G4', 'B4', 'E5', 'B4', 'G4', 'E4', 'D4',
                       'C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'A3', 'C4'];
  const arpInterval = loopDuration / arpSequence.length;
  for (let i = 0; i < arpSequence.length; i++) {
    const key = arpSequence[i]!;
    arpNotes.push({ freq: NOTE_FREQ[key]!, duration: arpInterval * 0.8, delay: i * arpInterval });
  }
  layers.push({ waveType: 'triangle', notes: arpNotes, gain: 0.04, filterFreq: 2000 });

  return { layers, loopDuration };
}

function buildColonyTrack(): TrackDefinition {
  const loopDuration = 4.0;
  const layers: TrackLayer[] = [];

  // Layer 1: Bass line
  const bassNotes: NoteEvent[] = [];
  const bassSequence = ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'F3', 'G3'];
  const bassInterval = loopDuration / bassSequence.length;
  for (let i = 0; i < bassSequence.length; i++) {
    const key = bassSequence[i]!;
    bassNotes.push({ freq: NOTE_FREQ[key]!, duration: bassInterval * 0.7, delay: i * bassInterval });
  }
  layers.push({ waveType: 'triangle', notes: bassNotes, gain: 0.07, filterFreq: 400 });

  // Layer 2: Melody
  const melodyNotes: NoteEvent[] = [];
  const melodySequence = ['E4', 'G4', 'C5', 'B4', 'A4', 'G4', 'E4', 'D4'];
  const melodyInterval = loopDuration / melodySequence.length;
  for (let i = 0; i < melodySequence.length; i++) {
    const key = melodySequence[i]!;
    melodyNotes.push({ freq: NOTE_FREQ[key]!, duration: melodyInterval * 0.6, delay: i * melodyInterval });
  }
  layers.push({ waveType: 'square', notes: melodyNotes, gain: 0.03, filterFreq: 1500 });

  // Layer 3: Light pad
  const padNotes: NoteEvent[] = [];
  padNotes.push({ freq: NOTE_FREQ['C4']!, duration: 1.8, delay: 0 });
  padNotes.push({ freq: NOTE_FREQ['G3']!, duration: 1.8, delay: 2.0 });
  layers.push({ waveType: 'sine', notes: padNotes, gain: 0.04, filterFreq: 600 });

  return { layers, loopDuration };
}

function buildShoreTrack(): TrackDefinition {
  const loopDuration = 4.0;
  const layers: TrackLayer[] = [];

  // Layer 1: Rhythmic bass pulse
  const bassNotes: NoteEvent[] = [];
  const bassSequence = ['D3', 'D3', 'A3', 'D3', 'F3', 'F3', 'C3', 'D3'];
  const bassInterval = loopDuration / bassSequence.length;
  for (let i = 0; i < bassSequence.length; i++) {
    const key = bassSequence[i]!;
    bassNotes.push({ freq: NOTE_FREQ[key]!, duration: bassInterval * 0.5, delay: i * bassInterval });
  }
  layers.push({ waveType: 'triangle', notes: bassNotes, gain: 0.06, filterFreq: 350 });

  // Layer 2: Breezy melody
  const melodyNotes: NoteEvent[] = [];
  const melodySequence = ['D4', 'F4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];
  const melodyInterval = loopDuration / melodySequence.length;
  for (let i = 0; i < melodySequence.length; i++) {
    const key = melodySequence[i]!;
    melodyNotes.push({ freq: NOTE_FREQ[key]!, duration: melodyInterval * 0.6, delay: i * melodyInterval });
  }
  layers.push({ waveType: 'square', notes: melodyNotes, gain: 0.025, filterFreq: 1400 });

  // Layer 3: Offbeat accent
  const accentNotes: NoteEvent[] = [];
  accentNotes.push({ freq: NOTE_FREQ['A4']!, duration: 0.1, delay: 0.25 });
  accentNotes.push({ freq: NOTE_FREQ['F4']!, duration: 0.1, delay: 1.25 });
  accentNotes.push({ freq: NOTE_FREQ['G4']!, duration: 0.1, delay: 2.25 });
  accentNotes.push({ freq: NOTE_FREQ['E4']!, duration: 0.1, delay: 3.25 });
  layers.push({ waveType: 'square', notes: accentNotes, gain: 0.015, filterFreq: 2000 });

  return { layers, loopDuration };
}

function buildForbiddenTrack(): TrackDefinition {
  const loopDuration = 6.0;
  const layers: TrackLayer[] = [];

  // Layer 1: Dark drone
  const droneNotes: NoteEvent[] = [];
  droneNotes.push({ freq: NOTE_FREQ['C3']!, duration: 5.5, delay: 0 });
  droneNotes.push({ freq: NOTE_FREQ['D3']! * 0.98, duration: 5.5, delay: 0.1 }); // Slight detune for dissonance
  layers.push({ waveType: 'sawtooth', notes: droneNotes, gain: 0.03, filterFreq: 250, filterQ: 2 });

  // Layer 2: Eerie high notes
  const eerieNotes: NoteEvent[] = [];
  eerieNotes.push({ freq: NOTE_FREQ['E5']!, duration: 1.2, delay: 0.5 });
  eerieNotes.push({ freq: NOTE_FREQ['D5']!, duration: 0.8, delay: 2.0 });
  eerieNotes.push({ freq: NOTE_FREQ['C5']!, duration: 1.5, delay: 3.5 });
  layers.push({ waveType: 'sine', notes: eerieNotes, gain: 0.025, filterFreq: 3000 });

  // Layer 3: Pulse — creates tension
  const pulseNotes: NoteEvent[] = [];
  const pulseFreq = NOTE_FREQ['C4']!;
  for (let i = 0; i < 12; i++) {
    pulseNotes.push({ freq: pulseFreq, duration: 0.12, delay: i * 0.5 });
  }
  layers.push({ waveType: 'square', notes: pulseNotes, gain: 0.015, filterFreq: 500 });

  return { layers, loopDuration };
}

function buildTenseTrack(): TrackDefinition {
  const loopDuration = 2.0;
  const layers: TrackLayer[] = [];

  // Layer 1: Urgent bass pulse
  const bassNotes: NoteEvent[] = [];
  for (let i = 0; i < 8; i++) {
    bassNotes.push({ freq: NOTE_FREQ['C3']!, duration: 0.1, delay: i * 0.25 });
  }
  layers.push({ waveType: 'square', notes: bassNotes, gain: 0.06, filterFreq: 300 });

  // Layer 2: Rising tension notes
  const tensionNotes: NoteEvent[] = [];
  tensionNotes.push({ freq: NOTE_FREQ['E4']!, duration: 0.4, delay: 0 });
  tensionNotes.push({ freq: NOTE_FREQ['F4']!, duration: 0.4, delay: 0.5 });
  tensionNotes.push({ freq: NOTE_FREQ['G4']!, duration: 0.4, delay: 1.0 });
  tensionNotes.push({ freq: NOTE_FREQ['A4']!, duration: 0.4, delay: 1.5 });
  layers.push({ waveType: 'sawtooth', notes: tensionNotes, gain: 0.03, filterFreq: 800 });

  return { layers, loopDuration };
}

function buildCountingSpotTrack(): TrackDefinition {
  const loopDuration = 8.0;
  const layers: TrackLayer[] = [];

  // Layer 1: Soft wind-like pad
  const padNotes: NoteEvent[] = [];
  padNotes.push({ freq: NOTE_FREQ['E3']!, duration: 3.5, delay: 0 });
  padNotes.push({ freq: NOTE_FREQ['D3']!, duration: 3.5, delay: 4.0 });
  layers.push({ waveType: 'sine', notes: padNotes, gain: 0.05, filterFreq: 500 });

  // Layer 2: Contemplative melody (sparse, quiet)
  const melodyNotes: NoteEvent[] = [];
  const melodySequence = ['E4', 'G4', 'B4', 'A4', 'E4', 'D4', 'E4', 'G4'];
  const melodyInterval = loopDuration / melodySequence.length;
  for (let i = 0; i < melodySequence.length; i++) {
    const key = melodySequence[i]!;
    melodyNotes.push({ freq: NOTE_FREQ[key]!, duration: melodyInterval * 0.5, delay: i * melodyInterval });
  }
  layers.push({ waveType: 'triangle', notes: melodyNotes, gain: 0.03, filterFreq: 1200 });

  // Layer 3: Very soft high shimmer (stars)
  const shimmerNotes: NoteEvent[] = [];
  shimmerNotes.push({ freq: NOTE_FREQ['E5']!, duration: 0.6, delay: 1.0 });
  shimmerNotes.push({ freq: NOTE_FREQ['B5']!, duration: 0.4, delay: 3.5 });
  shimmerNotes.push({ freq: NOTE_FREQ['G5']!, duration: 0.5, delay: 6.0 });
  layers.push({ waveType: 'sine', notes: shimmerNotes, gain: 0.015, filterFreq: 4000 });

  return { layers, loopDuration };
}

/** Build a track definition by name */
function getTrackDefinition(track: MusicTrack): TrackDefinition {
  switch (track) {
    case 'title': return buildTitleTrack();
    case 'colony': return buildColonyTrack();
    case 'shore': return buildShoreTrack();
    case 'forbidden': return buildForbiddenTrack();
    case 'tense': return buildTenseTrack();
    case 'counting-spot': return buildCountingSpotTrack();
  }
}

// ─── Active track state (oscillators + gain for one playing track) ────

interface ActiveTrack {
  trackName: MusicTrack;
  masterGain: GainNode;
  loopTimer: number; // setInterval ID
  scheduledUntil: number; // AudioContext time up to which notes are scheduled
}

/**
 * MusicSystem — Generates and plays procedural retro-style background music.
 */
export class MusicSystem {
  private audioContext: AudioContext | null = null;
  private volume: number;
  private muted: boolean;
  private activeTrack: ActiveTrack | null = null;
  private fadingOutTrack: ActiveTrack | null = null;

  constructor() {
    this.volume = this.loadVolume();
    this.muted = this.loadMuted();
    this.initAudio();
  }

  // ─── Playback ──────────────────────────────────────────────

  /**
   * Play a music track immediately (stops any currently playing track).
   */
  playTrack(track: MusicTrack): void {
    if (this.activeTrack?.trackName === track) return; // Already playing

    this.stopTrack();
    if (this.muted) return;
    if (!this.ensureAudioContext()) return;

    this.activeTrack = this.startTrack(track);
  }

  /**
   * Cross-fade from the current track to a new track.
   * If no track is playing, just starts the new one.
   */
  crossFadeTo(track: MusicTrack, duration: number = CROSS_FADE_DURATION): void {
    if (this.activeTrack?.trackName === track) return; // Already playing

    if (!this.activeTrack || this.muted) {
      // No track playing — just start fresh
      this.stopTrack();
      if (!this.muted && this.ensureAudioContext()) {
        this.activeTrack = this.startTrack(track);
      }
      return;
    }

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // Clean up any previous fading-out track
    if (this.fadingOutTrack) {
      this.cleanupTrack(this.fadingOutTrack);
      this.fadingOutTrack = null;
    }

    // Fade out the old track
    this.fadingOutTrack = this.activeTrack;
    this.fadingOutTrack.masterGain.gain.setValueAtTime(
      this.fadingOutTrack.masterGain.gain.value, now
    );
    this.fadingOutTrack.masterGain.gain.linearRampToValueAtTime(0, now + duration);

    // Clean up old track after fade completes
    const fadingRef = this.fadingOutTrack;
    setTimeout(() => {
      if (this.fadingOutTrack === fadingRef) {
        this.cleanupTrack(fadingRef);
        this.fadingOutTrack = null;
      }
    }, duration * 1000 + 100);

    // Start new track with fade in
    this.activeTrack = this.startTrack(track, duration);
  }

  /**
   * Stop all music playback.
   */
  stopTrack(): void {
    if (this.activeTrack) {
      this.cleanupTrack(this.activeTrack);
      this.activeTrack = null;
    }
    if (this.fadingOutTrack) {
      this.cleanupTrack(this.fadingOutTrack);
      this.fadingOutTrack = null;
    }
  }

  /**
   * Get the currently playing track name, or null.
   */
  getCurrentTrack(): MusicTrack | null {
    return this.activeTrack?.trackName ?? null;
  }

  // ─── Volume Control ────────────────────────────────────────

  getVolume(): number {
    return this.volume;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem(STORAGE_KEYS.MUSIC_VOLUME, String(this.volume));
    } catch { /* ignore quota errors */ }

    // Update active track gain in real-time
    if (this.activeTrack && this.audioContext) {
      const effectiveGain = this.muted ? 0 : this.volume;
      this.activeTrack.masterGain.gain.setValueAtTime(
        effectiveGain, this.audioContext.currentTime
      );
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(STORAGE_KEYS.MUSIC_MUTED, this.muted ? '1' : '0');
    } catch { /* ignore */ }

    if (this.muted) {
      // Mute: fade to 0 quickly
      if (this.activeTrack && this.audioContext) {
        const now = this.audioContext.currentTime;
        this.activeTrack.masterGain.gain.setValueAtTime(
          this.activeTrack.masterGain.gain.value, now
        );
        this.activeTrack.masterGain.gain.linearRampToValueAtTime(0, now + 0.1);
      }
    } else {
      // Unmute: fade volume back in
      if (this.activeTrack && this.audioContext) {
        const now = this.audioContext.currentTime;
        this.activeTrack.masterGain.gain.setValueAtTime(0, now);
        this.activeTrack.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.1);
      }
    }

    return this.muted;
  }

  setMuted(muted: boolean): void {
    if (this.muted === muted) return;
    this.toggleMute();
  }

  // ─── Audio Context ─────────────────────────────────────────

  private initAudio(): void {
    try {
      this.audioContext = new AudioContext();
    } catch {
      console.warn('MusicSystem: Web Audio API not available');
    }
  }

  private ensureAudioContext(): boolean {
    if (!this.audioContext) this.initAudio();
    if (!this.audioContext) return false;

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }
    return true;
  }

  // ─── Track Engine ──────────────────────────────────────────

  /**
   * Start playing a track, scheduling notes in a loop.
   * Returns the ActiveTrack handle.
   */
  private startTrack(track: MusicTrack, fadeInDuration?: number): ActiveTrack {
    const ctx = this.audioContext!;
    const def = getTrackDefinition(track);
    const now = ctx.currentTime;

    // Master gain node for this track
    const masterGain = ctx.createGain();
    if (fadeInDuration) {
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(this.volume, now + fadeInDuration);
    } else {
      masterGain.gain.setValueAtTime(this.volume, now);
    }
    masterGain.connect(ctx.destination);

    // Schedule first few loops ahead
    let scheduledUntil = now;
    const scheduleAhead = () => {
      const lookAhead = ctx.currentTime + 2.0; // Schedule 2 seconds ahead
      while (scheduledUntil < lookAhead) {
        this.scheduleLoop(ctx, def, masterGain, scheduledUntil);
        scheduledUntil += def.loopDuration;
      }
    };

    scheduleAhead();

    // Keep scheduling ahead via interval
    const loopTimer = window.setInterval(() => {
      scheduleAhead();
    }, 500);

    return {
      trackName: track,
      masterGain,
      loopTimer,
      scheduledUntil,
    };
  }

  /**
   * Schedule one loop iteration of the track definition.
   */
  private scheduleLoop(
    ctx: AudioContext,
    def: TrackDefinition,
    masterGain: GainNode,
    loopStartTime: number
  ): void {
    for (const layer of def.layers) {
      for (const note of layer.notes) {
        const startTime = loopStartTime + note.delay;

        // Skip notes that are in the past
        if (startTime + note.duration < ctx.currentTime) continue;

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = layer.waveType;
        osc.frequency.setValueAtTime(note.freq, startTime);

        // Envelope: quick attack, sustain, quick release
        const attackTime = Math.min(0.03, note.duration * 0.1);
        const releaseTime = Math.min(0.08, note.duration * 0.3);
        const sustainEnd = startTime + note.duration - releaseTime;

        noteGain.gain.setValueAtTime(0, startTime);
        noteGain.gain.linearRampToValueAtTime(layer.gain, startTime + attackTime);
        noteGain.gain.setValueAtTime(layer.gain, sustainEnd);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);

        // Optional lowpass filter
        if (layer.filterFreq) {
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(layer.filterFreq, startTime);
          if (layer.filterQ) {
            filter.Q.setValueAtTime(layer.filterQ, startTime);
          }
          osc.connect(filter);
          filter.connect(noteGain);
        } else {
          osc.connect(noteGain);
        }

        noteGain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + note.duration + 0.01);
      }
    }
  }

  /**
   * Clean up a track: stop scheduling and disconnect.
   */
  private cleanupTrack(track: ActiveTrack): void {
    clearInterval(track.loopTimer);
    try {
      track.masterGain.disconnect();
    } catch {
      // Already disconnected
    }
  }

  // ─── Persistence ───────────────────────────────────────────

  private loadVolume(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME);
      if (stored !== null) {
        const val = parseFloat(stored);
        if (!isNaN(val)) return Math.max(0, Math.min(1, val));
      }
    } catch { /* ignore */ }
    return DEFAULT_VOLUME;
  }

  private loadMuted(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MUSIC_MUTED);
      return stored === '1';
    } catch { /* ignore */ }
    return false;
  }

  // ─── Cleanup ───────────────────────────────────────────────

  destroy(): void {
    this.stopTrack();
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}
