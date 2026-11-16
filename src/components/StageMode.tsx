import { useEffect, useRef, useState } from "react";
import { SongView } from "./SongView";

type StageModeProps = {
  text: string;
  title: string;
  onClose: () => void;
};

const SIZES = ["text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"];

// Buong-screen na view para sa pagtugtog: malaking text at auto-scroll
export function StageMode({ text, title, onClose }: StageModeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(30); // pixels bawat segundo

  // Auto-scroll habang naka-play
  useEffect(() => {
    if (!playing) return;

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
  }, [playing, speed]);

  // Keyboard: Esc para isara, Space para play o pause
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const buttonClass =
    "rounded-lg border border-stone-300 bg-white px-3 py-2 font-bold hover:border-amber-500 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <h2 className="mr-auto min-w-0 truncate text-lg font-black">{title || "Stage mode"}</h2>

        <button type="button" className={buttonClass} onClick={() => setSize(size - 1)} disabled={size === 0} aria-label="Paliitin ang text">
          A−
        </button>
        <button type="button" className={buttonClass} onClick={() => setSize(size + 1)} disabled={size === SIZES.length - 1} aria-label="Palakihin ang text">
          A+
        </button>

        <button type="button" className={`${buttonClass} min-w-24`} onClick={() => setPlaying(!playing)}>
          {playing ? "⏸ Pause" : "▶ Scroll"}
        </button>
        <label className="flex items-center gap-2 text-sm">
          Bilis
          <input
            type="range"
            min={10}
            max={120}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-24 accent-amber-500"
          />
        </label>

        <button type="button" className={buttonClass} onClick={onClose} aria-label="Isara ang stage mode">
          ✕
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-10">
        <SongView text={text} className={`mx-auto max-w-4xl leading-relaxed ${SIZES[size]}`} />
        <div className="h-[60vh]" aria-hidden="true" />
      </div>
    </div>
  );
}
