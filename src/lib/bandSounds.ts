import { DrumSounds } from "./drumSounds";

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const rand = (spread: number) => (Math.random() * 2 - 1) * spread;

// Reverb na parang maliit na kuwarto o simbahan: ingay na humihina, bahagyang iba ang kaliwa at kanan
function roomImpulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  const predelay = Math.floor(rate * 0.012);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let low = 0;
    for (let i = predelay; i < length; i++) {
      const t = (i - predelay) / rate;
      // Mas mabilis maglaho ang matataas na tunog, kaya pinapalambot habang tumatagal
      const smooth = Math.min(0.92, 0.25 + t * 0.6);
      low = smooth * low + (1 - smooth) * (Math.random() * 2 - 1);
      data[i] = low * Math.exp(-t * (6.9 / seconds)) * 1.6;
    }
  }
  return buffer;
}

// Ang "katawan" ng isang instrumento: EQ, puwesto sa kaliwa/kanan, at kung gaano kalakas sa reverb
type Bus = { input: GainNode };

// Ang tunog ng buong banda (gitara, piano, bass, drums), gawa ng browser mismo
export class BandSounds {
  readonly ctx: AudioContext;
  readonly drums: DrumSounds;
  private master: GainNode;
  private reverb: ConvolverNode;
  private guitarBus: Bus;
  private pianoBus: Bus;
  private bassBus: Bus;
  private strings = new Map<string, AudioBuffer>();
  private noise: AudioBuffer;
  private pianoWave: PeriodicWave;

