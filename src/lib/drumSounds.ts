import type { Lane } from "../music/drums";

// Mga tunog ng drums na ginagawa ng browser mismo (Web Audio), walang audio file na kailangan.
export class DrumSounds {
  private ctx: AudioContext;
  private out: AudioNode;
  private noise: AudioBuffer;

  // Puwedeng ibigay ang AudioContext at output ng banda, para iisang orasan lang
  constructor(ctx?: AudioContext, out?: AudioNode) {
    this.ctx = ctx ?? new AudioContext();
    this.out = out ?? this.ctx.destination;
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  // Ang orasan ng audio, sa segundo. Mas eksakto ito kaysa sa orasan ng screen.
  get now(): number {
    return this.ctx.currentTime;
  }

  resume() {
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  close() {
    void this.ctx.close();
  }

  private fade(gain: GainNode, t: number, peak: number, length: number) {
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + length);
  }

  private hiss(t: number, length: number, type: BiquadFilterType, freq: number, peak: number) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    this.fade(gain, t, peak, length);
    src.connect(filter).connect(gain).connect(this.out);
    src.start(t);
    src.stop(t + length + 0.02);
  }

  private tone(t: number, type: OscillatorType, from: number, to: number, length: number, peak: number) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + length * 0.4);
    const gain = this.ctx.createGain();
    this.fade(gain, t, peak, length);
    osc.connect(gain).connect(this.out);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }

  // Itakda ang tunog sa eksaktong oras (`when`, ayon sa orasan ng audio)
  play(lane: Lane, accent = false, when = this.ctx.currentTime) {
    const t = Math.max(when, this.ctx.currentTime);
    if (lane === "kick") this.tone(t, "sine", 140, 42, 0.42, 1);
    if (lane === "snare") {
      this.hiss(t, 0.2, "highpass", 1200, 0.55);
      this.tone(t, "triangle", 190, 170, 0.11, 0.45);
    }
    if (lane === "hihat") this.hiss(t, 0.05, "highpass", 7500, accent ? 0.32 : 0.2);
    if (lane === "ride") this.hiss(t, 0.35, "bandpass", 6000, accent ? 0.22 : 0.15);
    if (lane === "crash") this.hiss(t, 1.2, "highpass", 4000, 0.35);
  }
}
