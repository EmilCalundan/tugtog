import { DrumSounds } from "./drumSounds";

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

// Ang tunog ng buong banda (gitara, piano, bass, drums), gawa ng browser mismo.
export class BandSounds {
  readonly ctx: AudioContext;
  readonly drums: DrumSounds;
  private out: GainNode;
  private strings = new Map<number, AudioBuffer>();

  constructor() {
    this.ctx = new AudioContext();
    // Compressor para hindi pumutok ang tunog kapag sabay-sabay
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.connect(this.ctx.destination);
    this.out = this.ctx.createGain();
    this.out.gain.value = 0.7;
    this.out.connect(comp);
    this.drums = new DrumSounds(this.ctx, this.out);
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

  // Karplus-Strong: ingay na paulit-ulit na pinapalambot, kaya tunog kuwerdas na kinalabit
  private stringBuffer(midi: number): AudioBuffer {
    const cached = this.strings.get(midi);
    if (cached) return cached;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * 2.5);
    const buffer = this.ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    // Ang pag-average ng dalawang sample ay nagdadagdag ng kalahating sample na delay
    const n = Math.max(2, Math.round(rate / freq(midi) - 0.5));
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const decay = 0.996;
    for (let i = n; i < length; i++) {
      data[i] = decay * 0.5 * (data[i - n] + data[i - n - 1 < 0 ? 0 : i - n - 1]);
    }
    this.strings.set(midi, buffer);
    return buffer;
  }

  private pluck(midi: number, when: number, length: number, volume: number, tone = 3500) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.stringBuffer(midi);
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = tone;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.setTargetAtTime(0, when + length, 0.04);
    src.connect(filter).connect(gain).connect(this.out);
    src.start(when);
    src.stop(when + length + 0.3);
  }

  // Strum ng gitara: pababa (low E muna) o pataas (high e muna, mas mahina)
  strum(midis: (number | null)[], when: number, down: boolean, length: number) {
    const notes = midis.filter((m): m is number => m !== null);
    const order = down ? notes : notes.slice(-4).reverse();
    order.forEach((m, i) => this.pluck(m, when + i * 0.012, length, down ? 0.32 : 0.2));
  }

  // Piano: ilang harmonics na may mabilis na atake at dahan-dahang paghina
  piano(midis: number[], when: number, length: number, volume = 0.22) {
    for (const m of midis) {
      const f = freq(m);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(volume, when + 0.006);
      gain.gain.setTargetAtTime(volume * 0.35, when + 0.01, 0.25);
      gain.gain.setTargetAtTime(0, when + length, 0.08);
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = Math.min(6000, f * 6);
      filter.connect(gain).connect(this.out);
      [
        [1, "triangle", 1],
        [2, "sine", 0.35],
        [3, "sine", 0.12],
      ].forEach(([mult, type, level]) => {
        const osc = this.ctx.createOscillator();
        osc.type = type as OscillatorType;
        osc.frequency.value = f * (mult as number);
        const g = this.ctx.createGain();
        g.gain.value = level as number;
        osc.connect(g).connect(filter);
        osc.start(when);
        osc.stop(when + length + 0.5);
      });
    }
  }

  // Bass: kinalabit na makapal na kuwerdas, mababa ang tono
  bass(midi: number, when: number, length: number) {
    this.pluck(midi, when, length, 0.9, 900);
  }
}
