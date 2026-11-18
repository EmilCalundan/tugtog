import { useEffect, useRef, useState } from "react";
import { SongView } from "./SongView";
import { PAUSE, PLAY, SlideButton } from "./SlideButton";

// Kapag galing sa isang kanta, kasama ang player: ang chord ngayon at ang susunod
export type LivePlayer = {
  playing: boolean;
  chord: string;
  next: string;
  status: string; // hal. "Verse · Bar 3 of 6"
  onToggle: () => void;
};

type StageModeProps = {
  text: string;
  title: string;
  subtitle?: string;
  player?: LivePlayer;
  onClose: () => void;
};

const SIZES = ["text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"];
const round = "glass inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-medium disabled:opacity-40";

// Live mode: buong-screen, madilim, malaking text at auto-scroll.
// Sa ibaba ang glass card na NOW at NEXT kapag tumutugtog ang player.
export function StageMode({ text, title, subtitle, player, onClose }: StageModeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(2);
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(30); // pixels bawat segundo

  // Auto-scroll habang naka-on
  useEffect(() => {
    if (!scrolling) return;

    let frame = 0;
    let last = performance.now();

    function step(now: number) {
      const box = scrollRef.current;
      if (box) box.scrollTop += (speed * (now - last)) / 1000;
      last = now;
      frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [scrolling, speed]);

  // Keyboard: Esc para isara, Space para sa player (o sa scroll kung walang player)
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === " ") {
        event.preventDefault();
        if (player) player.onToggle();
        else setScrolling((s) => !s);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, player]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Live mode: ${title}`} className="app-bg fixed inset-0 z-50 flex flex-col text-stone-100">
      <header className="flex items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <div className="mr-auto min-w-0">
          <p className="truncate text-[11px] font-medium tracking-[0.12em] text-stone-400 uppercase">{subtitle ? `Live · ${subtitle}` : "Live"}</p>
          <h2 className="truncate text-lg font-medium">{title || "Live mode"}</h2>
        </div>
        <button type="button" className={round} onClick={() => setSize(size - 1)} disabled={size === 0} aria-label="Smaller text">A−</button>
        <button type="button" className={round} onClick={() => setSize(size + 1)} disabled={size === SIZES.length - 1} aria-label="Bigger text">A+</button>
        <button type="button" className={round} onClick={onClose} aria-label="Close live mode">✕</button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 sm:px-10">
        <SongView text={text} className={`mx-auto max-w-4xl leading-relaxed ${SIZES[size]}`} />
        <div className="h-[50vh]" aria-hidden="true" />
      </div>

      <section className="glass mx-3 mb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-4 rounded-[34px] p-4 pt-5 sm:mx-auto sm:w-[520px]">
        {player && (
          <div className="flex items-end justify-between gap-4 px-1">
            <div className="min-w-0">
              <div className="text-[11px] font-medium tracking-[0.14em] text-stone-300 uppercase">Now</div>
              <div className="truncate font-digit text-[56px] leading-[1.1] text-stone-50">{player.chord || "—"}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[11px] font-medium tracking-[0.14em] text-stone-400 uppercase">Next</div>
              <div className="font-digit text-3xl text-stone-300">{player.next || "—"}</div>
            </div>
          </div>
        )}
        {player ? (
          <SlideButton icon={player.playing ? PAUSE : PLAY} label={player.playing ? player.status : "Play along"} ariaLabel={player.playing ? "Pause" : "Play along"} onClick={player.onToggle} />
        ) : (
          <SlideButton icon={scrolling ? PAUSE : PLAY} label={scrolling ? "Scrolling" : "Auto-scroll"} onClick={() => setScrolling(!scrolling)} />
        )}
        <div className="flex items-center gap-3 px-1">
          {player && (
            <button
              type="button"
              onClick={() => setScrolling(!scrolling)}
              aria-pressed={scrolling}
              className={`h-9 shrink-0 rounded-full border px-4 text-xs font-semibold tracking-[0.08em] uppercase ${scrolling ? "border-white/70 bg-white/15" : "border-white/12 text-stone-400"}`}
            >
              Scroll
            </button>
          )}
          <label className="flex min-w-0 flex-1 items-center gap-3 text-xs text-stone-400">
            Speed
            <input type="range" min={10} max={120} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="min-w-0 flex-1 accent-white" />
          </label>
        </div>
      </section>
    </div>
  );
}
