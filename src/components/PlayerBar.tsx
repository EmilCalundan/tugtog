import { useRef } from "react";
import { tapTempo } from "../music/drums";
import type { Bar, SectionRange } from "../music/timeline";
import { SONG_STYLES } from "../music/arrangement";
import type { SongStyle, TimeSignature } from "../music/arrangement";
import { PAUSE, PLAY, SlideButton } from "./SlideButton";

type Props = {
  playing: boolean;
  onToggle: () => void;
  bpm: number;
  onBpm: (bpm: number) => void;
  band: boolean;
  onBand: (band: boolean) => void;
  bars: Bar[];
  bar: number;
  chord: string;
  next: string;
  instrument: string;
  style: SongStyle;
  onStyle: (style: SongStyle) => void;
  time: TimeSignature;
  ranges: SectionRange[];
  start: number; // -1 = buong kanta
  startBar: number | null; // kapag pinindot ang isang bar sa arko
  onStart: (index: number) => void;
  loop: boolean;
  onLoop: (loop: boolean) => void;
};

// Isang pill na on/off, may LED. Totoong checkbox sa ilalim, para sa keyboard at screen reader.
function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled?: boolean; onChange: (on: boolean) => void }) {
  return (
    <label
      className={`relative flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold tracking-[0.08em] uppercase ${
        checked ? "border-white/70 bg-white/15 text-stone-50" : "border-white/12 bg-white/[0.04] text-stone-400"
      } ${disabled ? "opacity-40" : "cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white"}`}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="absolute inset-0 cursor-pointer opacity-0" />
      <i aria-hidden="true" className={`block size-2 rounded-full ${checked ? "glow bg-white" : "bg-stone-600"}`} />
      {label}
    </label>
  );
}

// Ang console ng player (v4): kalagayan, mga numero, at ang malaking slide button
export function PlayerBar({ playing, onToggle, bpm, onBpm, band, onBand, bars, bar, chord, next, instrument, style, onStyle, time, ranges, start, startBar, onStart, loop, onLoop }: Props) {
  const taps = useRef<number[]>([]);
  function tap() {
    const now = performance.now();
    const last = taps.current[taps.current.length - 1];
    if (last !== undefined && now - last > 2000) taps.current = [];
    taps.current.push(now);
    const found = tapTempo(taps.current);
    if (found !== null) onBpm(found);
  }

  if (bars.length === 0) return null;
  const section = bars[Math.min(bar, bars.length - 1)].section;
  const who = band ? "full band" : instrument;
  const from = startBar !== null ? `bar ${startBar + 1}` : start >= 0 ? ranges[start]?.name : null;
  const status = playing
    ? `${section ? `${section} · ` : ""}Bar ${bar + 1} of ${bars.length}`
    : `${bars.length} bars${from ? ` · from ${from}` : ""}`;

  return (
    <section aria-label="Play the song" className="glass flex flex-col gap-4 rounded-[32px] p-4 pt-5">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="min-w-0 truncate text-xs font-medium tracking-[0.1em] text-stone-300 uppercase" aria-live="off">{status}</p>
        <button type="button" onClick={tap} aria-label="Tap tempo: tap along with the beat" className="h-9 shrink-0 rounded-full border border-white/15 px-4 text-xs font-semibold tracking-[0.1em] uppercase active:bg-white/25">
          Tap
        </button>
      </div>

      <dl className="grid grid-cols-3 px-1">
        <div>
          <dt className="text-[11px] text-stone-400">{playing ? "Now" : "Next"}</dt>
          <dd className="mt-1.5 truncate font-digit text-lg text-stone-50">{(playing ? chord : next) || "—"}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-stone-400">Tempo</dt>
          <dd className="mt-1.5 font-digit text-lg text-stone-50">{bpm}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-stone-400">Time</dt>
          <dd className="mt-1.5 font-digit text-lg text-stone-50">{time}</dd>
        </div>
      </dl>

      <SlideButton
        icon={playing ? PAUSE : PLAY}
        label={playing ? `Playing · ${who}` : `Play · ${who}`}
        ariaLabel={playing ? "Pause" : `Play the song on ${who}`}
        onClick={onToggle}
      />

      <div className="flex items-center gap-3 px-1">
        <input type="range" min={40} max={160} value={bpm} onChange={(e) => onBpm(Number(e.target.value))} aria-label="Tempo" className="min-w-0 flex-1 accent-white" />
        {time === "4/4" && (
          <select value={style} onChange={(e) => onStyle(e.target.value as SongStyle)} aria-label="Strum style" className="h-9 shrink-0 rounded-full border border-white/12 bg-black/30 px-3 text-sm text-stone-100">
            {SONG_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Toggle label="Full band" checked={band} onChange={onBand} />
        {ranges.length > 1 && <Toggle label="Loop" checked={loop && start >= 0} disabled={start < 0} onChange={onLoop} />}
        {ranges.length > 1 && (
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-stone-400">
            <span className="shrink-0">Start from</span>
            <select
              value={start}
              onChange={(e) => onStart(Number(e.target.value))}
              className="h-10 min-w-0 flex-1 rounded-full border border-white/12 bg-black/30 px-3 text-sm text-stone-100"
            >
              <option value={-1}>Whole song</option>
              {ranges.map((r, i) => (
                <option key={r.name} value={i}>{r.name} · bar {r.start + 1}</option>
              ))}
            </select>
          </label>
        )}
      </div>
    </section>
  );
}
