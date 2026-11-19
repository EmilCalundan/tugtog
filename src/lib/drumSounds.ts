import type { Lane } from "../music/drums";

// Mga tunog ng drums na ginagawa ng browser mismo (Web Audio), walang audio file na kailangan.
export class DrumSounds {
  private ctx: AudioContext;
  private noise: AudioBuffer;
  private metal: AudioBuffer;
  private lanes: Record<Lane, AudioNode>;

  // Puwedeng ibigay ang AudioContext at output ng banda, para iisang orasan lang
  constructor(ctx?: AudioContext, out?: AudioNode) {
    this.ctx = ctx ?? new AudioContext();
    // Kapag mag-isa (walang banda), may sariling hinang volume para hindi pumutok kapag sabay ang kick at crash
    let dest: AudioNode;
    if (out) dest = out;
    else {
      const solo = this.ctx.createGain();
      solo.gain.value = 0.7;
      solo.connect(this.ctx.destination);
      dest = solo;
    }
    const rate = this.ctx.sampleRate;

    this.noise = this.ctx.createBuffer(1, rate, rate);
    const n = this.noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;

    // Tunog-metal ng cymbal: anim na square wave na hindi magkakatugma (gaya ng sa TR-808)
    this.metal = this.ctx.createBuffer(1, rate * 2, rate);
    const m = this.metal.getChannelData(0);
    const ratios = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0].map((f) => f * 1.7);
    for (let i = 0; i < m.length; i++) {
      const t = i / rate;
      let sum = 0;
      for (const f of ratios) sum += Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1;
      m[i] = sum / ratios.length + (Math.random() * 2 - 1) * 0.15;
    }

    // Puwesto ng bawat bahagi ng drums, mula sa pananaw ng nakikinig
    const place = (pan: number) => {
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      p.connect(dest);
      return p;
    };
    this.lanes = { kick: place(0), snare: place(0.05), hihat: place(0.32), ride: place(-0.3), crash: place(-0.22) };
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

  private env(t: number, peak: number, length: number): GainNode {
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + length);
    return gain;
  }

  // Ingay o metal na dinadaan sa mga filter
  private hit(lane: Lane, buffer: AudioBuffer, t: number, length: number, peak: number, filters: [BiquadFilterType, number, number?][]) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    let node: AudioNode = src;
    for (const [type, f, q] of filters) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = f;
      if (q !== undefined) filter.Q.value = q;
      node.connect(filter);
      node = filter;
    }
    node.connect(this.env(t, peak, length)).connect(this.lanes[lane]);
    src.start(t, Math.random() * 0.5);
    src.stop(t + length + 0.02);
  }

  private tone(lane: Lane, t: number, from: number, to: number, glide: number, length: number, peak: number) {
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + glide);
    osc.connect(this.env(t, peak, length)).connect(this.lanes[lane]);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }

  // Itakda ang tunog sa eksaktong oras (`when`, ayon sa orasan ng audio)
  play(lane: Lane, accent = false, when = this.ctx.currentTime) {
    const t = Math.max(when, this.ctx.currentTime);
    // Hindi pare-pareho ang lakas ng bawat palo, gaya ng totoong drummer
    const v = (accent ? 1.1 : 1) * (0.92 + Math.random() * 0.12);
    if (lane === "kick") {
      // Malalim na "boom" na bumababa ang tono, at maikling "click" ng beater
      this.tone("kick", t, 150, 48, 0.06, 0.45, 0.95 * v);
      this.hit("kick", this.noise, t, 0.012, 0.22 * v, [["highpass", 2500]]);
    }
    if (lane === "snare") {
      // Katawan ng tambol at ang kuwerdas (snares) sa ilalim
      this.tone("snare", t, 200, 180, 0.03, 0.09, 0.4 * v);
      this.tone("snare", t, 340, 320, 0.03, 0.06, 0.18 * v);
      this.hit("snare", this.noise, t, 0.18, 0.42 * v, [["highpass", 1600], ["lowpass", 9500]]);
    }
    if (lane === "hihat") {
      this.hit("hihat", this.metal, t, 0.05, 0.2 * v, [["highpass", 7000], ["bandpass", 10000, 0.8]]);
      this.hit("hihat", this.noise, t, 0.035, 0.06 * v, [["highpass", 9000]]);
    }
    if (lane === "ride") {
      this.hit("ride", this.metal, t, 0.7, 0.13 * v, [["bandpass", 5200, 1.3]]);
      this.hit("ride", this.noise, t, 0.22, 0.04 * v, [["highpass", 7000]]);
    }
    if (lane === "crash") {
      this.hit("crash", this.noise, t, 1.6, 0.26 * v, [["highpass", 3500]]);
      this.hit("crash", this.metal, t, 1.2, 0.14 * v, [["highpass", 5000]]);
    }
  }
}
