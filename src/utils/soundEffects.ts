/**
 * Web Audio API synthesizer for instant whoosh and pop sound transitions
 */
class SoundEffectsManager {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // High-energy Pop / Hit sound effect
  playPopHit() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const now = ctx.currentTime;

      // Pitch sweep down: 450Hz -> 80Hz
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

      // Volume envelope: instant attack, decay in 120ms
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  // Dynamic Whoosh / Sweep transition sound
  playWhoosh() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      // White noise buffer for whoosh air sweep
      const bufferSize = ctx.sampleRate * 0.25; // 250ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Bandpass filter sweep
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 3.0;

      const now = ctx.currentTime;
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.24);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.25);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  // Subtle rhythmic beat pulse sound
  playBeatPulse() {
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const now = ctx.currentTime;

      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }
}

export const sfx = new SoundEffectsManager();
