import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
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
import { ui } from "../components/ui";
import { BackIcon, EditIcon, ExpandIcon } from "../components/Icons";

const SIZES = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl"];
const TABS = [
  { id: "chords", label: "Chords" },
  { id: "gitara", label: "Gitara" },
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
      ? { id: "", title: "Subukan", artist: "", original_key: load("tugtog-from", "G"), content: load("tugtog-chords", SAMPLE) }
      : null,
  );
  const [error, setError] = useState("");
  const [toKey, setToKey] = useState<string | null>(null);
  const [numbers, setNumbers] = useState(false);
  const [showCapo, setShowCapo] = useState(false);
  const [size, setSize] = useState(1);
  const [stage, setStage] = useState(false);
  const [setlists, setSetlists] = useState<Setlist[] | null>(null);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("chords");

  useEffect(() => {
    if (scratch || !id) return;
    getSong(id).then(setSong).catch(() => setError("Hindi mahanap ang kantang ito."));
  }, [id, scratch]);

  if (error) {
    return (
      <div className={ui.page}>
        <p>{error}</p>
        <Link to="/" className={ui.secondary}>Bumalik sa mga kanta</Link>
      </div>
    );
  }
  if (!song) return <div className={ui.page}><p className={ui.muted}>Kinukuha ang kanta…</p></div>;

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
  }

  async function openSetlists() {
    setMessage("");
    setSetlists(await listSetlists().catch(() => []));
  }

  async function addTo(setlist: Setlist) {
    if (!song) return;
    try {
      await addToSetlist(setlist.id, song.id, key);
      setMessage(`Naidagdag sa "${setlist.title}", key ng ${key}.`);
    } catch {
      setMessage("Hindi naidagdag. Subukan ulit.");
    }
    setSetlists(null);
  }

  return (
    <div className={ui.page}>
      <header className="flex items-center gap-2">
        <Link to="/" aria-label="Bumalik sa mga kanta" className={`${ui.iconButton} -ml-3`}>
          <BackIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-bold tracking-tight md:text-3xl">{song.title}</h1>
          <p className={ui.muted}>
            {song.artist ? `${song.artist} · ` : ""}orihinal na key {song.original_key}
          </p>
        </div>
        {!scratch && (
          <Link to={`/kanta/${song.id}/edit`} aria-label="I-edit ang kanta" className={ui.iconButton}>
            <EditIcon />
          </Link>
        )}
      </header>

      {/* Mga kontrol: key, capo, numbers */}
      <div className="-mx-5 flex items-center gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
        <div role="group" aria-label="Key" className="flex h-12 shrink-0 items-center rounded-xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
          <button type="button" onClick={() => step(-1)} aria-label="Ibaba ang key" className="h-12 w-12 text-xl">−</button>
          <span className="min-w-14 text-center leading-tight">
            <span className="block text-[10px] font-semibold tracking-widest text-stone-500 uppercase">Key</span>
            <span className="font-mono text-lg font-bold text-amber-700 dark:text-amber-400">{key}</span>
          </span>
          <button type="button" onClick={() => step(1)} aria-label="Itaas ang key" className="h-12 w-12 text-xl">+</button>
        </div>
        <button
          type="button"
          onClick={() => setShowCapo(!showCapo)}
          aria-pressed={showCapo}
          className={`${ui.chip} ${showCapo ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10" : ""}`}
        >
          {capo.capo === 0 ? "Walang capo" : `Capo ${capo.capo} · ${capo.shape}`}
        </button>
        <button
          type="button"
          onClick={() => setNumbers(!numbers)}
          aria-pressed={numbers}
          className={`${ui.chip} ${numbers ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10" : ""}`}
        >
          1 2 3
        </button>
        {toKey && toKey !== song.original_key && (
          <button type="button" onClick={() => setToKey(null)} className="shrink-0 whitespace-nowrap text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
            Ibalik sa {song.original_key}
          </button>
        )}
      </div>

      {/* Mga instrumento */}
      <nav aria-label="Instrumento" className="flex gap-1 overflow-x-auto border-b border-stone-200 dark:border-stone-800">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`px-3 pt-2 pb-3 ${tab === id ? "border-b-2 border-amber-500 font-semibold" : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "chords" && showCapo && capo.capo > 0 && (
        <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
          <p className="font-semibold">Capo {capo.capo}, gamitin ang {capo.shape} shapes:</p>
          <SongView text={shapeText} className="mt-2 text-sm" />
        </div>
      )}

      {scratch && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-600 dark:text-stone-300">
            Orihinal na key
            <select
              value={song.original_key}
              onChange={(e) => updateScratch({ original_key: e.target.value })}
              className="h-10 rounded-lg border border-stone-200 bg-white px-2 font-mono font-bold dark:border-stone-700 dark:bg-stone-900"
            >
              {KEYS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <textarea
            aria-label="Chords at lyrics"
            rows={6}
            value={song.content}
            onChange={(e) => updateScratch({ content: e.target.value })}
            className="rounded-xl border border-stone-200 bg-white p-3 font-mono text-sm dark:border-stone-700 dark:bg-stone-900"
          />
        </div>
      )}

      {tab === "gitara" ? (
        <GuitarPanel key={key} text={transposeText(song.content, semitones, key)} shapeText={shapeText} capo={capo} />
      ) : tab === "piano" ? (
        <PianoPanel key={key} text={transposeText(song.content, semitones, key)} />
      ) : tab === "bass" ? (
        <BassPanel key={key} text={transposeText(song.content, semitones, key)} />
      ) : tab === "drums" ? (
        <DrumsPanel text={song.content} />
      ) : (
        <article className={`${ui.card} overflow-x-auto p-5 md:p-8`}>
          <SongView text={text} className={`leading-relaxed ${SIZES[size]}`} />
        </article>
      )}

      {message && <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">{message}</p>}

      {setlists && (
        <div className={`${ui.card} flex flex-col gap-2 p-4`}>
          <p className="font-semibold">Idagdag sa setlist, key ng {key}:</p>
          {setlists.length === 0 ? (
            <p className={ui.muted}>
              Wala ka pang setlist. <Link to="/setlist" className="font-semibold text-amber-700 underline">Gumawa ng isa</Link>
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

      {/* Mga kontrol sa pagtugtog, abot ng hinlalaki */}
      <div className="sticky bottom-24 z-20 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-lg shadow-stone-900/10 backdrop-blur md:bottom-6 dark:border-stone-700 dark:bg-stone-900/95">
        <button type="button" onClick={() => setSize(Math.max(0, size - 1))} disabled={size === 0} aria-label="Paliitin ang text" className={ui.iconButton}>
          <span className="text-sm font-bold">A−</span>
        </button>
        <button type="button" onClick={() => setSize(Math.min(SIZES.length - 1, size + 1))} disabled={size === SIZES.length - 1} aria-label="Palakihin ang text" className={ui.iconButton}>
          <span className="text-lg font-bold">A+</span>
        </button>
        <span className="flex-1" />
        {!scratch && session && (
          <button type="button" onClick={openSetlists} className={`${ui.secondary} h-11 whitespace-nowrap px-3`}>
            + Setlist
          </button>
        )}
        <button type="button" onClick={() => setStage(true)} className={`${ui.primary} h-11 px-4`}>
          <ExpandIcon /> Stage
        </button>
      </div>

      {stage && <StageMode text={text} title={`${song.title} · ${key}`} onClose={() => setStage(false)} />}
    </div>
  );
}
