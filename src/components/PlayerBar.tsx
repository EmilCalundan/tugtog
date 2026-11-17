import { useRef } from "react";
import { tapTempo } from "../music/drums";
import type { TimelineItem } from "../music/timeline";
import { SONG_STYLES } from "../music/arrangement";
import type { SongStyle, TimeSignature } from "../music/arrangement";

type Props = {
  playing: boolean;
  onToggle: () => void;
  bpm: number;
  onBpm: (bpm: number) => void;
  band: boolean;
  onBand: (band: boolean) => void;
  timeline: TimelineItem[];
  bar: number;
  instrument: string;
  style: SongStyle;
  onStyle: (style: SongStyle) => void;
  time: TimeSignature;
};

// Kontrol sa pagtugtog ng kanta: play, tempo, tap, at "buong banda"
export function PlayerBar({ playing, onToggle, bpm, onBpm, band, onBand, timeline, bar, instrument, style, onStyle, time }: Props) {
  const taps = useRef<number[]>([]);
  function tap() {
    const now = performance.now();
    const last = taps.current[taps.current.length - 1];
    if (last !== undefined && now - last > 2000) taps.current = [];
    taps.current.push(now);
    const found = tapTempo(taps.current);
    if (found !== null) onBpm(found);
  }

  if (timeline.length === 0) return null;
  const item = timeline[Math.min(bar, timeline.length - 1)];

  return (
    <section aria-label="Patugtugin ang kanta" className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "I-pause" : `Patugtugin ang kanta sa ${band ? "buong banda" : instrument}`}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-stone-900"
        >
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
          )}
        </button>
        <div className="min-w-0 flex-1" aria-live="off">
          <div className="truncate text-sm font-semibold">
            {playing ? (
              <>Bar {bar + 1} / {timeline.length}{item.section && ` · ${item.section}`} · <span className="font-mono text-amber-700 dark:text-amber-400">{item.chord}</span></>
            ) : (
              <>Patugtugin sa {band ? "buong banda" : instrument}</>
            )}
          </div>
          <div className="text-xs text-stone-500">Bawat chord = isang bar · {time} · {bpm} BPM</div>
        </div>
        <button type="button" onClick={tap} aria-label="Tap tempo: i-tap kasabay ng beat" className="h-11 shrink-0 rounded-xl border border-stone-200 px-3 text-sm font-bold active:bg-amber-100 dark:border-stone-700 dark:active:bg-amber-500/20">
          Tap
        </button>
      </div>
      <div className="flex items-center gap-3">
        <input type="range" min={40} max={160} value={bpm} onChange={(e) => onBpm(Number(e.target.value))} aria-label="Tempo" className="min-w-0 flex-1 accent-amber-500" />
        {time === "4/4" && (
          <select value={style} onChange={(e) => onStyle(e.target.value as SongStyle)} aria-label="Strum style" className="h-9 shrink-0 rounded-lg border border-stone-200 bg-white px-2 text-sm font-semibold dark:border-stone-700 dark:bg-stone-900">
            {SONG_STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        )}
        <label className="flex shrink-0 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={band} onChange={(e) => onBand(e.target.checked)} className="size-4 accent-amber-500" />
          Buong banda
        </label>
      </div>
    </section>
  );
}
