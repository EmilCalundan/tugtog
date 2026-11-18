import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useSession } from "../lib/useSession";
import { getSong } from "../lib/songs";
import type { Song } from "../lib/songs";
import { addToSetlist, listSetlists } from "../lib/setlists";
import type { Setlist } from "../lib/setlists";
import { KEYS, nashvilleText, suggestCapo, transposeText } from "../music/transpose";
import { SongView } from "../components/SongView";
import { StageMode } from "../components/StageMode";
import { GuitarPanel } from "../components/GuitarPanel";
import { PianoPanel } from "../components/PianoPanel";
import { BassPanel } from "../components/BassPanel";
import { DrumsPanel } from "../components/DrumsPanel";
import { PlayerBar } from "../components/PlayerBar";
import { beatsPerBar, ensureBand, useSongPlayer } from "../lib/useSongPlayer";
import type { Part } from "../lib/useSongPlayer";
import type { BandSounds } from "../lib/bandSounds";
import { barWindow, nextChord, sectionRanges, songBars } from "../music/timeline";
import { drumStyle } from "../music/arrangement";
import type { SongStyle, TimeSignature } from "../music/arrangement";
import { ui } from "../components/ui";
import { BackIcon, EditIcon } from "../components/Icons";
import { ArcHero } from "../components/ArcHero";

const SIZES = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl"];
const TABS = [
  { id: "chords", label: "Chords" },
  { id: "gitara", label: "Guitar" },
  { id: "piano", label: "Piano" },
  { id: "bass", label: "Bass" },
  { id: "drums", label: "Drums" },
] as const;
type Tab = (typeof TABS)[number]["id"];
const SAMPLE = "[Verse]\nG             D/F#\nSa liwanag Mo, ako'y lalakad\nEm            C\nHawak ang kamay Mo, di matatakot";

