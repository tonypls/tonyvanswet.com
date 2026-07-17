// Tiny synthesized sound effects — no audio assets, everything is generated
// with the Web Audio API. The context is created lazily on the first call
// (which always follows a user gesture: Enter key or mouse click).

export class SoundFX {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.25;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private burst(opts: {
    seconds: number;
    from: number;
    to?: number;
    type?: OscillatorType;
    noise?: boolean;
    lowpass?: number;
    gain?: number;
  }): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(opts.gain ?? 1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + opts.seconds);
    let node: AudioNode = g;
    if (opts.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = opts.lowpass;
      f.connect(g);
      node = f;
    }
    if (opts.noise) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(ctx, opts.seconds);
      src.connect(node);
      node.connect(this.master);
      src.start(t);
      src.stop(t + opts.seconds);
    } else {
      const osc = ctx.createOscillator();
      osc.type = opts.type ?? "square";
      osc.frequency.setValueAtTime(opts.from, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to ?? opts.from), t + opts.seconds);
      osc.connect(node);
      node.connect(this.master);
      osc.start(t);
      osc.stop(t + opts.seconds);
    }
  }

  shot(): void {
    this.burst({ seconds: 0.14, from: 900, to: 120, noise: true, lowpass: 3200, gain: 0.9 });
  }

  fireball(): void {
    this.burst({ seconds: 0.3, from: 400, to: 1400, noise: true, lowpass: 2000, gain: 0.5 });
  }

  explosion(): void {
    this.burst({ seconds: 0.5, from: 200, to: 40, noise: true, lowpass: 900, gain: 1 });
  }

  pickup(): void {
    this.burst({ seconds: 0.08, from: 660, to: 990, type: "square", gain: 0.4 });
  }

  bonus(): void {
    this.burst({ seconds: 0.06, from: 990, to: 1480, type: "square", gain: 0.3 });
  }

  hurt(): void {
    this.burst({ seconds: 0.18, from: 220, to: 90, type: "sawtooth", gain: 0.6 });
  }

  enemyDie(): void {
    this.burst({ seconds: 0.25, from: 500, to: 60, type: "square", gain: 0.45 });
  }

  playerDie(): void {
    this.burst({ seconds: 0.9, from: 300, to: 30, type: "sawtooth", gain: 0.8 });
  }

  door(): void {
    this.burst({ seconds: 0.35, from: 150, to: 500, noise: true, lowpass: 1200, gain: 0.35 });
  }

  switchClick(): void {
    this.burst({ seconds: 0.05, from: 1200, to: 700, type: "square", gain: 0.4 });
  }

  secret(): void {
    this.burst({ seconds: 0.12, from: 440, to: 880, type: "triangle", gain: 0.5 });
    window.setTimeout(() => this.burst({ seconds: 0.18, from: 660, to: 1320, type: "triangle", gain: 0.5 }), 120);
  }
}
