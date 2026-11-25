/**
 * Synthesized Casino Sound Engine (Web Audio API)
 * Zero external audio files required — works reliably across all browsers.
 */

const STORAGE_KEY = 'p0ker_sound_muted';
const VOLUME_KEY = 'p0ker_sound_volume';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted: boolean = false;
  private volume: number = 0.75;

  constructor() {
    try {
      this.muted = localStorage.getItem(STORAGE_KEY) === 'true';
      const savedVol = Number(localStorage.getItem(VOLUME_KEY));
      if (!Number.isNaN(savedVol) && savedVol >= 0 && savedVol <= 1 && localStorage.getItem(VOLUME_KEY) !== null) {
        this.volume = savedVol;
      }
    } catch {
      this.muted = false;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem(VOLUME_KEY, String(this.volume));
    } catch {
      // ignore
    }
  }

  private vol(base: number): number {
    return Math.max(0.0005, base * this.volume);
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const length = Math.floor(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  public unlock(): void {
    this.getContext();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(val: boolean): void {
    this.muted = val;
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Crisp card slide + paper flick sound when dealing a card */
  public playCardDeal(delayMs = 0): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const start = ctx.currentTime + delayMs / 1000;

    // 1. Airy card slide (bandpass noise sweep)
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, start);
    filter.frequency.exponentialRampToValueAtTime(3400, start + 0.065);
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(this.vol(0.32), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.085);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(start);
    noise.stop(start + 0.095);

    // 2. Subtle crisp snap at landing
    const snap = ctx.createOscillator();
    snap.type = 'triangle';
    snap.frequency.setValueAtTime(420, start + 0.045);
    snap.frequency.exponentialRampToValueAtTime(140, start + 0.075);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.001, start + 0.045);
    snapGain.gain.linearRampToValueAtTime(0.07, start + 0.05);
    snapGain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);

    snap.connect(snapGain);
    snapGain.connect(ctx.destination);
    snap.start(start + 0.045);
    snap.stop(start + 0.085);
  }

  /** Card flip / reveal sound for community cards (Flop, Turn, River) */
  public playCardFlip(delayMs = 0): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const start = ctx.currentTime + delayMs / 1000;

    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, start);
    filter.frequency.exponentialRampToValueAtTime(4800, start + 0.07);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(this.vol(0.28), start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(start);
    noise.stop(start + 0.1);
  }

  /** Deal multiple cards with staggered timing */
  public playDealSequence(count: number, stepMs = 110, isFlip = false): void {
    if (this.muted) return;
    for (let i = 0; i < count; i++) {
      if (isFlip) {
        this.playCardFlip(i * stepMs);
      } else {
        this.playCardDeal(i * stepMs);
      }
    }
  }

  /** Ceramic poker chip clink */
  public playChipBet(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [2450, 3820, 5350];

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.012);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + idx * 0.012);
      gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), now + idx * 0.012 + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.012 + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.012);
      osc.stop(now + idx * 0.012 + 0.085);
    });
  }

  /** Soft double table knock for Check */
  public playCheck(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    [0, 0.095].forEach((offset) => {
      const t = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(175, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.05);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.065);
    });
  }

  /** Soft muted slide-away for Fold */
  public playFold(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(350, now + 0.14);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.16);
  }

  /** Warm celebratory chime when winning a pot */
  public playWin(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.085;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  /** Subtle chime when it becomes your turn */
  public playTurnAlert(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.setValueAtTime(880, t + 0.07);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }
}

export const soundEngine = new SoundEngine();