  constructor() {
    this.ctx = new AudioContext({ latencyHint: "interactive" });
    const ctx = this.ctx;

    // Master: compressor para pantay, tapos limiter para hindi pumutok (clipping)
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.006;
    comp.release.value = 0.2;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.08;
    this.master = ctx.createGain();
    this.master.gain.value = 0.75;
    this.master.connect(comp).connect(limiter).connect(ctx.destination);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = roomImpulse(ctx, 1.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    this.reverb.connect(wet).connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const n = this.noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;

    // Gitara: resonance ng kahoy (mababa), kinang ng kuwerdas, bahagyang nasa kaliwa
    this.guitarBus = this.bus(-0.3, 0.22, [
      ["peaking", 105, 1.1, 4],
      ["peaking", 230, 1.4, 1.5],
      ["peaking", 2900, 0.9, 2.5],
      ["highshelf", 8000, 0.7, -3],
    ]);
    // Piano: bahagyang nasa kanan, mas maraming reverb
    this.pianoBus = this.bus(0.25, 0.28, [["highshelf", 5000, 0.7, -1.5]]);
    // Bass: sa gitna, malalim, halos walang reverb
    this.bassBus = this.bus(0, 0.03, [
      ["lowshelf", 90, 0.7, 1.5],
      ["lowpass", 2600, 0.7, 0],
    ]);
    const drumBus = this.bus(0, 0.13, []);
    this.drums = new DrumSounds(ctx, drumBus.input);

    // Ang hugis ng tunog ng piano: maraming harmonics na humihina pataas
    const size = 16;
    const real = new Float32Array(size);
    const imag = new Float32Array(size);
    for (let h = 1; h < size; h++) imag[h] = (1 / Math.pow(h, 1.15)) * (h % 2 === 0 ? 0.8 : 1);
    this.pianoWave = ctx.createPeriodicWave(real, imag);
  }

  private bus(pan: number, send: number, eq: [BiquadFilterType, number, number, number][]): Bus {
    const ctx = this.ctx;
    const input = ctx.createGain();
    let node: AudioNode = input;
    for (const [type, f, q, gain] of eq) {
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = f;
      filter.Q.value = q;
      filter.gain.value = gain;
      node.connect(filter);
      node = filter;
    }
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    node.connect(panner).connect(this.master);
    if (send > 0) {
      const toVerb = ctx.createGain();
      toVerb.gain.value = send;
      node.connect(toVerb).connect(this.reverb);
    }
    return { input };
  }

  get now(): number {
    return this.ctx.currentTime;
  }

  resume() {
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  close() {
    void this.ctx.close();
  }

  // Karplus-Strong: maikling ingay na paulit-ulit na pinapalambot, kaya tunog kuwerdas na kinalabit.
  // May 3 bersyon bawat nota para hindi magkakapareho ang bawat kalabit.
  private stringBuffer(midi: number, kind: "guitar" | "bass", variant: number): AudioBuffer {
    const id = `${kind}:${midi}:${variant}`;
    const cached = this.strings.get(id);
    if (cached) return cached;
    const rate = this.ctx.sampleRate;
    const seconds = kind === "bass" ? 3 : 3.2;
    const length = Math.floor(rate * seconds);
    const buffer = this.ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    // "Stretch": minsan lang pinapalambot, kaya mas matagal ang kinang ng kuwerdas
    const stretch = kind === "bass" ? 0.5 : 0.62;
    // Ang pagpapalambot ay nagdadagdag ng (1 - stretch) na sample na delay, kaya ibinabawas para tama ang tono
    const n = Math.max(2, Math.round(rate / freq(midi) - (1 - stretch)));

    // Ang unang "kalabit"
    let burst = Array.from({ length: n }, () => Math.random() * 2 - 1);
    // Kung saan kinalabit ang kuwerdas (malapit sa bridge = mas matinis)
    const pick = Math.max(1, Math.round(n * (kind === "bass" ? 0.22 : 0.12 + variant * 0.025)));
    burst = burst.map((v, i) => v - 0.85 * burst[(i - pick + n) % n]);
    const passes = kind === "bass" ? 5 : 2;
    for (let pass = 0; pass < passes; pass++) {
      const first = burst[0];
      for (let i = 0; i < n - 1; i++) burst[i] = 0.5 * (burst[i] + burst[i + 1]);
      burst[n - 1] = 0.5 * (burst[n - 1] + first);
    }
    const mean = burst.reduce((a, b) => a + b, 0) / n;
    const peak = Math.max(...burst.map((v) => Math.abs(v - mean))) || 1;
    for (let i = 0; i < n; i++) data[i] = (burst[i] - mean) / peak;

    // Mas matagal tumunog ang mabababang kuwerdas
    const decay = kind === "bass" ? 0.9985 : Math.min(0.9978, 0.9992 - (midi - 40) * 0.00004);
    for (let i = n; i < length; i++) {
      const a = data[i - n];
      const b = i - n - 1 < 0 ? a : data[i - n - 1];
      data[i] = decay * (stretch * a + (1 - stretch) * b);
    }
    this.strings.set(id, buffer);
    return buffer;
  }

  private pluck(midi: number, kind: "guitar" | "bass", when: number, length: number, volume: number, tone: number, out: AudioNode) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.stringBuffer(midi, kind, Math.floor(Math.random() * 3));
    // Bahagyang iba ang tono ng bawat kalabit, gaya ng totoong kamay
    src.detune.value = rand(3);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = tone;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.setTargetAtTime(0, when + length, kind === "bass" ? 0.05 : 0.07);
    src.connect(filter).connect(gain).connect(out);
    src.start(when);
    src.stop(when + length + 0.5);
  }

  // Maikling ingay: tunog ng pick sa kuwerdas, o ng daliri sa bass
  private noiseHit(when: number, length: number, type: BiquadFilterType, f: number, volume: number, out: AudioNode) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = f;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0005, when + length);
    src.connect(filter).connect(gain).connect(out);
    src.start(when, Math.random() * 0.5);
    src.stop(when + length + 0.02);
  }

  // Strum ng gitara: pababa (low E muna) o pataas (high e muna, ilang kuwerdas lang, mas mahina)
  // `mute`: maikling "chuck" na pinipigilan ng palad, gaya ng sa reggae
  strum(midis: (number | null)[], when: number, down: boolean, length: number, mute = false) {
    const out = this.guitarBus.input;
    const notes = midis.filter((m): m is number => m !== null);
    const order = down ? notes : notes.slice(-4).reverse();
    const start = when + rand(0.004);
    if (mute) {
      order.forEach((m, i) => this.pluck(m, "guitar", start + i * 0.005, 0.035, 0.28, 1300, out));
      this.noiseHit(start, 0.03, "bandpass", 900, 0.25, out);
      return;
    }
    // Bilis ng strum: ~30 ms pababa, ~20 ms pataas, may kaunting pagkakaiba bawat palo
    const spread = (down ? 0.03 : 0.02) * (1 + rand(0.2));
    const each = spread / Math.max(order.length - 1, 1);
    const level = down ? 0.3 : 0.2;
    order.forEach((m, i) => {
      const t = start + i * each + rand(0.0015);
      const v = level * (1 - i * 0.03) * (1 + rand(0.08));
      const tone = (down ? 4200 : 5200) + rand(500);
      this.pluck(m, "guitar", t, length, v, tone, out);
    });
    this.noiseHit(start, 0.012, "highpass", 3500, down ? 0.05 : 0.04, out);
  }

  // Piano: martilyo na tumatama sa kuwerdas. Maliwanag sa simula, tapos dahan-dahang dumidilim at humihina.
  piano(midis: number[], when: number, length: number, volume = 0.22) {
    const ctx = this.ctx;
    const out = this.pianoBus.input;
    for (const m of midis) {
      const f = freq(m);
      const t = when + rand(0.003);
      const v = volume * 0.55 * (1 + rand(0.06));
      // Mas matagal ang mabababang nota
      const sustain = Math.min(4, Math.max(0.7, 2.6 * Math.pow(2, (52 - m) / 20)));

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 0.6;
      filter.frequency.setValueAtTime(Math.min(16000, f * 12 + 1800), t);
      filter.frequency.setTargetAtTime(Math.min(9000, f * 5 + 700), t + 0.01, 0.6);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(v, t + 0.004);
      gain.gain.setTargetAtTime(v * 0.38, t + 0.006, 0.1);
      gain.gain.setTargetAtTime(0, t + 0.3, sustain);
      // Pagbitaw ng key: tumitigil ang kuwerdas (damper)
      gain.gain.cancelScheduledValues(t + Math.max(length, 0.32));
      gain.gain.setTargetAtTime(0, t + Math.max(length, 0.32), 0.12);
      filter.connect(gain).connect(out);

      // Dalawang "kuwerdas" na bahagyang magkaiba ang tono, gaya ng sa totoong piano (chorus)
      for (const cents of [-1.2, 1.4]) {
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(this.pianoWave);
        osc.frequency.value = f;
        osc.detune.value = cents;
        osc.connect(filter);
        osc.start(t);
        osc.stop(t + Math.max(length, 0.32) + 0.8);
      }
      // Tunog ng martilyo
      this.noiseHit(t, 0.015, "bandpass", Math.min(5000, f * 5), v * 0.35, out);
    }
  }

  // Bass: makapal na kuwerdas na kinalabit ng daliri, may malalim na "katawan"
  bass(midi: number, when: number, length: number) {
    const ctx = this.ctx;
    const out = this.bassBus.input;
    const t = when + rand(0.003);
    this.pluck(midi, "bass", t, length, 0.5, 1500, out);
    // Ang katawan: purong mababang tono sa ilalim ng kuwerdas
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq(midi);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.008);
    gain.gain.setTargetAtTime(0.14, t + 0.01, 0.25);
    gain.gain.setTargetAtTime(0, t + length, 0.05);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + length + 0.4);
    // Ang daliri sa kuwerdas
    this.noiseHit(t, 0.02, "lowpass", 700, 0.12, out);
  }
}