function load(name: string, fallback: string): string {
  try {
    return localStorage.getItem(name) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(name: string, value: string) {
  try {
    localStorage.setItem(name, value);
  } catch {
    // Walang problema kung hindi makapag-save
  }
}

// Ang page ng isang kanta. Kapag "scratch", kanta ito na nasa browser lang (para sa hindi naka-login)
export function SongPage({ scratch = false }: { scratch?: boolean }) {
  const { id } = useParams();
  const session = useSession();
  const [song, setSong] = useState<Song | null>(() =>
    scratch
      ? {
          id: "",
          owner_id: "",
          title: "Try it",
          artist: "",
          original_key: load("tugtog-from", "G"),
          content: load("tugtog-chords", SAMPLE),
          bpm: Number(load("tugtog-bpm", "72")) || 72,
          time_signature: load("tugtog-time", "4/4") === "6/8" ? "6/8" : "4/4",
          style: (["ballad", "pop", "rock", "reggae"].includes(load("tugtog-style", "")) ? load("tugtog-style", "") : "ballad") as SongStyle,
        }
      : null,
  );
  const [error, setError] = useState("");
  // Puwedeng buksan sa ibang key at tab, hal. mula sa setlist ng banda: ?key=A&tab=bass
  const [params] = useSearchParams();
  const [toKey, setToKey] = useState<string | null>(() => {
    const k = params.get("key");
    return k && KEYS.includes(k) ? k : null;
  });
  const [numbers, setNumbers] = useState(false);
  const [showCapo, setShowCapo] = useState(false);
  const [size, setSize] = useState(1);
  const [stage, setStage] = useState(false);
  const [setlists, setSetlists] = useState<Setlist[] | null>(null);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>(() => {
    const t = params.get("tab");
    return TABS.find((x) => x.id === t)?.id ?? "chords";
  });
  const [playing, setPlaying] = useState(false);
  // Ang tempo at style ay galing sa kanta; puwedeng baguhin dito habang nag-eensayo
  const [bpmOverride, setBpm] = useState<number | null>(null);
  const [styleOverride, setStyle] = useState<SongStyle | null>(null);
  const bpm = bpmOverride ?? song?.bpm ?? 72;
  const style = styleOverride ?? song?.style ?? "ballad";
  const time: TimeSignature = song?.time_signature ?? "4/4";
  const [fullBand, setFullBand] = useState(false);
  const bandSounds = useRef<BandSounds | null>(null);
  useEffect(() => () => bandSounds.current?.close(), []);

  // Ang mga chord ng kanta sa kasalukuyang key, mula simula hanggang dulo
  const soundingText = song ? transposeText(song.content, KEYS.indexOf(toKey ?? song.original_key) - KEYS.indexOf(song.original_key), toKey ?? song.original_key) : "";
  const bars = songBars(soundingText, beatsPerBar(time));
  // Pag-eensayo ng isang bahagi: saan magsisimula, at kung uulitin
  const ranges = sectionRanges(bars);
  const [startIndex, setStartIndex] = useState(-1);
  const [startBar, setStartBar] = useState<number | null>(null);
  const [loopOn, setLoopOn] = useState(false);
  const startRange = ranges[startIndex] ?? null;
  const range = { from: startBar ?? startRange?.start ?? 0, loop: loopOn && startRange ? startRange : null };
  const parts = new Set<Part>(fullBand ? ["gitara", "piano", "bass", "drums"] : tab === "gitara" || tab === "piano" || tab === "bass" ? [tab] : []);
  const { bar, chord: playingChord } = useSongPlayer(bandSounds, bars, { bpm, style, time }, parts, playing, range);
  const current = playing && playingChord ? playingChord : undefined;
  // Ang bar na ipinapakita: ang tumutunog, o kung saan magsisimula
  const shownBar = Math.min(playing ? bar : range.from, Math.max(bars.length - 1, 0));
  const shownChord = playing && playingChord ? playingChord : bars[shownBar]?.chords[0]?.chord ?? "";
  const upNext = nextChord(bars, shownBar, shownChord);

  function togglePlay() {
    if (!playing && !ensureBand(bandSounds)) return;
    setPlaying(!playing);
  }

  // Pindot sa isang bar sa arko: doon magsisimula (at doon lilipat kung tumutugtog na)
  function startAtBar(i: number) {
    const inRange = ranges.findIndex((r) => i >= r.start && i < r.end);
    if (startIndex >= 0 && inRange !== startIndex) {
      setStartIndex(-1);
      setLoopOn(false);
    }
    setStartBar(i);
  }

  // Sa Live mode: kapag walang napiling instrumento (Chords o Drums tab), ang buong banda ang tutugtog
  function toggleLive() {
    if (!playing && parts.size === 0) setFullBand(true);
    togglePlay();
  }

  useEffect(() => {
    if (scratch || !id) return;
    getSong(id).then(setSong).catch(() => setError("This song was not found."));
  }, [id, scratch]);

  if (error) {
    return (
      <div className={ui.page}>
        <p>{error}</p>
        <Link to="/" className={ui.secondary}>Back to songs</Link>
      </div>
    );
  }
  if (!song) return <div className={ui.page}><p className={ui.muted}>Loading song…</p></div>;

  const key = toKey ?? song.original_key;
  const semitones = KEYS.indexOf(key) - KEYS.indexOf(song.original_key);
  const text = numbers ? nashvilleText(song.content, song.original_key) : transposeText(song.content, semitones, key);
  const capo = suggestCapo(key);
  const shapeText = transposeText(song.content, KEYS.indexOf(capo.shape) - KEYS.indexOf(song.original_key), capo.shape);

  function step(direction: number) {
    setToKey(KEYS[(KEYS.indexOf(key) + direction + 12) % 12]);
  }

  // Para sa scratch: i-update ang kanta at tandaan sa browser
  function updateScratch(changes: Partial<Song>) {
    if (!song) return;
    const next = { ...song, ...changes };
    setSong(next);
    save("tugtog-chords", next.content);
    save("tugtog-from", next.original_key);
    save("tugtog-time", next.time_signature);
    save("tugtog-style", next.style);
    save("tugtog-bpm", String(next.bpm));
  }

  async function openSetlists() {
    setMessage("");
    setSetlists(await listSetlists().catch(() => []));
  }

  async function addTo(setlist: Setlist) {
    if (!song) return;
    try {
      await addToSetlist(setlist.id, song.id, key);
      setMessage(`Added to "${setlist.title}" in the key of ${key}.`);
    } catch {
      setMessage("Not added. Try again.");
    }
    setSetlists(null);
  }

  const playerTab = tab === "gitara" || tab === "piano" || tab === "bass";
  const first = barWindow(bars.length, shownBar, 6);
  const arcItems = bars.slice(first, first + 6).map((b, j) => {
    const i = first + j;
    return {
      label: `BAR ${i + 1}`,
      value: b.chords.map((c) => c.chord).join(" "),
      active: i === shownBar,
      ariaLabel: `Bar ${i + 1}: ${b.chords.map((c) => c.chord).join(" ")}${b.section ? `, ${b.section}` : ""}. Start here`,
      onSelect: () => startAtBar(i),
    };
  });
  const isOwner = !scratch && !!session && song.owner_id === session.user.id;

  return (
    <div className={ui.page}>
      <header className="flex items-center gap-2.5">
        <Link to="/" aria-label="Back to songs" className={ui.iconButton}>
          <BackIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium tracking-[0.12em] text-stone-400 uppercase">
            Key {key}{key !== song.original_key ? ` · original ${song.original_key}` : ""}{song.artist ? ` · ${song.artist}` : ""}
          </p>
          <h1 className="line-clamp-2 text-xl leading-tight font-medium md:text-2xl">{song.title}</h1>
        </div>
        <div role="group" aria-label="Mode" className="glass flex shrink-0 rounded-full p-1">
          <span aria-current="page" className="knob rounded-full px-3.5 py-1.5 text-xs font-semibold">Practice</span>
          <button type="button" onClick={() => setStage(true)} className="rounded-full px-3.5 py-1.5 text-xs font-medium text-stone-300 hover:text-stone-50">
            Live
          </button>
        </div>
      </header>

      {/* Mga kontrol: key, capo, numbers */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div role="group" aria-label="Key" className="glass flex h-11 shrink-0 items-center rounded-full">
          <button type="button" onClick={() => step(-1)} aria-label="Lower the key" className="h-11 w-11 text-xl text-stone-300">−</button>
          <span className="min-w-12 text-center leading-none">
            <span className="block text-[9px] font-medium tracking-[0.14em] text-stone-400 uppercase">Key</span>
            <span className="font-digit text-sm text-stone-50">{key}</span>
          </span>
          <button type="button" onClick={() => step(1)} aria-label="Raise the key" className="h-11 w-11 text-xl text-stone-300">+</button>
        </div>
        <button type="button" onClick={() => setShowCapo(!showCapo)} aria-pressed={showCapo} className={ui.chip}>
          {capo.capo === 0 ? "No capo" : `Capo ${capo.capo} · ${capo.shape}`}
        </button>
        <button type="button" onClick={() => setNumbers(!numbers)} aria-pressed={numbers} className={ui.chip}>
          1 2 3
        </button>
        {toKey && toKey !== song.original_key && (
          <button type="button" onClick={() => setToKey(null)} className="shrink-0 whitespace-nowrap px-2 text-sm font-medium text-stone-200 underline-offset-4 hover:underline">
            Back to {song.original_key}
          </button>
        )}
      </div>

      {/* Mga instrumento */}
      <nav aria-label="Instrument" className="glass -mx-1 flex gap-1 overflow-x-auto rounded-full p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              if (id === "chords" || id === "drums") setPlaying(false);
            }}
            aria-current={tab === id ? "page" : undefined}
            className={`h-9 flex-1 shrink-0 rounded-full px-3 text-sm ${tab === id ? "knob font-semibold" : "font-medium text-stone-300 hover:text-stone-50"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "chords" && showCapo && capo.capo > 0 && (
        <div className={`${ui.card} p-5`}>
          <p className="font-medium">Capo {capo.capo}, play the {capo.shape} shapes:</p>
          <SongView text={shapeText} className="mt-2 text-sm" />
        </div>
      )}

      {scratch && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-wrap items-center gap-2 text-sm font-medium text-stone-300">
            Original key
            <select
              value={song.original_key}
              onChange={(e) => updateScratch({ original_key: e.target.value })}
              className={`${ui.input} h-10 w-20 font-digit text-sm`}
            >
              {KEYS.map((k) => <option key={k}>{k}</option>)}
            </select>
            <select
              aria-label="Time signature"
              value={song.time_signature}
              onChange={(e) => updateScratch({ time_signature: e.target.value as TimeSignature })}
              className={`${ui.input} h-10 w-20 font-digit text-sm`}
            >
              <option>4/4</option>
              <option>6/8</option>
            </select>
          </label>
          <textarea
            aria-label="Chords and lyrics"
            rows={6}
            value={song.content}
            onChange={(e) => updateScratch({ content: e.target.value })}
            className="glass rounded-[24px] p-4 font-mono text-sm text-stone-100 focus:outline-none"
          />
        </div>
      )}

      {playerTab && bars.length > 0 && (
        <ArcHero items={arcItems} title="Bars of the song. Tap a bar to start there." height={272} centerY={92} guitar={null}>
          <span className="text-[11px] font-medium tracking-[0.2em] text-stone-400">{playing ? "NOW" : "START"}</span>
          <span className="mt-1 font-digit text-[40px] leading-tight text-stone-50 [text-shadow:0_0_24px_rgba(255,255,255,.25)]">{shownChord || "—"}</span>
          {upNext && <span className="mt-1 text-xs text-stone-400">next <span className="font-digit text-stone-200">{upNext}</span></span>}
        </ArcHero>
      )}

      {playerTab && (
        <PlayerBar
          playing={playing}
          onToggle={togglePlay}
          bpm={bpm}
          onBpm={setBpm}
          band={fullBand}
          onBand={setFullBand}
          bars={bars}
          bar={bar}
          chord={playingChord}
          next={playing ? upNext : shownChord}
          instrument={TABS.find((t) => t.id === tab)!.label.toLowerCase()}
          style={style}
          onStyle={setStyle}
          time={time}
          ranges={ranges}
          start={startIndex}
          startBar={startBar}
          onStart={(i) => {
            setStartIndex(i);
            setStartBar(null);
            if (i < 0) setLoopOn(false);
          }}
          loop={loopOn}
          onLoop={setLoopOn}
        />
      )}

      {tab === "gitara" ? (
        <GuitarPanel key={key} text={soundingText} shapeText={shapeText} capo={capo} current={current} />
      ) : tab === "piano" ? (
        <PianoPanel key={key} text={soundingText} current={current} />
      ) : tab === "bass" ? (
        <BassPanel key={key} text={soundingText} current={current} />
      ) : tab === "drums" ? (
        <DrumsPanel key={time} text={song.content} initialStyle={drumStyle(style, time)} initialBpm={bpm} />
      ) : (
        <article className={`${ui.card} overflow-x-auto p-5 md:p-8`}>
          <SongView text={text} className={`leading-relaxed ${SIZES[size]}`} />
        </article>
      )}

      {message && <p className="text-sm font-medium text-stone-100">{message}</p>}

      {setlists && (
        <div className={`${ui.card} flex flex-col gap-2 p-4`}>
          <p className="font-medium">Add to a setlist, key of {key}:</p>
          {setlists.length === 0 ? (
            <p className={ui.muted}>
              No setlists yet. <Link to="/setlist" className="font-medium text-stone-100 underline">Make one</Link>
            </p>
          ) : (
            setlists.map((sl) => (
              <button key={sl.id} type="button" onClick={() => addTo(sl)} className={`${ui.secondary} justify-start`}>
                {sl.title}
              </button>
            ))
          )}
        </div>
      )}

      {/* Mga kontrol na abot ng hinlalaki (sa Chords tab lang; may sariling console ang player at drums) */}
      {tab === "chords" && (
        <div className="glass sticky bottom-[92px] z-20 flex items-center gap-1.5 rounded-full p-1.5 md:bottom-6">
          <button type="button" onClick={() => setSize(Math.max(0, size - 1))} disabled={size === 0} aria-label="Smaller text" className={`${ui.iconButton} border-0 bg-transparent`}>
            <span className="text-sm font-semibold">A−</span>
          </button>
          <button type="button" onClick={() => setSize(Math.min(SIZES.length - 1, size + 1))} disabled={size === SIZES.length - 1} aria-label="Bigger text" className={`${ui.iconButton} border-0 bg-transparent`}>
            <span className="text-base font-semibold">A+</span>
          </button>
          <span className="flex-1" />
          {isOwner && (
            <Link to={`/kanta/${song.id}/edit`} aria-label="Edit song" className={`${ui.iconButton} border-0 bg-transparent`}>
              <EditIcon />
            </Link>
          )}
          {isOwner && (
            <button type="button" onClick={openSetlists} className={`${ui.secondary} h-11 whitespace-nowrap px-4`}>
              + Setlist
            </button>
          )}
          <button type="button" onClick={() => setStage(true)} className={`${ui.primary} h-11 whitespace-nowrap px-5`}>
            Live mode
          </button>
        </div>
      )}

      {stage && (
        <StageMode
          text={text}
          title={song.title}
          subtitle={`Key ${key} · ${bpm} BPM`}
          player={{
            playing,
            chord: shownChord,
            next: upNext,
            status: `${bars[shownBar]?.section ? `${bars[shownBar].section} · ` : ""}Bar ${shownBar + 1} of ${bars.length}`,
            onToggle: toggleLive,
          }}
          onClose={() => setStage(false)}
        />
      )}
    </div>
  );
}
