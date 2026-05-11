type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";

interface ToneSpec {
  freq: number;
  type?: OscillatorType;
  gainPeak?: number;
  attack?: number;
  sustain?: number;
  release?: number;
  freqEnd?: number;
}

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientNodes: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private ambientSwell1: OscillatorNode | null = null;
  private ambientSwell2: OscillatorNode | null = null;
  private ambientShimmer: OscillatorNode | null = null;
  private ambientShimmerGain: GainNode | null = null;
  private _sfxVol = 0.55;
  private _bgmVol = 0.3;
  private _enabled = true;

  init() {
    if (typeof window === "undefined") return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._sfxVol;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable (SSR or restricted env)
    }
  }

  resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume();
  }

  get enabled() { return this._enabled; }

  toggle() {
    this._enabled = !this._enabled;
    if (this.masterGain) this.masterGain.gain.value = this._enabled ? this._sfxVol : 0;
    if (this.ambientGain) this.ambientGain.gain.value = this._enabled ? this._bgmVol : 0;
    return this._enabled;
  }

  private tone(spec: ToneSpec, startOffset = 0) {
    if (!this.ctx || !this.masterGain || !this._enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + startOffset;
    const attack = spec.attack ?? 0.01;
    const sustain = spec.sustain ?? 0.1;
    const release = spec.release ?? 0.08;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.type ?? "sine";
    osc.frequency.setValueAtTime(spec.freq, t);
    if (spec.freqEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(spec.freqEnd, t + attack + sustain);
    }

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(spec.gainPeak ?? 0.4, t + attack);
    gain.gain.setValueAtTime(spec.gainPeak ?? 0.4, t + attack + sustain);
    gain.gain.linearRampToValueAtTime(0, t + attack + sustain + release);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + attack + sustain + release + 0.01);
  }

  // SFX

  playCast() {
    this.tone({ freq: 320, freqEnd: 160, type: "sawtooth", gainPeak: 0.18, attack: 0.01, sustain: 0.18, release: 0.12 });
    this.tone({ freq: 180, freqEnd: 90, type: "sine", gainPeak: 0.1, attack: 0.02, sustain: 0.22, release: 0.15 }, 0.04);
  }

  playBite() {
    this.tone({ freq: 520, type: "square", gainPeak: 0.28, attack: 0.005, sustain: 0.04, release: 0.06 });
    this.tone({ freq: 380, type: "triangle", gainPeak: 0.2, attack: 0.005, sustain: 0.03, release: 0.05 }, 0.05);
  }

  playPullSuccess() {
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      this.tone({ freq, type: "triangle", gainPeak: 0.22, attack: 0.01, sustain: 0.06, release: 0.07 }, i * 0.09);
    });
  }

  playPullFail() {
    this.tone({ freq: 220, freqEnd: 110, type: "sawtooth", gainPeak: 0.25, attack: 0.01, sustain: 0.15, release: 0.1 });
  }

  playCatchSuccess() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.tone({ freq, type: "triangle", gainPeak: 0.28, attack: 0.01, sustain: 0.1, release: 0.1 }, i * 0.1);
    });
  }

  playCatchRare() {
    // Epic multi-layer fanfare for legend+
    const base = [523, 659, 784, 1047];
    base.forEach((freq, i) => {
      this.tone({ freq, type: "sine", gainPeak: 0.32, attack: 0.02, sustain: 0.18, release: 0.2 }, i * 0.12);
    });
    // Shimmer layer
    [1568, 2093].forEach((freq, i) => {
      this.tone({ freq, type: "sine", gainPeak: 0.14, attack: 0.03, sustain: 0.3, release: 0.4 }, 0.3 + i * 0.15);
    });
    // Sub bass impact
    this.tone({ freq: 80, freqEnd: 40, type: "sine", gainPeak: 0.35, attack: 0.005, sustain: 0.08, release: 0.25 });
  }

  playMiss() {
    this.tone({ freq: 250, freqEnd: 80, type: "sawtooth", gainPeak: 0.22, attack: 0.01, sustain: 0.2, release: 0.18 });
    this.tone({ freq: 180, freqEnd: 60, type: "square", gainPeak: 0.12, attack: 0.02, sustain: 0.22, release: 0.2 }, 0.06);
  }

  playRareAlert() {
    this.tone({ freq: 400, freqEnd: 800, type: "sine", gainPeak: 0.2, attack: 0.04, sustain: 0.12, release: 0.2 });
    this.tone({ freq: 600, freqEnd: 1200, type: "sine", gainPeak: 0.14, attack: 0.04, sustain: 0.12, release: 0.2 }, 0.18);
  }

  playButtonClick() {
    this.tone({ freq: 660, type: "triangle", gainPeak: 0.18, attack: 0.005, sustain: 0.025, release: 0.04 });
  }

  // BGM: ocean ambient (layered low-freq oscillators + filtered noise)

  startOceanAmbient() {
    if (!this.ctx || this.ambientNodes.length > 0) return;
    const ctx = this.ctx;

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = this._enabled ? this._bgmVol : 0;
    this.ambientGain.connect(ctx.destination);

    // Wave layer 1: deep swell
    const swell1 = ctx.createOscillator();
    swell1.type = "sine";
    swell1.frequency.value = 55;
    const swell1Gain = ctx.createGain();
    swell1Gain.gain.value = 0.18;
    swell1.connect(swell1Gain);
    swell1Gain.connect(this.ambientGain);
    swell1.start();

    // Wave layer 2: mid swell with slow LFO
    const swell2 = ctx.createOscillator();
    swell2.type = "sine";
    swell2.frequency.value = 82;
    const swell2Gain = ctx.createGain();
    swell2Gain.gain.value = 0.1;
    swell2.connect(swell2Gain);
    swell2Gain.connect(this.ambientGain);
    swell2.start();

    // LFO to modulate swell amplitude (0.08 Hz = ~12s period)
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(swell1Gain.gain);
    lfo.start();

    // High shimmer (distant seagulls / breeze)
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = 1800;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.012;
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.ambientGain);
    shimmer.start();

    this.ambientSwell1 = swell1;
    this.ambientSwell2 = swell2;
    this.ambientShimmer = shimmer;
    this.ambientShimmerGain = shimmerGain;
    this.ambientNodes = [swell1, swell2, lfo, shimmer];
  }

  setTimePeriod(period: string) {
    if (!this.ctx || !this.ambientSwell1 || !this.ambientSwell2 || !this.ambientShimmer) return;
    const t = this.ctx.currentTime + 4; // 4s crossfade
    const settings: Record<string, { swell1: number; swell2: number; shimmerFreq: number; shimmerGain: number }> = {
      dawn:      { swell1: 45,  swell2: 68,  shimmerFreq: 1100, shimmerGain: 0.008 },
      morning:   { swell1: 55,  swell2: 82,  shimmerFreq: 1800, shimmerGain: 0.012 },
      noon:      { swell1: 65,  swell2: 96,  shimmerFreq: 2300, shimmerGain: 0.016 },
      dusk:      { swell1: 50,  swell2: 74,  shimmerFreq: 900,  shimmerGain: 0.009 },
      night:     { swell1: 42,  swell2: 62,  shimmerFreq: 500,  shimmerGain: 0.005 },
      latenight: { swell1: 36,  swell2: 52,  shimmerFreq: 280,  shimmerGain: 0.002 },
    };
    const s = settings[period] ?? settings.morning;
    this.ambientSwell1.frequency.linearRampToValueAtTime(s.swell1, t);
    this.ambientSwell2.frequency.linearRampToValueAtTime(s.swell2, t);
    this.ambientShimmer.frequency.linearRampToValueAtTime(s.shimmerFreq, t);
    if (this.ambientShimmerGain) {
      this.ambientShimmerGain.gain.linearRampToValueAtTime(s.shimmerGain, t);
    }
  }

  stopOceanAmbient() {
    for (const node of this.ambientNodes) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    this.ambientNodes = [];
    this.ambientGain = null;
  }

  destroy() {
    this.stopOceanAmbient();
    this.ctx?.close();
    this.ctx = null;
  }
}
